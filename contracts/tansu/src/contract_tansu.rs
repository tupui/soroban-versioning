use soroban_sdk::{contractimpl, Address, BytesN, Env};

use crate::{types, Tansu, TansuArgs, TansuClient, TansuTrait};

#[contractimpl]
impl TansuTrait for Tansu {
    fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&types::DataKey::Admin, &admin);
    }

    fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&types::DataKey::Admin)
            .unwrap();
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    fn version() -> u32 {
        1
    }
}
