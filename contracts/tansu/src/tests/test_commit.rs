use super::test_utils::{create_test_data, init_contract};
use crate::errors::ContractErrors;
use soroban_sdk::testutils::{Address as _, Events};
use soroban_sdk::{Address, IntoVal, Map, String, Symbol, Val, symbol_short, vec};

#[test]
fn commit_flow() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let hash = String::from_str(&setup.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    setup.contract.commit(&setup.mando, &id, &hash);

    let stored = setup.contract.get_commit(&id);
    assert_eq!(stored, hash);
}

#[test]
fn commit_events() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let hash_commit = String::from_str(&setup.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    setup.contract.commit(&setup.mando, &id, &hash_commit);

    let contract_events = setup
        .env
        .events()
        .all()
        .filter_by_contract(&setup.contract_id);

    assert_eq!(
        contract_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (symbol_short!("commit"), id.clone()).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [(symbol_short!("hash"), hash_commit.into_val(&setup.env)),],
                )
                .into_val(&setup.env),
            ),
        ]
    );
}

#[test]
fn commit_unregistered_maintainer_error() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    // unregistered maintainer commit
    let bob = Address::generate(&setup.env);
    let hash_commit = String::from_str(&setup.env, "deadbeef");
    let err = setup
        .contract
        .try_commit(&bob, &id, &hash_commit)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());
}

#[test]
fn test_anonymous_vote_commitment_validation() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    // Setup anonymous voting first
    setup.contract.anonymous_voting_setup(
        &setup.grogu,
        &id,
        &String::from_str(&setup.env, "test_public_key"),
    );

    // Test mismatched votes and seeds length
    let result = setup.contract.try_build_commitments_from_votes(
        &id,
        &vec![&setup.env, 1u128, 2u128], // 2 votes
        &vec![&setup.env, 1u128],        // 1 seed - mismatch!
    );

    assert_eq!(
        result,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractErrors::TallySeedError as u32
        )))
    );
}

/// Test malformed inputs for build_commitments_from_votes with mismatched lengths
#[test]
fn test_malformed_commitments_mismatched_lengths() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    // Setup anonymous voting
    setup.contract.anonymous_voting_setup(
        &setup.grogu,
        &id,
        &String::from_str(&setup.env, "test_public_key"),
    );

    // Test mismatched votes and seeds length - votes longer
    let result = setup.contract.try_build_commitments_from_votes(
        &id,
        &vec![&setup.env, 1u128, 2u128, 3u128, 4u128], // 4 votes
        &vec![&setup.env, 1u128, 2u128, 3u128],        // 3 seeds - mismatch!
    );

    assert_eq!(
        result,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractErrors::TallySeedError as u32
        )))
    );

    // Test mismatched votes and seeds length - seeds longer
    let result2 = setup.contract.try_build_commitments_from_votes(
        &id,
        &vec![&setup.env, 1u128, 2u128],        // 2 votes
        &vec![&setup.env, 1u128, 2u128, 3u128], // 3 seeds - mismatch!
    );

    assert_eq!(
        result2,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractErrors::TallySeedError as u32
        )))
    );
}
