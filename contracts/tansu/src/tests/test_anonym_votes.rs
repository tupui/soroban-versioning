use core::ops::Add;
use soroban_sdk::crypto::bls12_381::{Fr, G1Affine};
use soroban_sdk::{Bytes, Env, U256, bytesn, vec};

use super::test_utils::{create_test_data, init_contract};

fn commitment(
    env: &Env,
    vote: &u128,
    seed: &u128,
    vote_generator_point: &G1Affine,
    seed_generator_point: &G1Affine,
) -> G1Affine {
    let vote_fr = Fr::from_u256(U256::from_u128(env, *vote).clone());
    let seed_fr = Fr::from_u256(U256::from_u128(env, *seed).clone());

    let bls12_381 = env.crypto().bls12_381();

    let vote_point = bls12_381.g1_mul(vote_generator_point, &vote_fr);
    let seed_point = bls12_381.g1_mul(seed_generator_point, &seed_fr);

    // C = g^v * h^r (in additive notation: g*v + h*r)
    bls12_381.g1_add(&vote_point, &seed_point)
}

fn neg_value(env: &Env, value: G1Affine) -> G1Affine {
    // Create -1 in Fr field using fr_sub(0, 1)
    let bls12_381 = env.crypto().bls12_381();
    let zero = U256::from_u32(env, 0);
    let one = U256::from_u32(env, 1);
    let neg_one = bls12_381.fr_sub(&zero.into(), &one.into());

    // negate the value
    bls12_381.g1_mul(&value, &neg_one)
}

fn add_commitment(
    env: &Env,
    tally: &G1Affine,
    commitment: &G1Affine,
    seed: &u128,
    seed_generator: &G1Affine,
) -> G1Affine {
    let bls12_381 = env.crypto().bls12_381();

    let seed_fr = Fr::from_u256(U256::from_u128(env, *seed).clone());
    let seed_point = bls12_381.g1_mul(seed_generator, &seed_fr);
    let neg_seed = neg_value(env, seed_point);

    // Remove randomization
    let recovered_vote = bls12_381.g1_add(commitment, &neg_seed);

    // tally
    bls12_381.g1_add(tally, &recovered_vote)
}

fn add_vote(env: &Env, vote: &u128, seed: &u128, tally_vote: &Fr) -> (Fr, Fr) {
    let vote_fr = Fr::from_u256(U256::from_u128(env, *vote).clone());
    let seed_fr = Fr::from_u256(U256::from_u128(env, *seed).clone());

    let mut new_tally_vote = tally_vote.clone();
    new_tally_vote = new_tally_vote.add(vote_fr);
    new_tally_vote = new_tally_vote.add(seed_fr.clone());

    (new_tally_vote, seed_fr)
}

#[test]
fn test_vote_maths() {
    let env = Env::default();

    // generators
    let bls12_381 = env.crypto().bls12_381();

    let vote_generator = Bytes::from_slice(&env, b"VOTE_GENERATOR");
    let vote_dst = Bytes::from_slice(&env, b"VOTE_COMMITMENT");
    let seed_generator = Bytes::from_slice(&env, b"SEED_GENERATOR");
    let seed_dst = Bytes::from_slice(&env, b"VOTE_SEED");

    let vote_generator_point = bls12_381.hash_to_g1(&vote_generator, &vote_dst);
    let seed_generator_point = bls12_381.hash_to_g1(&seed_generator, &seed_dst);

    // init tallies
    let mut tally_votes = Fr::from_u256(U256::from_u128(&env, 0));
    let mut tally_seed = Fr::from_u256(U256::from_u128(&env, 0));

    // casting votes, on-chain store tally_votes, encrypted version of seed_fr and commitment
    let vote_a = 1_u128;
    let seed_a = 60_u128;
    let vote_commitment_a = commitment(
        &env,
        &vote_a,
        &seed_a,
        &vote_generator_point,
        &seed_generator_point,
    );
    let seed_a_fr;
    (tally_votes, seed_a_fr) = add_vote(&env, &vote_a, &seed_a, &tally_votes);

    let vote_b = 2_u128;
    let seed_b = 30_u128;
    let vote_commitment_b = commitment(
        &env,
        &vote_b,
        &seed_b,
        &vote_generator_point,
        &seed_generator_point,
    );
    let seed_b_fr;
    (tally_votes, seed_b_fr) = add_vote(&env, &vote_b, &seed_b, &tally_votes);

    let vote_c = 5_u128;
    let seed_c = 10_u128;
    let vote_commitment_c = commitment(
        &env,
        &vote_c,
        &seed_c,
        &vote_generator_point,
        &seed_generator_point,
    );
    let seed_c_fr;
    (tally_votes, seed_c_fr) = add_vote(&env, &vote_c, &seed_c, &tally_votes);

    // voting ends
    let ref_tally = U256::from_u128(&env, vote_a + vote_b + vote_c);

    let mut tally = tally_votes.to_u256();

    // seed_fr are decrypted on the frontend with the secret key
    tally_seed = tally_seed.add(seed_a_fr).add(seed_b_fr).add(seed_c_fr);
    let seed = tally_seed.clone().to_u256();

    tally = tally.sub(&seed);

    assert_eq!(tally.clone(), ref_tally);

    // we retrieve the commitments
    let mut tally_commitment_votes = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
    tally_commitment_votes = add_commitment(
        &env,
        &tally_commitment_votes,
        &vote_commitment_a,
        &seed_a,
        &seed_generator_point,
    );
    tally_commitment_votes = add_commitment(
        &env,
        &tally_commitment_votes,
        &vote_commitment_b,
        &seed_b,
        &seed_generator_point,
    );
    tally_commitment_votes = add_commitment(
        &env,
        &tally_commitment_votes,
        &vote_commitment_c,
        &seed_c,
        &seed_generator_point,
    );

    // verify consistency (tally_seed decoded so offline check)
    let tally_seed_point = bls12_381.g1_mul(&seed_generator_point, &seed.into());
    let commitment_check = bls12_381.g1_add(&tally_commitment_votes, &tally_seed_point);

    let mut tally_commitment = bls12_381.g1_add(&vote_commitment_a, &vote_commitment_b);
    tally_commitment = bls12_381.g1_add(&tally_commitment, &vote_commitment_c);

    assert_eq!(commitment_check, tally_commitment);

    // second check: we know the tally so we can reconstruct the commitment without seed
    // we could add that to the tally_seed_point as we do above, this way we do
    // not leak the individual seed, just the tally of the seed
    let tally_commitment_votes_ = bls12_381.g1_mul(&vote_generator_point, &Fr::from_u256(tally));
    assert_eq!(tally_commitment_votes, tally_commitment_votes_);
}

