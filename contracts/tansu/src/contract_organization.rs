use crate::{
    OrganizationTrait, Tansu, TansuArgs, TansuClient, TansuTrait, errors, events, types,
};
use soroban_sdk::{Address, Bytes, Env, String, Vec, contractimpl, panic_with_error};

const MAX_PROJECTS_PER_PAGE: u32 = 10;
const MAX_ORGANIZATIONS_PER_PAGE: u32 = 10;

#[contractimpl]
impl OrganizationTrait for Tansu {
    /// Register a new organization.
    ///
    /// Creates a new organization entry with maintainers and configuration.
    /// Organizations can group multiple projects together.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `name` - The organization name (max 15 characters)
    /// * `maintainers` - List of maintainer addresses for the organization
    /// * `ipfs` - CID of the organization's tansu.toml file with metadata
    ///
    /// # Returns
    /// * `Bytes` - The organization key (keccak256 hash of the name)
    ///
    /// # Panics
    /// * If the organization name is longer than 15 characters
    /// * If the organization already exists
    /// * If the maintainer is not authorized
    fn register_organization(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        ipfs: String,
    ) -> Bytes {
        Tansu::require_not_paused(env.clone());

        let organization = types::Organization {
            name: name.clone(),
            maintainers: maintainers.clone(),
            config: types::Config {
                url: String::from_str(&env, ""), // Organizations don't have a single URL
                ipfs,
            },
        };

        let str_len = name.len() as usize;
        if str_len > 15 {
            panic_with_error!(&env, &errors::ContractErrors::InvalidDomainError);
        }

        let mut slice: [u8; 15] = [0; 15];
        name.copy_into_slice(&mut slice[..str_len]);
        let name_b = Bytes::from_slice(&env, &slice[0..str_len]);

        let key: Bytes = env.crypto().keccak256(&name_b).into();

        let key_ = types::OrganizationKey::Key(key.clone());
        if env
            .storage()
            .persistent()
            .get::<types::OrganizationKey, types::Organization>(&key_)
            .is_some()
        {
            panic_with_error!(&env, &errors::ContractErrors::OrganizationAlreadyExist);
        } else {
            maintainer.require_auth();
            if !organization.maintainers.contains(&maintainer) {
                panic_with_error!(&env, &errors::ContractErrors::UnauthorizedSigner);
            }

            env.storage().persistent().set(&key_, &organization);

            // Add to organization list
            let total_organizations = env
                .storage()
                .persistent()
                .get(&types::OrganizationKey::TotalOrganizations)
                .unwrap_or(0u32);
            let page = total_organizations / MAX_ORGANIZATIONS_PER_PAGE;

            let mut organization_keys: Vec<Bytes> = env
                .storage()
                .persistent()
                .get(&types::OrganizationKey::OrganizationKeys(page))
                .unwrap_or(Vec::new(&env));

            organization_keys.push_back(key.clone());

            env.storage()
                .persistent()
                .set(&types::OrganizationKey::OrganizationKeys(page), &organization_keys);

            env.storage()
                .persistent()
                .set(&types::OrganizationKey::TotalOrganizations, &(total_organizations + 1));

            events::OrganizationRegistered {
                organization_key: key.clone(),
                name,
                maintainer,
            }
            .publish(&env);

            key
        }
    }

