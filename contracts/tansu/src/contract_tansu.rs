use soroban_sdk::{Address, BytesN, Env, contractimpl};

use crate::{Tansu, TansuArgs, TansuClient, TansuTrait, types};

#[contractimpl]
impl TansuTrait for Tansu {
    fn __constructor(env: Env, admin: Address, domain_contract_id: Address) {
        env.storage().instance().set(&types::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&types::DataKey::DomainContractId, &domain_contract_id);
    }

    fn upgrade(env: Env, new_wasm_hash: BytesN<32>, admin: Address, domain_contract_id: Address) {
        let old_admin: Address = env
            .storage()
            .instance()
            .get(&types::DataKey::Admin)
            .unwrap();
        old_admin.require_auth();

        env.storage().instance().set(&types::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&types::DataKey::DomainContractId, &domain_contract_id);

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    fn version() -> u32 {
        1
    }
}
