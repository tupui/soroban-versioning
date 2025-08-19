use soroban_sdk::{Address, BytesN, Env, contractimpl};

use crate::{Tansu, TansuArgs, TansuClient, TansuTrait, types};

#[contractimpl]
impl TansuTrait for Tansu {
    /// Initialize the Tansu contract with admin and domain contract configuration.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address with upgrade privileges
    /// * `domain_contract_id` - The address of the domain contract for project registration
    fn __constructor(env: Env, admin: Address, domain_contract_id: Address) {
        env.storage().instance().set(&types::DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&types::DataKey::DomainContractId, &domain_contract_id);
    }

    /// Upgrade the contract to a new WASM version.
    ///
    /// Only the current admin can call this function. Updates the contract's WASM hash
    /// changes the admin and domain contract configuration.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `new_wasm_hash` - The hash of the new WASM blob to deploy
    /// * `admin` - The new admin address
    /// * `domain_contract_id` - The new domain contract address
    ///
    /// # Panics
    /// * If the caller is not the current admin
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

    /// Get the current version of the contract.
    ///
    /// # Returns
    /// * `u32` - The contract version number
    fn version() -> u32 {
        1
    }
}