    /// Add a project to an organization.
    ///
    /// Links an existing project to an organization. The project must exist
    /// and the caller must be a maintainer of both the project and the organization.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `organization_key` - The organization key
    /// * `project_key` - The project key to add
    ///
    /// # Panics
    /// * If the organization doesn't exist
    /// * If the project doesn't exist
    /// * If the maintainer is not authorized for both
    /// * If the project is already in an organization
    fn add_project_to_organization(
        env: Env,
        maintainer: Address,
        organization_key: Bytes,
        project_key: Bytes,
    ) {
        Tansu::require_not_paused(env.clone());

        maintainer.require_auth();

        // Verify organization exists and maintainer is authorized
        let org_key = types::OrganizationKey::Key(organization_key.clone());
        let organization = env
            .storage()
            .persistent()
            .get::<types::OrganizationKey, types::Organization>(&org_key)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::OrganizationNotFound);
            });

        if !organization.maintainers.contains(&maintainer) {
            panic_with_error!(&env, &errors::ContractErrors::UnauthorizedSigner);
        }

        // Verify project exists and maintainer is authorized
        let proj_key = types::ProjectKey::Key(project_key.clone());
        let mut project = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&proj_key)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
            });

        if !project.maintainers.contains(&maintainer) {
            panic_with_error!(&env, &errors::ContractErrors::UnauthorizedSigner);
        }

        // Check if project is already in an organization
        // Note: We allow re-adding to same org or changing orgs, but this could be restricted
        // For now, we'll allow updating the organization_key

        // Link project to organization
        project.organization_key = Some(organization_key.clone());
        env.storage().persistent().set(&proj_key, &project);

        // Add project to organization's project list
        let total_projects = env
            .storage()
            .persistent()
            .get(&types::OrganizationKey::OrganizationProjects(organization_key.clone()))
            .unwrap_or(0u32);
        let page = total_projects / MAX_PROJECTS_PER_PAGE;

        let mut project_keys: Vec<Bytes> = env
            .storage()
            .persistent()
            .get(&types::OrganizationKey::OrganizationProjectsPage(
                organization_key.clone(),
                page,
            ))
            .unwrap_or(Vec::new(&env));

        project_keys.push_back(project_key.clone());

        env.storage()
            .persistent()
            .set(
                &types::OrganizationKey::OrganizationProjectsPage(organization_key.clone(), page),
                &project_keys,
            );

        env.storage()
            .persistent()
            .set(
                &types::OrganizationKey::OrganizationProjects(organization_key.clone()),
                &(total_projects + 1),
            );

        events::ProjectAddedToOrganization {
            organization_key,
            project_key,
            maintainer,
        }
        .publish(&env);
    }

    /// Get organization information.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `organization_key` - The organization key identifier
    ///
    /// # Returns
    /// * `types::Organization` - Organization information
    ///
    /// # Panics
    /// * If the organization doesn't exist
    fn get_organization(env: Env, organization_key: Bytes) -> types::Organization {
        let key_ = types::OrganizationKey::Key(organization_key);

        env.storage()
            .persistent()
            .get::<types::OrganizationKey, types::Organization>(&key_)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::OrganizationNotFound);
            })
    }

    /// Get a page of projects in an organization.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `organization_key` - The organization key
    /// * `page` - The page number (0-based)
    ///
    /// # Returns
    /// * `Vec<types::Project>` - List of projects on the requested page
    fn get_organization_projects(
        env: Env,
        organization_key: Bytes,
        page: u32,
    ) -> Vec<types::Project> {
        if let Some(project_keys) = env.storage().persistent().get::<_, Vec<Bytes>>(
            &types::OrganizationKey::OrganizationProjectsPage(organization_key.clone(), page),
        ) {
            let mut projects = Vec::new(&env);
            for key in project_keys {
                let key_ = types::ProjectKey::Key(key.clone());
                if let Some(project) = env
                    .storage()
                    .persistent()
                    .get::<types::ProjectKey, types::Project>(&key_)
                {
                    projects.push_back(project);
                }
            }
            projects
        } else {
            panic_with_error!(&env, &errors::ContractErrors::NoOrganizationPageFound);
        }
    }

    /// Get total number of projects in an organization.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `organization_key` - The organization key
    ///
    /// # Returns
    /// * `u32` - Total number of projects
    fn get_organization_projects_count(env: Env, organization_key: Bytes) -> u32 {
        env.storage()
            .persistent()
            .get(&types::OrganizationKey::OrganizationProjects(organization_key))
            .unwrap_or(0u32)
    }

    /// Get a page of organizations.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `page` - The page number (0-based)
    ///
    /// # Returns
    /// * `Vec<types::Organization>` - List of organizations on the requested page
    fn get_organizations(env: Env, page: u32) -> Vec<types::Organization> {
        if let Some(organization_keys) = env
            .storage()
            .persistent()
            .get::<_, Vec<Bytes>>(&types::OrganizationKey::OrganizationKeys(page))
        {
            let mut organizations = Vec::new(&env);
            for key in organization_keys {
                let key_ = types::OrganizationKey::Key(key.clone());
                if let Some(organization) = env
                    .storage()
                    .persistent()
                    .get::<types::OrganizationKey, types::Organization>(&key_)
                {
                    organizations.push_back(organization);
                }
            }
            organizations
        } else {
            panic_with_error!(&env, &errors::ContractErrors::NoOrganizationPageFound);
        }
    }

    /// Update organization configuration.
    ///
    /// Allows maintainers to change the organization's IPFS configuration.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer calling this function
    /// * `organization_key` - The organization key identifier
    /// * `ipfs` - New IPFS CID for organization metadata
    ///
    /// # Panics
    /// * If the organization doesn't exist
    /// * If the maintainer is not authorized
    fn update_organization_config(
        env: Env,
        maintainer: Address,
        organization_key: Bytes,
        ipfs: String,
    ) {
        Tansu::require_not_paused(env.clone());

        let key_ = types::OrganizationKey::Key(organization_key.clone());

        let mut organization = env
            .storage()
            .persistent()
            .get::<types::OrganizationKey, types::Organization>(&key_)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::OrganizationNotFound);
            });

        maintainer.require_auth();
        if !organization.maintainers.contains(&maintainer) {
            panic_with_error!(&env, &errors::ContractErrors::UnauthorizedSigner);
        }

        organization.config.ipfs = ipfs;
        env.storage().persistent().set(&key_, &organization);

        events::OrganizationConfigUpdated {
            organization_key,
            maintainer,
        }
        .publish(&env);
    }
}
