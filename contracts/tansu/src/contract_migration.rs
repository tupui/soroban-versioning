use soroban_sdk::{Address, Bytes, Env, String, Vec, contractimpl};

use crate::{MigrationTrait, Tansu, TansuArgs, TansuClient, TansuTrait, types};

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

        for name in names {
            let key = crate::get_project_key(&env, &name);
            let key_ = types::ProjectKey::Key(key.clone());

            // Only migrate if the project exists but might not be in the pagination list
            if env.storage().persistent().has(&key_) {
                let total_projects = env
                    .storage()
                    .persistent()
                    .get(&types::ProjectKey::TotalProjects)
                    .unwrap_or(0u32);

                let page = total_projects / types::MAX_PROJECTS_PER_PAGE;

                let mut project_keys: Vec<Bytes> = env
                    .storage()
                    .persistent()
                    .get(&types::ProjectKey::ProjectKeys(page))
                    .unwrap_or(Vec::new(&env));

                if !project_keys.contains(key.clone()) {
                    project_keys.push_back(key.clone());

                    env.storage()
                        .persistent()
                        .set(&types::ProjectKey::ProjectKeys(page), &project_keys);

                    env.storage()
                        .persistent()
                        .set(&types::ProjectKey::TotalProjects, &(total_projects + 1));
                }
            }
        }
    }
}
