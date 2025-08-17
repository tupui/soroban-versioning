use super::test_utils::{create_test_data, init_contract};
use crate::{contract_versioning::domain_register, errors::ContractErrors};
use soroban_sdk::testutils::Events;
use soroban_sdk::{Bytes, IntoVal, String, symbol_short, vec};

#[test]
fn register_project() {
    let setup = create_test_data();
    let id = init_contract(&setup);
    let project = setup.contract.get_project(&id);
    assert_eq!(project.name, String::from_str(&setup.env, "tansu"));
}

#[test]
fn register_events() {
    let setup = create_test_data();

    let name = String::from_str(&setup.env, "tansu");
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.grogu, &genesis_amount);

    let id = setup
        .contract
        .register(&setup.grogu, &name, &maintainers, &url, &ipfs);

    let mut all_events = setup.env.events().all();
    all_events.pop_front(); // transfer event from the domain contract
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (symbol_short!("register"), id.clone()).into_val(&setup.env),
                name.into_val(&setup.env)
            ),
        ]
    );

    let expected_id = [
        55, 174, 131, 192, 111, 222, 16, 67, 114, 71, 67, 51, 90, 194, 243, 145, 147, 7, 137, 46,
        230, 48, 124, 206, 140, 12, 99, 234, 165, 73, 225, 86,
    ];
    let expected_id = soroban_sdk::Bytes::from_array(&setup.env, &expected_id);
    assert_eq!(id, expected_id);
}

#[test]
fn register_double_registration_error() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let name = String::from_str(&setup.env, "tansu");
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    // double registration
    let err = setup
        .contract
        .try_register(&setup.grogu, &name, &maintainers, &url, &ipfs)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProjectAlreadyExist.into());
}

#[test]
fn register_name_too_long_error() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let name_long = String::from_str(
        &setup.env,
        "soroban-versioningsoroban-versioningsoroban-versioningsoroban-versioning",
    );
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    // name too long
    let err = setup
        .contract
        .try_register(&setup.grogu, &name_long, &maintainers, &url, &ipfs)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::InvalidDomainError.into());
}

#[test]
fn register_maintainer_not_domain_owner_error() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let _name = String::from_str(&setup.env, "tansu");
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    // maintainer not domain owner
    let name_b = Bytes::from_slice(&setup.env, b"bob");
    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.mando, &genesis_amount);
    domain_register(&setup.env, &name_b, &setup.mando, setup.domain_id.clone());
    let name_b_str = String::from_str(&setup.env, "bob");
    let err = setup
        .contract
        .try_register(&setup.grogu, &name_b_str, &maintainers, &url, &ipfs)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::MaintainerNotDomainOwner.into());
}
