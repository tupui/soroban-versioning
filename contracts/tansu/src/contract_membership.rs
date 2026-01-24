use soroban_sdk::{Address, Bytes, Env, String, Vec, contractimpl, panic_with_error};

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
    fn add_member(
        env: Env,
        member_address: Address,
        meta: String,
        git_identity: Option<String>,
        git_pubkey: Option<String>,
        msg: Option<String>,
        sig: Option<String>,
    ) {
        Tansu::require_not_paused(env.clone());

        member_address.require_auth();

        if let Some(git_id) = git_identity.clone()
            && let Some(pubkey_hex) = git_pubkey.clone()
            && let Some(msg_str) = msg.clone()
            && let Some(sig_hex) = sig.clone()
        {
            // Convert String to Bytes using fixed buffer and copy_into_slice
            let msg_len = msg_str.len();
            let mut buf = [0u8; 1024];
            if msg_len > 1024 {
                panic!("Message too long");
            }
            msg_str.copy_into_slice(&mut buf[..msg_len as usize]);
            let msg_bytes = Bytes::from_slice(&env, &buf[..msg_len as usize]);

            // Split bytes by newline (0x0A)
            let mut lines_bytes: Vec<Bytes> = Vec::new(&env);
            let mut start = 0;
            for i in 0..msg_bytes.len() {
                if msg_bytes.get(i).unwrap() == 10 {
                    // \n
                    lines_bytes.push_back(msg_bytes.slice(start..i));
                    start = i + 1;
                }
            }
            lines_bytes.push_back(msg_bytes.slice(start..msg_bytes.len()));

            if lines_bytes.len() != 5 {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // 0. Header
            if lines_bytes.get(0).unwrap() != Bytes::from_slice(&env, b"Stellar Signed Message") {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // 1. Network Passphrase
            // env.ledger().network_id() is the hash of the passphrase
            let passphrase_bytes = lines_bytes.get(1).unwrap();
            let passphrase_hash: [u8; 32] = env.crypto().sha256(&passphrase_bytes).into();
            let network_id: [u8; 32] = env.ledger().network_id().into();
            if passphrase_hash != network_id {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // 2. Signing Account
            let addr_str = member_address.to_string();
            let addr_len = addr_str.len();
            let mut addr_buf = [0u8; 128];
            addr_str.copy_into_slice(&mut addr_buf[..addr_len as usize]);
            let addr_bytes = Bytes::from_slice(&env, &addr_buf[..addr_len as usize]);

            if lines_bytes.get(2).unwrap() != addr_bytes {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // 3. Nonce (16-byte hex = 32 chars)
            if lines_bytes.get(3).unwrap().len() != 32 {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // 4. Payload
            let payload = lines_bytes.get(4).unwrap();
            let prefix = Bytes::from_slice(&env, b"tansu-bind|");
            if payload.len() < prefix.len() || payload.slice(0..prefix.len()) != prefix {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // Verify payload contains git identity
            // payload format: tansu-bind|<contractId>|<gitId>
            let mut parts: Vec<Bytes> = Vec::new(&env);
            let mut p_start = 0;
            for i in 0..payload.len() {
                if payload.get(i).unwrap() == 124 {
                    // |
                    parts.push_back(payload.slice(p_start..i));
                    p_start = i + 1;
                }
            }
            parts.push_back(payload.slice(p_start..payload.len()));

            if parts.len() != 3 {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            let git_id_len = git_id.len();
            let mut git_id_buf = [0u8; 128];
            git_id.copy_into_slice(&mut git_id_buf[..git_id_len as usize]);
            let git_id_bytes = Bytes::from_slice(&env, &git_id_buf[..git_id_len as usize]);

            if parts.get(2).unwrap() != git_id_bytes {
                panic_with_error!(&env, &errors::ContractErrors::InvalidEnvelope);
            }

            // Verify Ed25519 signature
            let pubkey_bytes = Tansu::decode_hex(&env, pubkey_hex);
            let sig_bytes = Tansu::decode_hex(&env, sig_hex);

            env.crypto().ed25519_verify(
                &pubkey_bytes
                    .try_into()
                    .map_err(|_| panic_with_error!(&env, &errors::ContractErrors::InvalidKey))
                    .unwrap(),
                &msg_bytes,
                &sig_bytes
                    .try_into()
                    .map_err(|_| panic_with_error!(&env, &errors::ContractErrors::InvalidSignature))
                    .unwrap(),
            );
        }

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
                git_identity,
                git_pubkey,
                msg,
                sig,
                signed_at: Some(env.ledger().timestamp()),
            };
            env.storage().persistent().set(&member_key_, &member);

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

impl Tansu {
    fn decode_hex(env: &Env, hex: String) -> Bytes {
        let hex_len = hex.len();
        let mut hex_buf = [0u8; 128];
        if hex_len > 128 {
            panic!("Hex string too long");
        }
        hex.copy_into_slice(&mut hex_buf[..hex_len as usize]);
        let hex_bytes = Bytes::from_slice(env, &hex_buf[..hex_len as usize]);

        if hex_bytes.len() % 2 != 0 {
            panic!("Invalid hex length");
        }
        let mut res = Bytes::new(env);
        for i in 0..(hex_bytes.len() / 2) {
            let hi = decode_hex_char(hex_bytes.get(i * 2).unwrap());
            let lo = decode_hex_char(hex_bytes.get(i * 2 + 1).unwrap());
            res.push_back(hi << 4 | lo);
        }
        res
    }
}

fn decode_hex_char(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        b'A'..=b'F' => c - b'A' + 10,
        _ => panic!("Invalid hex char"),
    }
}
