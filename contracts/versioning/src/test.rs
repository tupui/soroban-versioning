#![cfg(test)]

use super::{ContractErrors, Versioning, VersioningClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{testutils::Events, vec, Address, Bytes, Env, IntoVal, symbol_short};
// use soroban_sdk::testutils::arbitrary::std::println;

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_admin = Address::generate(&env);

    let contract_id = env.register_contract(None, Versioning);
    let contract = VersioningClient::new(&env, &contract_id);

    contract.init(&contract_admin);

    let name = Bytes::from_slice(&env, "soroban-versioning".as_bytes());
    let url = Bytes::from_slice(&env, "github.com/file.toml".as_bytes());
    let hash_config = [
        47, 228, 204, 106, 21, 249, 70, 107, 173, 113, 237, 64, 122, 143, 27, 125, 168, 30, 253,
        147, 30, 119, 18, 117, 49, 82, 170, 23, 171, 192, 224, 110,
    ];
    let hash = Bytes::from_array(&env, &hash_config);
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

    let hash_commit = [
        142, 21, 249, 254, 234, 45, 86, 108, 11, 6, 159, 77, 137, 217, 24, 43, 25, 59, 17, 78, 25,
        102, 129, 221, 240, 103, 68, 102, 78, 221, 90, 125,
    ];
    let hash_commit = Bytes::from_array(&env, &hash_commit);
    contract.commit(&mando, &id, &hash_commit);

    let res_hash_commit = contract.get_commit(&id);
    assert_eq!(res_hash_commit, hash_commit);

    // events
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

    // un-registered maintainer
    let bob = Address::generate(&env);
    let error = contract.try_commit(&bob, &id, &id).unwrap_err().unwrap();

    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());
}
