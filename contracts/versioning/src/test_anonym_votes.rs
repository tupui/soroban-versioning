#![cfg(test)]

use core::ops::{Add, Sub};
use soroban_sdk::crypto::bls12_381::{Fr, G1Affine};

use soroban_sdk::{bytesn, Bytes, Env, U256};

fn commitment(env: &Env, vote: &u32, seed: &str, pk: &str) -> G1Affine {
    let vote = Bytes::from_slice(env, &vote.to_be_bytes());
    let seed = Bytes::from_slice(env, seed.as_bytes());
    let pk = Bytes::from_slice(env, pk.as_bytes());

    let vote_dst = Bytes::from_slice(env, "VOTE_COMMITMENT".as_bytes());
    let pk_dst = Bytes::from_slice(env, "VOTE_PK".as_bytes());
    let seed_dst = Bytes::from_slice(env, "VOTE_SEED".as_bytes());

    let bls12_381 = env.crypto().bls12_381();

    let vote_point = bls12_381.hash_to_g1(&vote, &vote_dst);
    let seed_point = bls12_381.hash_to_g1(&seed, &seed_dst);
    let pk_point = bls12_381.hash_to_g1(&pk, &pk_dst);

    // C1 = g^v * h^r (in additive notation: g*v + h*r)
    let vote_commitment = bls12_381.g1_add(&vote_point, &seed_point);

    bls12_381.g1_add(&vote_commitment, &pk_point)
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
    seed: &str,
    pk: &str,
) -> G1Affine {
    let seed = Bytes::from_slice(env, seed.as_bytes());
    let pk = Bytes::from_slice(env, pk.as_bytes());

    let pk_dst = Bytes::from_slice(env, "VOTE_PK".as_bytes());
    let seed_dst = Bytes::from_slice(env, "VOTE_SEED".as_bytes());

    let bls12_381 = env.crypto().bls12_381();

    let seed_point = bls12_381.hash_to_g1(&seed, &seed_dst);
    let pk_point = bls12_381.hash_to_g1(&pk, &pk_dst);

    let neg_seed = neg_value(env, seed_point);
    let neg_pk = neg_value(env, pk_point);

    // Remove randomization
    let mut recovered_vote = bls12_381.g1_add(commitment, &neg_seed);
    recovered_vote = bls12_381.g1_add(&recovered_vote, &neg_pk);

    // tally
    bls12_381.g1_add(tally, &recovered_vote)
}

fn add_vote(
    env: &Env,
    vote: &u32,
    seed: &u32,
    approve: bool,
    tally_vote: &Fr,
    tally_seed: &Fr,
) -> (Fr, Fr) {
    let vote_fr = Fr::from_u256(U256::from_u32(env, *vote).clone());
    let seed_fr = Fr::from_u256(U256::from_u32(env, *seed).clone());

    let mut new_tally_seed = tally_seed.clone();
    new_tally_seed = new_tally_seed.add(seed_fr.clone());

    let mut new_tally = tally_vote.clone();

    new_tally = new_tally.add(seed_fr);

    if approve {
        (new_tally.add(vote_fr), new_tally_seed)
    } else {
        (new_tally.sub(vote_fr), new_tally_seed)
    }
}

#[test]
fn test_commitment() {
    let env = Env::default();

    // pk a public key which we store on the proposal
    let pk = "public key";

    // casting some votes in the frontend
    let vote_a = 1_u32;
    let seed_a = "seed value a";
    let vote_commitment_a = commitment(&env, &vote_a, seed_a, pk);

    let vote_b = 1_u32;
    let seed_b = "seed value b";
    let vote_commitment_b = commitment(&env, &vote_b, seed_b, pk);

    // voting ends, we retrieve the commitments and the
    // seeds are decrypted on the frontend with the secret key
    //let mut tally: G1Affine = U256::from_u32(&env, 0).into();
    let mut tally = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
    tally = add_commitment(&env, &tally, &vote_commitment_a, seed_a, pk);
    tally = add_commitment(&env, &tally, &vote_commitment_b, seed_b, pk);

    // check the tally
    let bls12_381 = env.crypto().bls12_381();
    let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
    let one_vote = Bytes::from_slice(&env, &1_u32.to_be_bytes());
    let one_vote_point = bls12_381.hash_to_g1(&one_vote, &vote_dst);
    let ref_tally = bls12_381.g1_add(&one_vote_point, &one_vote_point);
    assert_eq!(tally, ref_tally);
}

#[test]
fn test_vote() {
    let env = Env::default();

    // pk a public key which we store on the proposal
    let pk = "public key";

    let mut middle_tally = Fr::from_u256(U256::from_u32(&env, 2).clone());
    middle_tally = middle_tally.pow(255);
    let middle_seed = Fr::from_u256(U256::from_u32(&env, 100_u32).clone());

    let mut tally_votes = middle_tally.clone();
    let mut tally_seed = middle_seed.clone();
    let mut tally_commitment = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));

    let vote_a = 1_u32;
    let seed_a = 60_u32;
    let seed_commitment_a = "seed value a";
    let vote_commitment_a = commitment(&env, &vote_a, seed_commitment_a, pk);
    (tally_votes, tally_seed) = add_vote(&env, &vote_a, &seed_a, true, &tally_votes, &tally_seed);
    tally_commitment = add_commitment(
        &env,
        &tally_commitment,
        &vote_commitment_a,
        seed_commitment_a,
        pk,
    );

    let vote_b = 2_u32;
    let seed_b = 30_u32;
    let seed_commitment_b = "seed value b";
    let vote_commitment_b = commitment(&env, &vote_b, seed_commitment_b, pk);
    (tally_votes, tally_seed) = add_vote(&env, &vote_b, &seed_b, true, &tally_votes, &tally_seed);
    tally_commitment = add_commitment(
        &env,
        &tally_commitment,
        &vote_commitment_b,
        seed_commitment_b,
        pk,
    );

    let vote_c = 5_u32;
    let seed_c = 10_u32;
    let seed_commitment_c = "seed value c";
    let vote_commitment_c = commitment(&env, &vote_c, seed_commitment_c, pk);
    (tally_votes, tally_seed) = add_vote(&env, &vote_c, &seed_c, true, &tally_votes, &tally_seed);
    tally_commitment = add_commitment(
        &env,
        &tally_commitment,
        &vote_commitment_c,
        seed_commitment_c,
        pk,
    );

    let ref_tally = U256::from_u32(&env, vote_a + vote_b + vote_c);

    let mut tally = (tally_votes - middle_tally).to_u256();
    let seed = (tally_seed - middle_seed).to_u256();
    tally = tally.sub(&seed);

    assert_eq!(tally, ref_tally);
    assert_eq!(tally_commitment, tally_commitment);
}
