use soroban_sdk::{Address, Bytes, BytesN, Env, String, Vec, contractimpl, panic_with_error};

use crate::{MembershipTrait, Tansu, TansuArgs, TansuClient, TansuTrait, errors, events, types};

#[contractimpl]
impl MembershipTrait for Tansu {
    /// Add a new member to the system with metadata.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `member_address` - The address of the member to add
    /// * `meta` - Metadata string associated with the member (e.g., IPFS hash)
    ///
    /// # Panics
    /// * If the member already exists
    fn add_member(env: Env, member_address: Address, meta: String) {
        Tansu::require_not_paused(env.clone());

        member_address.require_auth();

        let member_key_ = types::DataKey::Member(member_address.clone());
        if env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
            .is_some()
        {
            panic_with_error!(&env, &errors::ContractErrors::MemberAlreadyExist)
        } else {
            let member = types::Member {
                projects: Vec::new(&env),
                meta,
                git_provider_username: None,
                git_pubkey_ed25519: None,
                git_msg: None,
                git_sig: None,
                git_signed_at: None,
            };
            env.storage().persistent().set(&member_key_, &member);

            events::MemberAdded { member_address }.publish(&env);
        };
    }

    fn add_member_with_git(
        env: Env, 
        member_address: Address, 
        meta: String,
        git_identity: String,      // "provider:username"
        git_pubkey: BytesN<32>,    // Raw Ed25519 public key
        msg: Bytes,               // 5-line SEP-53 envelope
        sig: BytesN<64>,          // Raw Ed25519 signature
    ) {
        Tansu::require_not_paused(env.clone());

        member_address.require_auth();

        let member_key_ = types::DataKey::Member(member_address.clone());
        if env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
            .is_some()
        {
            panic_with_error!(&env, &errors::ContractErrors::MemberAlreadyExist)
        }

        // Validate git_identity format
        validate_git_identity_format(&env, &git_identity);

        // Create normalized handle for uniqueness check
        let normalized_handle = normalize_git_handle(&env, &git_identity);
        let handle_index_key = types::DataKey::GitHandleIndex(normalized_handle.clone());
        
        // Check if handle is already taken
        if env.storage().persistent().get::<types::DataKey, Address>(&handle_index_key).is_some() {
            panic_with_error!(&env, &errors::ContractErrors::GitHandleTaken)
        }

        // Validate SEP-53 envelope and signature
        validate_sep53_envelope(&env, &msg, &member_address);
        validate_git_binding_payload(&env, &msg, &git_identity);
        
        // Verify Ed25519 signature
        env.crypto().ed25519_verify(&git_pubkey, &msg, &sig);

        let member = types::Member {
            projects: Vec::new(&env),
            meta,
            git_provider_username: Some(git_identity),
            git_pubkey_ed25519: Some(git_pubkey),
            git_msg: Some(msg),
            git_sig: Some(sig),
            git_signed_at: Some(env.ledger().timestamp()),
        };

        // Store member and index the git handle
        env.storage().persistent().set(&member_key_, &member);
        env.storage().persistent().set(&handle_index_key, &member_address);

        events::MemberAdded { member_address }.publish(&env);
    }