#[test]
fn anonymous_vote_commitments_roundtrip() {
    let setup = create_test_data();
    let project_key = init_contract(&setup); // Bytes
    let pub_key = soroban_sdk::String::from_str(&setup.env, "pk_test");

    // admin config
    setup
        .contract
        .anonymous_voting_setup(&setup.mando, &project_key, &pub_key);

    // test data
    let votes = vec![&setup.env, 0u128, 1u128, 2u128];
    let seeds = vec![&setup.env, 42u128, 43u128, 44u128];

    // expected commitments (re-using same math off-chain)
    let bls12_381 = setup.env.crypto().bls12_381();
    let vote_gen = bls12_381.hash_to_g1(
        &Bytes::from_slice(&setup.env, b"VOTE_GENERATOR"),
        &Bytes::from_slice(&setup.env, b"VOTE_COMMITMENT"),
    );
    let seed_gen = bls12_381.hash_to_g1(
        &Bytes::from_slice(&setup.env, b"SEED_GENERATOR"),
        &Bytes::from_slice(&setup.env, b"VOTE_SEED"),
    );

    let mut expected = vec![&setup.env];
    for (v, s) in votes.iter().zip(seeds.iter()) {
        expected.push_back(commitment(&setup.env, &v, &s, &vote_gen, &seed_gen).to_bytes());
    }

    // on-chain calculation
    let actual = setup
        .contract
        .build_commitments_from_votes(&project_key, &votes, &seeds);

    assert_eq!(expected, actual);
}

#[test]
fn anonymous_voting_setup_is_reachable() {
    let setup = create_test_data();
    let project_key = init_contract(&setup); // valid Bytes key
    let pub_key = soroban_sdk::String::from_str(&setup.env, "pk_test");

    // In the mocked environment any caller is accepted, so the call
    // should succeed (i.e. return Ok(())).
    let res = setup
        .contract
        .try_anonymous_voting_setup(&setup.mando, &project_key, &pub_key);

    assert!(
        res.is_ok(),
        "anonymous_voting_setup should succeed in the mock env"
    );
}

