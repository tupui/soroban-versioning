use soroban_sdk::{
    contractimpl, panic_with_error, symbol_short, vec, Address, Bytes, BytesN, Env, IntoVal,
    String, Symbol, Val, Vec,
};

use crate::{domain_contract, errors, types, Tansu, TansuArgs, TansuClient, VersioningTrait};

#[contractimpl]
impl VersioningTrait for Tansu {
    fn init(env: Env, admin: Address) {
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

    /// Register a new Git projects and associated metadata.
    fn register(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
        domain_contract_id: Address,
    ) -> Bytes {
        let project = types::Project {
            name: name.clone(),
            config: types::Config { url, hash },
            maintainers,
        };
        let str_len = name.len() as usize;
        if str_len > 15 {
            // could add more checks but handled in any case with later calls
            panic_with_error!(&env, &errors::ContractErrors::InvalidDomainError);
        }
        let mut slice: [u8; 15] = [0; 15];
        name.copy_into_slice(&mut slice[..str_len]);
        let name_b = Bytes::from_slice(&env, &slice[0..str_len]);

        let key: Bytes = env.crypto().keccak256(&name_b).into();

        let key_ = types::ProjectKey::Key(key.clone());
        if env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
            .is_some()
        {
            panic_with_error!(&env, &errors::ContractErrors::ProjectAlreadyExist);
        } else {
            crate::auth_maintainers(&env, &maintainer, &project.maintainers);

            let node = domain_node(&env, &key);
            let record_keys = domain_contract::RecordKeys::Record(node);

            let domain_client = domain_contract::Client::new(&env, &domain_contract_id);
            match domain_client.try_record(&record_keys) {
                Ok(Ok(None)) => domain_register(&env, &name_b, &maintainer, domain_contract_id),
                Ok(Ok(Some(domain_contract::Record::Domain(domain)))) => {
                    if domain.owner != maintainer {
                        panic_with_error!(&env, &errors::ContractErrors::MaintainerNotDomainOwner)
                    }
                }
                _ => panic_with_error!(&env, &errors::ContractErrors::InvalidDomainError),
            }
            env.storage().persistent().set(&key_, &project);

            env.events()
                .publish((symbol_short!("register"), key.clone()), name);
            key
        }
    }

    /// Change the configuration of the project.
    fn update_config(
        env: Env,
        maintainer: Address,
        key: Bytes,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
    ) {
        let key_ = types::ProjectKey::Key(key);
        if let Some(mut project) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
        {
            crate::auth_maintainers(&env, &maintainer, &project.maintainers);

            let config = types::Config { url, hash };
            project.config = config;
            project.maintainers = maintainers;
            env.storage().persistent().set(&key_, &project);
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Set the last commit hash
    fn commit(env: Env, maintainer: Address, project_key: Bytes, hash: String) {
        let key_ = types::ProjectKey::Key(project_key.clone());
        if let Some(project) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
        {
            crate::auth_maintainers(&env, &maintainer, &project.maintainers);
            env.storage()
                .persistent()
                .set(&types::ProjectKey::LastHash(project_key.clone()), &hash);
            env.events()
                .publish((symbol_short!("commit"), project_key), hash);
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Get the last commit hash
    fn get_commit(env: Env, project_key: Bytes) -> String {
        let key_ = types::ProjectKey::Key(project_key.clone());
        if env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
            .is_some()
        {
            env.storage()
                .persistent()
                .get(&types::ProjectKey::LastHash(project_key))
                .unwrap_or_else(|| {
                    panic_with_error!(&env, &errors::ContractErrors::NoHashFound);
                })
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    fn get_project(env: Env, project_key: Bytes) -> types::Project {
        let key_ = types::ProjectKey::Key(project_key.clone());

        env.storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
            })
    }
}

/// Register a Soroban Domain: https://sorobandomains.org
pub fn domain_register(env: &Env, name: &Bytes, maintainer: &Address, domain_contract_id: Address) {
    let tld = Bytes::from_slice(env, &[120, 108, 109]); // xlm
    let min_duration: u64 = 31536000;

    // Convert the arguments to Val
    let name_raw = name.to_val();
    let tld_raw = tld.to_val();
    let maintainer_raw = maintainer.to_val();
    let min_duration_raw: Val = min_duration.into_val(env);

    // Construct the init_args
    let init_args = vec![
        &env,
        name_raw,
        tld_raw,
        maintainer_raw,
        maintainer_raw,
        min_duration_raw,
    ];

    env.invoke_contract::<()>(
        &domain_contract_id,
        &Symbol::new(env, "set_record"),
        init_args,
    );
}

pub fn domain_node(env: &Env, domain: &Bytes) -> BytesN<32> {
    let tld = Bytes::from_slice(env, &[120, 108, 109]); // xlm
    let parent_hash: Bytes = env.crypto().keccak256(&tld).into();
    let mut node_builder: Bytes = Bytes::new(env);
    node_builder.append(&parent_hash);
    node_builder.append(domain);

    env.crypto().keccak256(&node_builder).into()
}
