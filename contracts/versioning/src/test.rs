#![cfg(test)]

use super::{domain_contract, ContractErrors, Versioning, VersioningClient};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{
    symbol_short, testutils::Events, token, vec, Address, Bytes, Env, IntoVal, String, Vec,
};

#[test]
fn test() {
    let env = Env::default();
    env.mock_all_auths();

    // setup for Soroban Domain
    let domain_contract_id = env.register_contract_wasm(None, domain_contract::WASM);
    let domain_client = domain_contract::Client::new(&env, &domain_contract_id);

    let adm: Address = Address::generate(&env);
    let node_rate: u128 = 100;
    let min_duration: u64 = 31536000;
    let allowed_tlds: Vec<Bytes> = Vec::from_array(
        &env,
        [
            Bytes::from_slice(&env, "xlm".as_bytes()),
            Bytes::from_slice(&env, "stellar".as_bytes()),
            Bytes::from_slice(&env, "wallet".as_bytes()),
            Bytes::from_slice(&env, "dao".as_bytes()),
        ],
    );
    let issuer: Address = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(issuer.clone());
    let col_asset_client = token::TokenClient::new(&env, &token_address);
    let col_asset_stellar = token::StellarAssetClient::new(&env, &token_address);

    domain_client.init(
        &adm,
        &node_rate,
        &col_asset_client.address.clone(),
        &min_duration,
        &allowed_tlds,
    );

    // setup for Tansu
    let contract_admin = Address::generate(&env);
    let contract_id = env.register_contract(None, Versioning);
    let contract = VersioningClient::new(&env, &contract_id);

    contract.init(&contract_admin);

    let name = String::from_str(&env, "tansu");
    let url = String::from_str(&env, "github.com/file.toml");
    let hash = String::from_str(&env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);
    let maintainers = vec![&env, grogu.clone(), mando.clone()];

    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    col_asset_stellar.mint(&grogu, &genesis_amount);

    let id = contract.register(
        &grogu,
        &name,
        &maintainers,
        &url,
        &hash,
        &domain_contract_id,
    );

    let expected_id = [
        55, 174, 131, 192, 111, 222, 16, 67, 114, 71, 67, 51, 90, 194, 243, 145, 147, 7, 137, 46,
        230, 48, 124, 206, 140, 12, 99, 234, 165, 73, 225, 86,
    ];
    let expected_id = Bytes::from_array(&env, &expected_id);
    assert_eq!(id, expected_id);

    let hash_commit = String::from_str(&env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    contract.commit(&mando, &id, &hash_commit);

    let res_hash_commit = contract.get_commit(&id);
    assert_eq!(res_hash_commit, hash_commit);

    // events-events
    let mut all_events = env.events().all();
    all_events.pop_front(); // set_admin
    all_events.pop_front(); // mint
    all_events.pop_front(); // transfer
    assert_eq!(
        all_events,
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
        .try_register(
            &grogu,
            &name,
            &maintainers,
            &url,
            &hash,
            &domain_contract_id,
        )
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::ProjectAlreadyExist.into());

    // name too long
    let name_long = String::from_str(
        &env,
        "soroban-versioningsoroban-versioningsoroban-versioningsoroban-versioning",
    );
    let error = contract
        .try_register(
            &grogu,
            &name_long,
            &maintainers,
            &url,
            &hash,
            &domain_contract_id,
        )
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::InvalidDomainError.into());

    // un-registered maintainer
    let bob = Address::generate(&env);
    let error = contract
        .try_commit(&bob, &id, &hash_commit)
        .unwrap_err()
        .unwrap();

    assert_eq!(error, ContractErrors::UnregisteredMaintainer.into());
}
