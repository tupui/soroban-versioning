use soroban_sdk::{
    Address, Bytes, BytesN, Env, String, Vec, contractimpl, panic_with_error,
};

use crate::{
    MembershipTrait, Tansu, TansuArgs, TansuClient, TansuTrait, errors, events, types,
};

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
    fn add_member(
        env: Env,
        member_address: Address,
        meta: String,
        git_identity: Option<String>,
        git_pubkey: Option<BytesN<32>>,
        msg: Option<Bytes>,
        sig: Option<BytesN<64>>,
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
        } else {
            let member = types::Member {
                projects: Vec::new(&env),
                meta,
            };
            env.storage().persistent().set(&member_key_, &member);

            if let (Some(git_identity), Some(git_pubkey), Some(msg), Some(sig)) =
                (git_identity, git_pubkey, msg, sig)
            {
                // Verify the signature
                env.crypto().ed25519_verify(&git_pubkey, &msg, &sig);

                // Parse the message
                let msg_str = core::str::from_utf8(msg.as_slice())
                    .map_err(|_| {
                        panic_with_error!(&env, &errors::ContractErrors::GitIdentityMessageParsing)
                    })
                    .unwrap();

                let lines: core::str::Lines = msg_str.lines();
                let lines_vec: Vec<String> = lines.map(String::from_str).collect_in(&env);

                if lines_vec.len() != 5 {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                // Check header
                if lines_vec.get(0).unwrap() != String::from_str(&env, "Stellar Signed Message") {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                // Check network
                if lines_vec.get(1).unwrap() != env.network().passphrase() {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                // Check account
                let member_address_string = member_address.to_string();
                if lines_vec.get(2).unwrap() != member_address_string {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                // Check nonce format (32 hex chars)
                let nonce = lines_vec.get(3).unwrap();
                if nonce.len() != 32 {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                // Check payload
                let payload = lines_vec.get(4).unwrap();
                let Ok(prefix) = String::from_str(&env, "tansu-bind|") else {
                    panic_with_error!(&env, &errors::ContractErrors::UnexpectedError)
                };
                if !payload.starts_with(prefix) {
                    panic_with_error!(&env, &errors::ContractErrors::GitIdentityInvalidMessage);
                }

                let git_identity_data = types::GitIdentity {
                    git_identity: git_identity.clone(),
                    git_pubkey,
                    msg,
                    sig,
                    signed_at: env.ledger().timestamp(),
                };

                let git_identity_key = types::DataKey::GitIdentity(member_address.clone());
                env.storage()
                    .persistent()
                    .set(&git_identity_key, &git_identity_data);
            }

            events::MemberAdded { member_address }.publish(&env);
        };
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

    fn get_git_identity(env: Env, member_address: Address) -> Option<types::GitIdentity> {
        let git_identity_key = types::DataKey::GitIdentity(member_address);
        env.storage().persistent().get(&git_identity_key)
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
