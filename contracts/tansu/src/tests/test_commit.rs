use super::test_utils::{create_test_data, init_contract};
use crate::errors::ContractErrors;
use soroban_sdk::testutils::{Address as _, Events, arbitrary::std::println};
use soroban_sdk::{Address, IntoVal, String, symbol_short, vec};

#[test]
fn commit_flow() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let hash = String::from_str(&setup.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    setup.contract.commit(&setup.mando, &id, &hash);

    let stored = setup.contract.get_commit(&id);
    assert_eq!(stored, hash);

    let cost = setup.env.cost_estimate().budget();
    println!("{cost:#?}");
}

#[test]
fn commit_events() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let hash_commit = String::from_str(&setup.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    setup.contract.commit(&setup.mando, &id, &hash_commit);

    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (symbol_short!("commit"), id.clone()).into_val(&setup.env),
                hash_commit.into_val(&setup.env)
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
    assert_eq!(err, ContractErrors::UnregisteredMaintainer.into());
}
