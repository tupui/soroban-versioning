use crate::{Tansu, TansuClient, types};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Bytes, Env, Executable, String, token, vec};

pub struct TestSetup {
    pub env: Env,
    pub contract: TansuClient<'static>,
    pub contract_id: Address,
    pub domain_id: Address,
    pub token_stellar: token::StellarAssetClient<'static>,
    pub grogu: Address,
    pub mando: Address,
    pub contract_admin: Address,
}

pub fn create_env() -> Env {
    let env = Env::from_ledger_snapshot_file("../../network_snapshots/sorobandomains.json");
    env.mock_all_auths();
    env.ledger().set_protocol_version(23);
    env.ledger().set_timestamp(1759139101); // keep in sync with snapshot last_timestamp (remove 3 zeros)
    env
}

pub fn create_test_data() -> TestSetup {
    let env = create_env();

    let contract_strkey = "CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI";
    let domain_id = Address::from_str(&env, contract_strkey);

    let contract_admin = Address::generate(&env);
    let contract_id = env.register(Tansu, (&contract_admin,));
    let contract = TansuClient::new(&env, &contract_id);

    contract.pause(&contract_admin, &false);

    let wasm_hash = match domain_id.executable().unwrap() {
        Executable::Wasm(wasm) => wasm,
        _ => panic!(),
    };

    let new_domain = types::Contract {
        address: domain_id.clone(),
        wasm_hash: Some(wasm_hash.clone()),
    };
    contract.set_domain_contract(&contract_admin, &new_domain);

    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());

    let new_collateral = types::Contract {
        address: sac.address(),
        wasm_hash: None,
    };
    contract.set_collateral_contract(&contract_admin, &new_collateral);

    let token_stellar = token::StellarAssetClient::new(&env, &sac.address());
    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);
    let genesis_amount: i128 = i128::MAX;
    token_stellar.mint(&grogu, &genesis_amount);
    token_stellar.mint(&mando, &genesis_amount);

    // we need real XLM, using some data from the snapshot
    let contract_strkey = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
    let xlm_id = Address::from_str(&env, contract_strkey);
    let token_stellar_xlm = token::StellarAssetClient::new(&env, &xlm_id);
    let random_account_strkey = "CAC3AUH3A3ZCABCOPDCXVJXSIL57WHAPGUPTKAOMSNFLAVE7CPPGNGZB";
    let random_account_id = Address::from_str(&env, random_account_strkey);
    token_stellar_xlm.transfer(&random_account_id, &grogu, &1583624677996i128);

    TestSetup {
        env,
        contract,
        contract_id,
        domain_id,
        token_stellar,
        grogu,
        mando,
        contract_admin,
    }
}

pub fn init_contract(setup: &TestSetup) -> Bytes {
    let name = String::from_str(&setup.env, "tansutest");
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    setup
        .contract
        .register(&setup.grogu, &name, &maintainers, &url, &ipfs)
}