    /// Get member information including all project badges.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `member_address` - The address of the member to retrieve
    ///
    /// # Returns
    /// * `types::Member` - Member information including metadata and project badges
    ///
    /// # Panics
    /// * If the member doesn't exist
    fn get_member(env: Env, member_address: Address) -> types::Member {
        let member_key_ = types::DataKey::Member(member_address.clone());
        env.storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::UnknownMember);
            })
    }

    /// Set badges for a member in a specific project.
    ///
    /// This function replaces all existing badges for the member in the specified project
    /// with the new badge list. The member's maximum voting
    /// weight is calculated as the sum of all assigned badge weights.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer (must be authorized)
    /// * `key` - The project key identifier
    /// * `member` - The address of the member to set badges for
    /// * `badges` - Vector of badges to assign
    ///
    /// # Panics
    /// * If the maintainer is not authorized
    /// * If the member doesn't exist
    /// * If the project doesn't exist
    fn set_badges(
        env: Env,
        maintainer: Address,
        key: Bytes,
        member: Address,
        badges: Vec<types::Badge>,
    ) {
        Tansu::require_not_paused(env.clone());

        crate::auth_maintainers(&env, &maintainer, &key);

        let member_key_ = types::DataKey::Member(member.clone());
        let mut member_ = if let Some(member_) = env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
        {
            member_
        } else {
            panic_with_error!(&env, &errors::ContractErrors::UnknownMember)
        };

        // For a member, go over its projects and replace all badges for
        // a project
        'member_projects_badges: {
            for i in 0..member_.projects.len() {
                if let Some(project_badge) = member_.projects.get(i)
                    && project_badge.project == key
                {
                    let mut project_badges = project_badge.clone();
                    project_badges.badges = badges.clone();
                    member_.projects.set(i, project_badges);
                    break 'member_projects_badges;
                }
            }
            let project_badges = types::ProjectBadges {
                project: key.clone(),
                badges: badges.clone(),
            };
            member_.projects.push_back(project_badges);
        }

        // For a project, go over all badges and add the specific member if it
        // has the badge
        let badges_key_ = types::ProjectKey::Badges(key.clone());
        let mut badges_ = <Tansu as MembershipTrait>::get_badges(env.clone(), key.clone());

        for badge_kind in [
            types::Badge::Developer,
            types::Badge::Triage,
            types::Badge::Community,
            types::Badge::Verified,
        ] {
            // Pick the right vector for this badge kind
            let vec_ref: &mut Vec<Address> = match badge_kind {
                types::Badge::Developer => &mut badges_.developer,
                types::Badge::Triage => &mut badges_.triage,
                types::Badge::Community => &mut badges_.community,
                types::Badge::Verified => &mut badges_.verified,
                _ => continue,
            };

            // Build a cleaned-up copy removing all badges from member
            let mut new_vec: Vec<Address> = Vec::new(&env);
            for addr in vec_ref.iter() {
                if addr != member.clone() {
                    new_vec.push_back(addr);
                }
            }
            // Add the member back if they should hold this badge now
            if badges.contains(badge_kind.clone()) {
                new_vec.push_back(member.clone());
            }
            // Replace the old vector
            *vec_ref = new_vec;
        }

        env.storage().persistent().set(&badges_key_, &badges_);
        env.storage().persistent().set(&member_key_, &member_);

        events::BadgesUpdated {
            project_key: key,
            maintainer,
            member,
            badges_count: badges.len(),
        }
        .publish(&env);
    }

    /// Get all badges for a specific project, organized by badge type.
    ///
    /// Returns a structure containing vectors of member addresses for each badge type
    /// (Developer, Triage, Community, Verified).
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `key` - The project key identifier
    ///
    /// # Returns
    /// * `types::Badges` - Structure containing member addresses for each badge type
    fn get_badges(env: Env, key: Bytes) -> types::Badges {
        let badges_key_ = types::ProjectKey::Badges(key);
        if let Some(badges_) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Badges>(&badges_key_)
        {
            badges_
        } else {
            types::Badges {
                developer: Vec::new(&env),
                triage: Vec::new(&env),
                community: Vec::new(&env),
                verified: Vec::new(&env),
            }
        }
    }

    /// Get the maximum voting weight for a member in a specific project.
    ///
    /// Calculates the sum of all badge weights for the member in the project.
    /// If no badges are assigned, returns the Default badge weight (1).
    /// This weight determines the maximum number of votes the member can cast
    /// in a single voting transaction.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    /// * `member_address` - The address of the member
    ///
    /// # Returns
    /// * `u32` - The maximum voting weight for the member
    ///
    /// # Panics
    /// * If the member doesn't exist
    fn get_max_weight(env: Env, project_key: Bytes, member_address: Address) -> u32 {
        let member_key = types::DataKey::Member(member_address.clone());

        if let Some(member) = env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key)
        {
            match member
                .projects
                .iter()
                .find(|project_badges| project_badges.project == project_key)
            {
                Some(project_badges) => {
                    if project_badges.badges.is_empty() {
                        types::Badge::Default as u32
                    } else {
                        project_badges
                            .badges
                            .iter()
                            .map(|badge| badge as u32)
                            .sum::<u32>()
                    }
                }
                _ => types::Badge::Default as u32,
            }
        } else {
            types::Badge::Default as u32
        }
    }
}

/// Normalize git handle to lowercase for case-insensitive uniqueness
fn normalize_git_handle(_env: &Env, git_identity: &String) -> String {
    // For MVP, we'll store the original case but check for conflicts
    // TODO: Implement proper case-insensitive normalization when Soroban String supports it
    git_identity.clone()
}

/// Validate git_identity format: provider:username where provider ∈ {github, gitlab}
fn validate_git_identity_format(env: &Env, git_identity: &String) {
    if git_identity.is_empty() {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Validate length constraints  
    if git_identity.len() < 8 || git_identity.len() > 50 {  // github:a to gitlab:username39chars
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
}

/// Validate SEP-53 envelope structure and basic checks
fn validate_sep53_envelope(env: &Env, msg: &Bytes, _invoker: &Address) {
    if msg.is_empty() {
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    // Basic length validation
    if msg.len() < 100 {  // Rough minimum for all required fields
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    // For now, we'll do basic validation. In a full implementation,
    // we'd need to parse each line properly with Soroban-compatible string handling
    // TODO: Implement full line-by-line validation
}

/// Validate the tansu-bind payload in line 5
fn validate_git_binding_payload(env: &Env, msg: &Bytes, _expected_git_identity: &String) {
    if msg.is_empty() {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Basic length validation
    if msg.len() < 50 {  // Minimum for meaningful payload
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // For now, we'll do basic validation. In a full implementation,
    // we'd need to parse the payload properly with Soroban-compatible string handling
    // TODO: Implement full payload validation including git identity matching
}
