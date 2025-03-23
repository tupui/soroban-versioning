#![cfg(test)]

use core::ops::Add;
use soroban_sdk::crypto::bls12_381::{Fr, G1Affine};

use soroban_sdk::{bytesn, Bytes, Env, U256};

fn commitment(
    env: &Env,
    vote: &u32,
    seed: &u32,
    vote_generator_point: &G1Affine,
    seed_generator_point: &G1Affine,
) -> G1Affine {
    let vote_fr = Fr::from_u256(U256::from_u32(env, *vote).clone());
    let seed_fr = Fr::from_u256(U256::from_u32(env, *seed).clone());

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
    seed: &u32,
    seed_generator: &G1Affine,
) -> G1Affine {
    let bls12_381 = env.crypto().bls12_381();

    let seed_fr = Fr::from_u256(U256::from_u32(env, *seed).clone());
    let seed_point = bls12_381.g1_mul(seed_generator, &seed_fr);
    let neg_seed = neg_value(env, seed_point);

    // Remove randomization
    let recovered_vote = bls12_381.g1_add(commitment, &neg_seed);

    // tally
    bls12_381.g1_add(tally, &recovered_vote)
}

fn add_vote(env: &Env, vote: &u32, seed: &u32, tally_vote: &Fr) -> (Fr, Fr) {
    let vote_fr = Fr::from_u256(U256::from_u32(env, *vote).clone());
    let seed_fr = Fr::from_u256(U256::from_u32(env, *seed).clone());

    let mut new_tally_vote = tally_vote.clone();
    new_tally_vote = new_tally_vote.add(vote_fr);
    new_tally_vote = new_tally_vote.add(seed_fr.clone());

    (new_tally_vote, seed_fr)
}

#[test]
fn test_vote() {
    let env = Env::default();

    // generators
    let bls12_381 = env.crypto().bls12_381();

    let vote_generator = Bytes::from_slice(&env, "VOTE_GENERATOR".as_bytes());
    let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
    let seed_generator = Bytes::from_slice(&env, "SEED_GENERATOR".as_bytes());
    let seed_dst = Bytes::from_slice(&env, "VOTE_SEED".as_bytes());

    let vote_generator_point = bls12_381.hash_to_g1(&vote_generator, &vote_dst);
    let seed_generator_point = bls12_381.hash_to_g1(&seed_generator, &seed_dst);

    // init tallies
    let mut tally_votes = Fr::from_u256(U256::from_u32(&env, 0).clone());
    let mut tally_seed = Fr::from_u256(U256::from_u32(&env, 0).clone());

    // casting votes, on-chain store tally_votes, encrypted version of seed_fr and commitment
    let vote_a = 1_u32;
    let seed_a = 60_u32;
    let vote_commitment_a = commitment(
        &env,
        &vote_a,
        &seed_a,
        &vote_generator_point,
        &seed_generator_point,
    );
    let seed_a_fr;
    (tally_votes, seed_a_fr) = add_vote(&env, &vote_a, &seed_a, &tally_votes);

    let vote_b = 2_u32;
    let seed_b = 30_u32;
    let vote_commitment_b = commitment(
        &env,
        &vote_b,
        &seed_b,
        &vote_generator_point,
        &seed_generator_point,
    );
    let seed_b_fr;
    (tally_votes, seed_b_fr) = add_vote(&env, &vote_b, &seed_b, &tally_votes);

    let vote_c = 5_u32;
    let seed_c = 10_u32;
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
    let ref_tally = U256::from_u32(&env, vote_a + vote_b + vote_c);

    let mut tally = tally_votes.to_u256();

    // seed_fr are decrypted on the frontend with the secret key
    tally_seed = tally_seed.add(seed_a_fr).add(seed_b_fr).add(seed_c_fr);
    let seed = tally_seed.clone().to_u256();

    tally = tally.sub(&seed);

    assert_eq!(tally.clone(), ref_tally);

    // we retrieve the commitments
    // let tally_commitment_votes = bls12_381.g1_mul(&vote_generator_point, &Fr::from_u256(tally));
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
}
