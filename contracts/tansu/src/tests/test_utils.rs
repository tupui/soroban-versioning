use crate::{Tansu, TansuClient, domain_contract, types};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, BytesN, Env, Executable, String, Vec, token, vec};

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
    let env = Env::default();
    env.mock_all_auths();
    env
}

pub fn create_test_data() -> TestSetup {
    let env = create_env();

    let domain_id = env.register(domain_contract::WASM, ());
    let domain = domain_contract::Client::new(&env, &domain_id);

    let adm = Address::generate(&env);
    let node_rate: u128 = 100;
    let min_duration: u64 = 31_536_000;
    let allowed_tlds: Vec<Bytes> = Vec::from_array(
        &env,
        [
            Bytes::from_slice(&env, b"xlm"),
            Bytes::from_slice(&env, b"stellar"),
            Bytes::from_slice(&env, b"wallet"),
            Bytes::from_slice(&env, b"dao"),
        ],
    );

    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer.clone());
    let token_client = token::TokenClient::new(&env, &sac.address());
    let token_stellar = token::StellarAssetClient::new(&env, &sac.address());

    domain.init(
        &adm,
        &node_rate,
        &token_client.address.clone(),
        &min_duration,
        &allowed_tlds,
    );

    let contract_admin = Address::generate(&env);
    let contract_id = env.register(Tansu, (&contract_admin,));
    let contract = TansuClient::new(&env, &contract_id);

    contract.pause(&contract_admin, &false);

    let wasm_hash = match domain_id.executable().unwrap() {
        Executable::Wasm(wasm) => wasm,
        _ => BytesN::from_array(&env, &[2u8; 32]),
    };

    let new_domain = types::DomainContract {
        address: domain_id.clone(),
        wasm_hash,
    };
    contract.set_domain_contract_id(&contract_admin, &new_domain);

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
    let name = String::from_str(&setup.env, "tansu");
    let url = String::from_str(&setup.env, "github.com/tansu");
    let ipfs = String::from_str(&setup.env, "2ef4f49fdd8fa9dc463f1f06a094c26b88710990");
    let maintainers = vec![&setup.env, setup.grogu.clone(), setup.mando.clone()];

    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.grogu, &genesis_amount);

    setup
        .contract
        .register(&setup.grogu, &name, &maintainers, &url, &ipfs)
}
