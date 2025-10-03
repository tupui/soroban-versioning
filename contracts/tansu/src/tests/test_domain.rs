use crate::{contract_versioning::domain_node, domain_contract};
use soroban_sdk::{Bytes, Env};

#[test]
fn domain_node_matches_contract() {
    let env = Env::default();
    let name_b = Bytes::from_slice(&env, b"tansu");
    let tld_b = Bytes::from_slice(&env, b"xlm");
    let key: Bytes = env.crypto().keccak256(&name_b).into();
    let node = domain_node(&env, &key);

    let domain_id = env.register(domain_contract::WASM, ());
    let domain = domain_contract::Client::new(&env, &domain_id);
    let node_official = domain.parse_domain(&name_b, &tld_b);

    assert_eq!(node, node_official);
}
