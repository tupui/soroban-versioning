use soroban_sdk::{Address, Bytes, Env, String, Vec, contractimpl};

use crate::{MigrationTrait, Tansu, TansuArgs, TansuClient, TansuTrait, types};

const LAST_PAGE: u32 = 0;

#[contractimpl]
impl MigrationTrait for Tansu {
    /// Add projects to pagination. This is used to migrate projects when the project was created before the pagination was implemented.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `admin` - The admin address
    /// * `names` - The names of the projects to add
    ///
    /// # Returns
    /// * `()`
    fn add_projects_to_pagination(env: Env, admin: Address, names: Vec<String>) {
        Tansu::require_not_paused(env.clone());
        crate::contract_tansu::auth_admin(&env, &admin);

        let mut total_projects_paginated = 0;

        let mut project_keys_page: Vec<Bytes> = env
            .storage()
            .persistent()
            .get(&types::ProjectKey::ProjectKeys(LAST_PAGE))
            .unwrap_or(Vec::new(&env));

        for name in names {
            let str_len = name.len() as usize;
            let mut slice: [u8; 15] = [0; 15];
            name.copy_into_slice(&mut slice[..str_len]);
            let name_b = Bytes::from_slice(&env, &slice[0..str_len]);

            let key: Bytes = env.crypto().keccak256(&name_b).into();
            let key_ = types::ProjectKey::Key(key.clone());

            // Only migrate if the project exists but might not be in the pagination list
            if env.storage().persistent().has(&key_) {
                if !project_keys_page.contains(key.clone()) {
                    project_keys_page.push_back(key.clone());
                    total_projects_paginated += 1;
                }
            }
        }

        if total_projects_paginated > 0 {
            env.storage().persistent().set(
                &types::ProjectKey::ProjectKeys(LAST_PAGE),
                &project_keys_page,
            );

            env.storage()
                .persistent()
                .set(&types::ProjectKey::TotalProjects, &total_projects_paginated);
        }
    }
}
