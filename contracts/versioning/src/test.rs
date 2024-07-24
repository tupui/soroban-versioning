#![cfg(test)]

use super::{ContractErrors, Versioning, VersioningClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{symbol_short, testutils::Events, vec, Address, Bytes, Env, IntoVal, String};
// use soroban_sdk::testutils::arbitrary::std::println;

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_admin = Address::generate(&env);

    let contract_id = env.register_contract(None, Versioning);
    let contract = VersioningClient::new(&env, &contract_id);

    contract.init(&contract_admin);

    let name = String::from_str(&env, "soroban-versioning");
    let url = String::from_str(&env, "github.com/file.toml");
    let hash = String::from_str(&env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);
    let maintainers = vec![&env, grogu.clone(), mando.clone()];

    let id = contract.register(&grogu, &name, &maintainers, &url, &hash);

    let expected_id = [
        154, 252, 222, 74, 217, 43, 29, 68, 231, 69, 123, 243, 128, 203, 176, 248, 239, 30, 179,
        243, 81, 126, 231, 183, 47, 67, 190, 183, 195, 188, 2, 172,
    ];
    let expected_id = Bytes::from_array(&env, &expected_id);
    assert_eq!(id, expected_id);

    let hash_commit = String::from_str(&env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    contract.commit(&mando, &id, &hash_commit);

    let res_hash_commit = contract.get_commit(&id);
    assert_eq!(res_hash_commit, hash_commit);

    // events-events
    assert_eq!(
        env.events().all(),
        vec![
            &env,
            (
                contract_id.clone(),
                (symbol_short!("register"), name.clone()).into_val(&env),
                id.clone().into_val(&env)
            ),
            (
                contract_id.clone(),
                (symbol_short!("commit"), id.clone()).into_val(&env),
                hash_commit.into_val(&env)
            ),
        ]
    );

    // error handling

    // double registration
    let error = contract
        .try_register(&grogu, &name, &maintainers, &url, &hash)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::ProjectAlreadyExist.into());

    // name too long
    let name_long = String::from_str(
        &env,
        "soroban-versioningsoroban-versioningsoroban-versioningsoroban-versioning",
    );
    let error = contract
        .try_register(&grogu, &name_long, &maintainers, &url, &hash)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::InputValidationError.into());

    // un-registered maintainer
    let bob = Address::generate(&env);
    let error = contract
        .try_commit(&bob, &id, &hash_commit)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());
}
