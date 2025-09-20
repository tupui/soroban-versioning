use crate::{Tansu, TansuClient, types};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, Env, Executable, String, Vec, token, vec};

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
    env
}

pub fn create_test_data() -> TestSetup {
    let env = create_env();

    let contract_strkey = "CATRNPHYKNXAPNLHEYH55REB6YSAJLGCPA4YM6L3WUKSZOPI77M2UMKI";
    let domain_id = Address::from_str(&env, contract_strkey);

    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token_stellar = token::StellarAssetClient::new(&env, &sac.address());

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

    let new_collateral = types::Contract {
        address: sac.address(),
        wasm_hash: None,
    };
    contract.set_collateral_contract(&contract_admin, &new_collateral);

    let grogu = Address::generate(&env);
    let mando = Address::generate(&env);

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

    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.grogu, &genesis_amount);
    setup.token_stellar.mint(&setup.mando, &genesis_amount);

    setup
        .contract
        .register(&setup.grogu, &name, &maintainers, &url, &ipfs)
}
