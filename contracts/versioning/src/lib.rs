#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, symbol_short, Address, Bytes, BytesN,
    Env, IntoVal, String, Symbol, Vec,
};
use soroban_sdk::{contracterror, contractmeta};

contractmeta!(key = "Description", val = "Tansu - Soroban Versioning");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractErrors {
    UnexpectedError = 0,
    InvalidKey = 1,
    ProjectAlreadyExist = 2,
    UnregisteredMaintainer = 3,
    NoHashFound = 4,
    InputValidationError = 5,
}

#[contracttype]
pub enum DataKey {
    Admin, // Contract administrator
}

#[contracttype]
pub enum ProjectKey {
    Key(Bytes),      // UUID of the project from keccak256(name)
    LastHash(Bytes), // last hash of the project
}

#[contracttype]
pub struct Config {
    pub url: String,  // link to toml file with project metadata
    pub hash: String, // hash of the file found at the URL
}

#[contracttype]
pub struct Project {
    pub name: String,
    pub config: Config,
    pub maintainers: Vec<Address>,
}

#[contract]
pub struct Versioning;

#[contractimpl]
impl Versioning {
    pub fn init(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn version() -> u32 {
        1
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Register a new Git projects and associated metadata.
    pub fn register(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
        domain_contract_id: Address,
    ) -> Bytes {
        let project = Project {
            name: name.clone(),
            config: Config { url, hash },
            maintainers,
        };
        let str_len = name.len() as usize;
        if str_len > 64 {
            panic_with_error!(&env, &ContractErrors::InputValidationError);
        }
        let mut slice: [u8; 64] = [0; 64];
        name.copy_into_slice(&mut slice[..str_len]);
        let name_b = Bytes::from_slice(&env, &slice[0..str_len]);

        let key: Bytes = env.crypto().keccak256(&name_b).into();

        let key_ = ProjectKey::Key(key.clone());
        if env
            .storage()
            .persistent()
            .get::<ProjectKey, Project>(&key_)
            .is_some()
        {
            panic_with_error!(&env, &ContractErrors::ProjectAlreadyExist);
        } else {
            auth_maintainers(&env, &maintainer, &project.maintainers);

            // domain_register(&env, &name_b, &maintainer, domain_contract_id);

            let tld = Bytes::from_slice(&env, &[120, 108, 109]); // xlm
            let min_duration: u64 = 31536000;
            env.invoke_contract::<()>(
                &domain_contract_id,
                &Symbol::new(&env, "set_record"),
                (
                    name_b,
                    tld,
                    maintainer.clone(),
                    maintainer.clone(),
                    min_duration,
                )
                    .into_val(&env),
            );

            env.storage().persistent().set(&key_, &project);

            env.events()
                .publish((symbol_short!("register"), name), key.clone());
            key
        }
    }

    /// Change the configuration of the project.
    pub fn update_config(
        env: Env,
        maintainer: Address,
        key: Bytes,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
    ) {
        let key_ = ProjectKey::Key(key);
        if let Some(mut project) = env.storage().persistent().get::<ProjectKey, Project>(&key_) {
            auth_maintainers(&env, &maintainer, &project.maintainers);

            let config = Config { url, hash };
            project.config = config;
            project.maintainers = maintainers;
            env.storage().persistent().set(&key_, &project);
        } else {
            panic_with_error!(&env, &ContractErrors::InvalidKey);
        }
    }

    /// Set the last commit hash
    pub fn commit(env: Env, maintainer: Address, project_key: Bytes, hash: String) {
        let key_ = ProjectKey::Key(project_key.clone());
        if let Some(project) = env.storage().persistent().get::<ProjectKey, Project>(&key_) {
            auth_maintainers(&env, &maintainer, &project.maintainers);
            env.storage()
                .persistent()
                .set(&ProjectKey::LastHash(project_key.clone()), &hash);
            env.events()
                .publish((symbol_short!("commit"), project_key), hash);
        } else {
            panic_with_error!(&env, &ContractErrors::InvalidKey);
        }
    }

    /// Get the last commit hash
    pub fn get_commit(env: Env, project_key: Bytes) -> String {
        let key_ = ProjectKey::Key(project_key.clone());
        if env
            .storage()
            .persistent()
            .get::<ProjectKey, Project>(&key_)
            .is_some()
        {
            env.storage()
                .persistent()
                .get(&ProjectKey::LastHash(project_key))
                .unwrap_or_else(|| {
                    panic_with_error!(&env, &ContractErrors::NoHashFound);
                })
        } else {
            panic_with_error!(&env, &ContractErrors::InvalidKey);
        }
    }
}

fn auth_maintainers(env: &Env, maintainer: &Address, maintainers: &Vec<Address>) {
    maintainer.require_auth();
    if !maintainers.contains(maintainer) {
        panic_with_error!(&env, &ContractErrors::UnregisteredMaintainer);
    }
}

mod test;