#[test]
fn weighted_commitments_roundtrip_bounds_check() {
    let env = Env::default();

    // Generators (same domain separation as contract)
    // On-chain: these are derived in the contract using hash_to_g1.
    // Off-chain: clients mirror this to build commitments consistently.
    let bls12_381 = env.crypto().bls12_381();
    let vote_generator = Bytes::from_slice(&env, b"VOTE_GENERATOR");
    let vote_dst = Bytes::from_slice(&env, b"VOTE_COMMITMENT");
    let seed_generator = Bytes::from_slice(&env, b"SEED_GENERATOR");
    let seed_dst = Bytes::from_slice(&env, b"VOTE_SEED");

    let g_vote = bls12_381.hash_to_g1(&vote_generator, &vote_dst);
    let g_seed = bls12_381.hash_to_g1(&seed_generator, &seed_dst);

    // One-hot vote and random seed (unweighted base)
    // Off-chain: voter prepares base commitment C = v*G + r*H.
    let v: u128 = 1; // approve
    let r: u128 = 12345;
    let base_commitment = commitment(&env, &v, &r, &g_vote, &g_seed);

    // Simple bound: assume protocol publishes a maximum allowed weight
    // On-chain today (public weights): contract checks weight <= get_max_weight(...).
    // For hidden weights, this must be enforced by verifying a proof at vote-time.
    // This test demonstrates the algebra; it does NOT implement the proof.
    let w_max: u32 = 1_500_000;

    // The voter privately chooses a weight w within bounds (hidden in real protocol)
    // Off-chain: voter picks w and constructs a proof "w in [1, w_max]".
    // On-chain: the contract should verify that proof during vote submission.
    let w: u32 = 1_500_000; // choose full allowance here
    assert!(w > 0 && w <= w_max, "weight must be within [1, w_max]");

    // Scale commitment by hidden weight: C' = w * C
    // Off-chain: voter computes scaled commitment C' and submits it with the proof.
    // On-chain: contract stores C' only if the proof verifies.
    //
    // Proof structure at vote submission (conceptual):
    // 1) Same-scalar proof (NIZK): proves the existence of the same secret w such that
    //    for each i, C'i = w * Ci. To bind the transcript to a specific w, include an
    //    auxiliary pair (U, U' = w * U) and verify all relations together with one
    //    Fiat–Shamir challenge.
    //    - Inputs on-chain (public): {Ci}, {C'i}, U, U', transcript bytes
    //    - Check on-chain: verify_same_scalar({Ci},{C'i},U,U',proof) == true
    //
    // 2) Range/bound proof for w (NIZK): ensure 1 <= w <= W_max without revealing w.
    //    A practical approach is a k-bit binary proof where 2^k - 1 <= W_max, proving
    //    U' encodes w = sum_{j=0..k-1} b_j * 2^j with bits b_j in {0,1}:
    //    - For each bit b_j, prove b_j ∈ {0,1} via a small OR-proof.
    //    - Prove U' is the linear combination of U with those bits as scalars.
    //    - Reuse the same U, U' from (1) to link both proofs to the same w.
    //    - Inputs on-chain (public): U, U', W_max (or k), transcript bytes
    //    - Check on-chain: verify_binary_range_proof(U,U',k,proof_bits) == true
    //
    // If both proofs pass, the contract records only {C'i} (the weighted commitments).
    // Note: this test demonstrates the algebraic identity that makes (2) tally-time
    // verification possible; it does not implement those NIZKs.
    let w_fr = Fr::from_u256(U256::from_u32(&env, w).into());
    let weighted_commitment = bls12_381.g1_mul(&base_commitment, &w_fr);

    // Independently reconstruct weighted commitment from weighted tallies
    // Off-chain (tally phase): maintainer decrypts seeds to obtain Σ(w*r) and
    // constructs tallies Σ(w*v). These are passed to the contract's proof(...),
    // which recomputes G*(Σ w*v) + H*(Σ w*r) and compares with Σ stored C'.
    // Here we demonstrate the per-vote equivalence locally: T_v = w*v, T_r = w*r
    let t_v: u128 = (w as u128) * v;
    let t_r: u128 = (w as u128) * r;
    let t_v_fr = Fr::from_u256(U256::from_u128(&env, t_v).into());
    let t_r_fr = Fr::from_u256(U256::from_u128(&env, t_r).into());
    let vote_part = bls12_381.g1_mul(&g_vote, &t_v_fr);
    let seed_part = bls12_381.g1_mul(&g_seed, &t_r_fr);
    let reconstructed = bls12_381.g1_add(&vote_part, &seed_part);

    // Round-trip equality: w*(v*G + r*H) == (w*v)*G + (w*r)*H.
    // This is the algebra that makes aggregate verification possible at execute().
    assert_eq!(weighted_commitment, reconstructed);

    // Optional: identity check ensures w != 0 (lower bound)
    // On-chain: a proof system should also rule out w=0; identity check is a sanity guard.
    let mut g1_identity = [0u8; 96];
    g1_identity[0] = 0x40; // compressed identity encoding used in other tests
    let id = G1Affine::from_bytes(soroban_sdk::BytesN::from_array(&env, &g1_identity));
    assert_ne!(weighted_commitment, id);

    // Summary of flows:
    // - Vote submission (on-chain): verify a zero-knowledge proof that hidden w is within bounds
    //   and that C' = w*C for the same w, then store C'.
    // - Execute/tally (on-chain): verify Σ stored C' equals G*(Σ w*v) + H*(Σ w*r)
    //   using tallies and decrypted seed sums provided by maintainer.
    // This test illustrates the math equivalence used by the tally check and
    // clarifies that the per-voter bound enforcement must happen at submission
    // via a proof (not implemented here).
}
