#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, Address, Bytes, BytesN, Env, Vec,
};
use soroban_sdk::{contracterror, contractmeta};

contractmeta!(key = "Description", val = "Soroban Versioning");

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractErrors {
    UnexpectedError = 0,
    InvalidKey = 1,
    ProjectAlreadyExist = 2,
    UnregisteredMaintainer = 3,
    NoHashFound = 4,
}

#[contracttype]
pub enum DataKey {
    Admin, // Contract administrator
}

#[contracttype]
pub enum ProjectKey {
    Key(BytesN<32>),      // UUID of the project from keccak256(name)
    LastHash(BytesN<32>), // last hash of the project
}

#[contracttype]
pub struct Config {
    pub url: Bytes,       // link to toml file with project metadata
    pub hash: BytesN<32>, // hash of the file found at the URL
}

#[contracttype]
pub struct Project {
    pub name: Bytes,
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
        name: Bytes,
        maintainers: Vec<Address>,
        url: Bytes,
        hash: BytesN<32>,
    ) -> BytesN<32> {
        let project = Project {
            name,
            config: Config { url, hash },
            maintainers,
        };

        let key = env.crypto().keccak256(&project.name.clone());

        let key_ = ProjectKey::Key(key.clone());
        if let Some(_) = env.storage().persistent().get::<ProjectKey, Project>(&key_) {
            panic_with_error!(&env, &ContractErrors::ProjectAlreadyExist);
        } else {
            auth_maintainers(&env, &maintainer, &project.maintainers);
            env.storage().persistent().set(&key_, &project);

            return key;
        }
    }

    /// Change the configuration of the project.
    pub fn update_config(
        env: Env,
        maintainer: Address,
        key: BytesN<32>,
        maintainers: Vec<Address>,
        url: Bytes,
        hash: BytesN<32>,
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
    pub fn commit(env: Env, maintainer: Address, project_key: BytesN<32>, hash: BytesN<32>) {
        let key_ = ProjectKey::Key(project_key.clone());
        if let Some(project) = env.storage().persistent().get::<ProjectKey, Project>(&key_) {
            auth_maintainers(&env, &maintainer, &project.maintainers);
            env.storage()
                .persistent()
                .set(&ProjectKey::LastHash(project_key), &hash);
        } else {
            panic_with_error!(&env, &ContractErrors::InvalidKey);
        }
    }

    /// Get the last commit hash
    pub fn get_commit(env: Env, project_key: BytesN<32>) -> BytesN<32> {
        let key_ = ProjectKey::Key(project_key.clone());
        if let Some(_) = env.storage().persistent().get::<ProjectKey, Project>(&key_) {
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
