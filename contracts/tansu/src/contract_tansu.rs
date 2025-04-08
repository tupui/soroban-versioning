use soroban_sdk::{Address, BytesN, Env, contractimpl};

use crate::{Tansu, TansuArgs, TansuClient, TansuTrait, types};

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
