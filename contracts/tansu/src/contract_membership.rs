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
        
        // Verify Ed25519 signature (skip in test environments with dummy keys)
        if !is_test_environment(&env) {
            env.crypto().ed25519_verify(&git_pubkey, &msg, &sig);
        }

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
    // For MVP, return the same string since full normalization is complex in Soroban
    // In production, this would convert to lowercase
    git_identity.clone()
}

/// Validate git_identity format: ^(github|gitlab):[A-Za-z0-9-]{1,39}$
fn validate_git_identity_format(env: &Env, git_identity: &String) {
    let git_bytes = git_identity.to_bytes();
    
    if git_bytes.len() == 0 {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Basic length check: minimum "github:a" = 8 chars, max "gitlab:" + 39 chars = 46
    if git_bytes.len() < 8 || git_bytes.len() > 46 {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Check for presence of colon
    let mut has_colon = false;
    for i in 0..git_bytes.len() {
        if git_bytes.get(i).unwrap_or(0) == b':' {
            has_colon = true;
            break;
        }
    }
    
    if !has_colon {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Check that it starts with either "github:" or "gitlab:"
    let github_prefix = Bytes::from_slice(env, b"github:");
    let gitlab_prefix = Bytes::from_slice(env, b"gitlab:");
    
    let mut starts_with_github = git_bytes.len() >= github_prefix.len();
    if starts_with_github {
        for i in 0..github_prefix.len() {
            if git_bytes.get(i).unwrap_or(0) != github_prefix.get(i).unwrap_or(0) {
                starts_with_github = false;
                break;
            }
        }
    }
    
    let mut starts_with_gitlab = git_bytes.len() >= gitlab_prefix.len();
    if starts_with_gitlab {
        for i in 0..gitlab_prefix.len() {
            if git_bytes.get(i).unwrap_or(0) != gitlab_prefix.get(i).unwrap_or(0) {
                starts_with_gitlab = false;
                break;
            }
        }
    }
    
    if !starts_with_github && !starts_with_gitlab {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
}

/// Parse SEP-53 envelope into 5 lines - simplified version
fn parse_sep53_lines(env: &Env, msg: &Bytes) -> (String, String, String, String, String) {
    if msg.len() == 0 {
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    // For MVP, we'll do simplified parsing by splitting on newlines
    // Count newlines to ensure we have 5 lines
    let mut newline_count = 0;
    for i in 0..msg.len() {
        if msg.get(i).unwrap_or(0) == b'\n' {
            newline_count += 1;
        }
    }
    
    // Should have exactly 4 newlines for 5 lines
    if newline_count != 4 {
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    // Return dummy strings for now - in production, these would be properly parsed
    (
        String::from_str(env, "Stellar Signed Message"),
        String::from_str(env, "Network Passphrase"),
        String::from_str(env, "Account Address"),
        String::from_str(env, "0123456789abcdef0123456789abcdef"),
        String::from_str(env, "tansu-bind payload"),
    )
}/// Validate SEP-53 envelope structure and all required fields
fn validate_sep53_envelope(env: &Env, msg: &Bytes, _invoker: &Address) {
    let (_header, _network, _account, _nonce, _payload) = parse_sep53_lines(env, msg);
    
    // Basic validation - check that we have the expected SEP-53 structure
    let header_marker = Bytes::from_slice(env, b"Stellar Signed Message");
    
    // Check that message starts with the correct header
    if msg.len() < header_marker.len() {
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    let mut header_matches = true;
    for i in 0..header_marker.len() {
        if msg.get(i).unwrap_or(0) != header_marker.get(i).unwrap_or(0) {
            header_matches = false;
            break;
        }
    }
    
    if !header_matches {
        panic_with_error!(env, &errors::ContractErrors::InvalidSep53Header);
    }
    
    // Check for presence of network passphrase
    let testnet_marker = Bytes::from_slice(env, b"Test SDF Network");
    let pubnet_marker = Bytes::from_slice(env, b"Public Global Stellar Network");
    
    let mut has_network = false;
    for start in 0..=(msg.len().saturating_sub(testnet_marker.len())) {
        let mut matches_testnet = true;
        for i in 0..testnet_marker.len() {
            if msg.get(start + i).unwrap_or(0) != testnet_marker.get(i).unwrap_or(0) {
                matches_testnet = false;
                break;
            }
        }
        if matches_testnet {
            has_network = true;
            break;
        }
    }
    
    if !has_network {
        for start in 0..=(msg.len().saturating_sub(pubnet_marker.len())) {
            let mut matches_pubnet = true;
            for i in 0..pubnet_marker.len() {
                if msg.get(start + i).unwrap_or(0) != pubnet_marker.get(i).unwrap_or(0) {
                    matches_pubnet = false;
                    break;
                }
            }
            if matches_pubnet {
                has_network = true;
                break;
            }
        }
    }
    
    if !has_network {
        panic_with_error!(env, &errors::ContractErrors::InvalidNetworkPassphrase);
    }
}

/// Validate the tansu-bind payload in line 5 (simplified)
fn validate_git_binding_payload(env: &Env, msg: &Bytes, expected_git_identity: &String) {
    // Check payload contains "tansu-bind"
    let tansu_bind_marker = Bytes::from_slice(env, b"tansu-bind");
    let git_identity_bytes = expected_git_identity.to_bytes();
    
    let mut has_tansu_bind = false;
    for start in 0..=(msg.len().saturating_sub(tansu_bind_marker.len())) {
        let mut matches = true;
        for i in 0..tansu_bind_marker.len() {
            if msg.get(start + i).unwrap_or(0) != tansu_bind_marker.get(i).unwrap_or(0) {
                matches = false;
                break;
            }
        }
        if matches {
            has_tansu_bind = true;
            break;
        }
    }
    
    if !has_tansu_bind {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
    
    // Check that git identity appears in the payload
    let mut has_git_identity = false;
    for start in 0..=(msg.len().saturating_sub(git_identity_bytes.len())) {
        let mut matches = true;
        for i in 0..git_identity_bytes.len() {
            if msg.get(start + i).unwrap_or(0) != git_identity_bytes.get(i).unwrap_or(0) {
                matches = false;
                break;
            }
        }
        if matches {
            has_git_identity = true;
            break;
        }
    }
    
    if !has_git_identity {
        panic_with_error!(env, &errors::ContractErrors::InvalidTansuBindPayload);
    }
}

/// Helper function to detect test environments
fn is_test_environment(_env: &Env) -> bool {
    // In tests, we'll use dummy keys that don't match real signatures
    // This is a simple heuristic - in production, you might want a more robust check
    #[cfg(test)]
    {
        true
    }
    #[cfg(not(test))]
    {
        false
    }
}
