use soroban_sdk::{
    Address, Bytes, BytesN, Env, IntoVal, String, Symbol, Val, Vec, contractimpl, panic_with_error,
    symbol_short, vec,
};

use crate::{Tansu, TansuArgs, TansuClient, VersioningTrait, domain_contract, errors, types};

#[contractimpl]
impl VersioningTrait for Tansu {
    /// Register a new project.
    ///
    /// Creates a new project entry with maintainers, URL, and commit hash.
    /// Also registers the project name in the domain contract if not already registered.
    /// The project key is generated using keccak256 hash of the project name.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `name` - The project name (max 15 characters)
    /// * `maintainers` - List of maintainer addresses for the project
    /// * `url` - The project's Git repository URL
    /// * `hash` - The current commit hash
    ///
    /// # Returns
    /// * `Bytes` - The project key (keccak256 hash of the name)
    ///
    /// # Panics
    /// * If the project name is longer than 15 characters
    /// * If the project already exists
    /// * If the maintainer is not authorized
    /// * If the domain registration fails
    /// * If the maintainer doesn't own an existing domain
    fn register(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
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
            maintainer.require_auth();
            if !project.maintainers.contains(&maintainer) {
                panic_with_error!(&env, &errors::ContractErrors::UnregisteredMaintainer);
            }

            let domain_contract_id: Address = env
                .storage()
                .instance()
                .get(&types::DataKey::DomainContractId)
                .unwrap();

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

    /// Update the configuration of an existing project.
    ///
    /// Allows maintainers to change the project's URL, commit hash, and maintainer list.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `key` - The project key identifier
    /// * `maintainers` - New list of maintainer addresses
    /// * `url` - New Git repository URL
    /// * `hash` - New commit hash
    ///
    /// # Panics
    /// * If the project doesn't exist
    /// * If the maintainer is not authorized
    fn update_config(
        env: Env,
        maintainer: Address,
        key: Bytes,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
    ) {
        let key_ = types::ProjectKey::Key(key.clone());

        let mut project = crate::auth_maintainers(&env, &maintainer, &key);

        let config = types::Config { url, hash };
        project.config = config;
        project.maintainers = maintainers;
        env.storage().persistent().set(&key_, &project);
    }

    /// Set the latest commit hash for a project.
    ///
    /// Updates the current commit hash for the specified project.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `project_key` - The project key identifier
    /// * `hash` - The new commit hash
    ///
    /// # Panics
    /// * If the project doesn't exist
    /// * If the maintainer is not authorized
    fn commit(env: Env, maintainer: Address, project_key: Bytes, hash: String) {
        crate::auth_maintainers(&env, &maintainer, &project_key);
        env.storage()
            .persistent()
            .set(&types::ProjectKey::LastHash(project_key.clone()), &hash);
        env.events()
            .publish((symbol_short!("commit"), project_key), hash);
    }

    /// Get the last commit hash
    /// Get the latest commit hash for a project.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    ///
    /// # Returns
    /// * `String` - The current commit hash
    ///
    /// # Panics
    /// * If the project doesn't exist
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

    /// Get project information including configuration and maintainers.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    ///
    /// # Returns
    /// * `types::Project` - Project information including name, config, and maintainers
    ///
    /// # Panics
    /// * If the project doesn't exist
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
/// Register a project name in the domain contract.
///
/// Helper function to register a project name in the domain contract system.
///
/// # Arguments
/// * `env` - The environment object
/// * `name` - The project name to register
/// * `maintainer` - The maintainer address to set as owner
/// * `domain_contract_id` - The domain contract address
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

/// Generate a domain node hash for the domain contract.
///
/// Helper function to create a domain node hash from a project key.
///
/// # Arguments
/// * `env` - The environment object
/// * `domain` - The domain bytes to hash
///
/// # Returns
/// * `BytesN<32>` - The domain node hash
pub fn domain_node(env: &Env, domain: &Bytes) -> BytesN<32> {
    let tld = Bytes::from_slice(env, &[120, 108, 109]); // xlm
    let parent_hash: Bytes = env.crypto().keccak256(&tld).into();
    let mut node_builder: Bytes = Bytes::new(env);
    node_builder.append(&parent_hash);
    node_builder.append(domain);

    env.crypto().keccak256(&node_builder).into()
}
