#![cfg(test)]

use super::{Config, ContractErrors, Project, Versioning, VersioningClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{vec, Address, Bytes, BytesN, Env};
// use soroban_sdk::testutils::arbitrary::std::println;

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_admin = Address::generate(&env);

    let contract_id = env.register_contract(None, Versioning);
    let contract = VersioningClient::new(&env, &contract_id);

    contract.init(&contract_admin);

    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);

    let name = Bytes::from_slice(&env, "soroban".as_bytes());
    let hash_config = [
        47, 228, 204, 106, 21, 249, 70, 107, 173, 113, 237, 64, 122, 143, 27, 125, 168, 30, 253,
        147, 30, 119, 18, 117, 49, 82, 170, 23, 171, 192, 224, 110,
    ];

    let config = Config {
        url: Bytes::from_slice(&env, "github.com/file.toml".as_bytes()),
        hash: BytesN::from_array(&env, &hash_config),
    };
    let maintainers= vec![&env, grogu.clone(), mando.clone()];

    let project = Project {
        name,
        config,
        maintainers,
    };

    let id = contract.register(&grogu, &project);

    let expected_id = [
        188, 251, 177, 219, 126, 114, 132, 47, 251, 15, 89, 157, 59, 76, 65, 198, 36, 130, 148,
        234, 26, 84, 76, 129, 52, 68, 20, 190, 131, 69, 17, 89,
    ];
    assert_eq!(id, expected_id);

    // double registration
    let error = contract
        .try_register(&grogu, &project)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::ProjectAlreadyExist.into());

    // un-registered maintainer
    let bob = Address::generate(&env);
    let error = contract
        .try_commit(&bob, &id, &id)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());

}
