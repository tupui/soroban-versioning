use soroban_sdk::{Address, Bytes, Env, String, Vec, contractimpl};

use crate::{MigrationTrait, Tansu, TansuArgs, TansuClient, TansuTrait, types};

pub const MAX_PROJECTS_PER_PAGE: u32 = 10;

#[contractimpl]
impl MigrationTrait for Tansu {
    /// Add projects to the new pagination list. This is used to migrate projects when the project was created before the pagination was implemented.
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

        let mut total_projects = env
            .storage()
            .persistent()
            .get(&types::ProjectKey::TotalProjects)
            .unwrap_or(0u32);

        for name in names {
            let str_len = name.len() as usize;
            let mut slice: [u8; 15] = [0; 15];
            name.copy_into_slice(&mut slice[..str_len]);
            let name_b = Bytes::from_slice(&env, &slice[0..str_len]);

            let key: Bytes = env.crypto().keccak256(&name_b).into();
            let key_ = types::ProjectKey::Key(key.clone());

            // Only migrate if the project exists but might not be in the pagination list
            if env.storage().persistent().has(&key_) {
                let mut already_exists = false;

                // Check all existing pages for the key to avoid duplicates
                let num_pages =
                    (total_projects + MAX_PROJECTS_PER_PAGE - 1) / MAX_PROJECTS_PER_PAGE;

                for p in 0..num_pages {
                    let project_keys: Vec<Bytes> = env
                        .storage()
                        .persistent()
                        .get(&types::ProjectKey::ProjectKeys(p))
                        .unwrap_or(Vec::new(&env));

                    if project_keys.contains(&key) {
                        already_exists = true;
                        break;
                    }
                }

                if !already_exists {
                    let page = total_projects / MAX_PROJECTS_PER_PAGE;
                    let mut project_keys: Vec<Bytes> = env
                        .storage()
                        .persistent()
                        .get(&types::ProjectKey::ProjectKeys(page))
                        .unwrap_or(Vec::new(&env));

                    project_keys.push_back(key.clone());
                    env.storage()
                        .persistent()
                        .set(&types::ProjectKey::ProjectKeys(page), &project_keys);
                    total_projects += 1;
                }
            }
        }

        env.storage()
            .persistent()
            .set(&types::ProjectKey::TotalProjects, &total_projects);
    }
}
