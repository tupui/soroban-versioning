use soroban_sdk::{Address, Bytes, Env, IntoVal, String, Vec, contractimpl, panic_with_error};

use crate::{MembershipTrait, Tansu, TansuArgs, TansuClient, errors, types};

#[contractimpl]
impl MembershipTrait for Tansu {
    fn add_member(env: Env, member_address: Address, meta: String) {
        member_address.require_auth();

        let member_key_ = types::DataKey::Member(member_address.clone());
        if env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
        {
            panic_with_error!(&env, &errors::ContractErrors::MemberAlreadyExist)
        } else {
            let member = types::Member {
                projects: Vec::new(&env),
                meta,
            };
            env.storage().persistent().set(&member_key_, &member);
        };
    }

    fn get_member(env: Env, member_address: Address) -> types::Member {
        let member_key_ = types::DataKey::Member(member_address.clone());
        env.storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::UnknownMember);
            })
    }

    fn add_badges(
        env: Env,
        maintainer: Address,
        key: Bytes,
        member: Address,
        badges: Vec<types::Badge>,
    ) {
        let project_key_ = types::ProjectKey::Key(key.clone());
        let project = if let Some(mut project) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&project_key_)
        {
            crate::auth_maintainers(&env, &maintainer, &project.maintainers);
            project
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey)
        };

        let member_key_ = types::DataKey::Member(member.clone());
        let mut member_ = if let Some(mut member_) = env
            .storage()
            .persistent()
            .get::<types::DataKey, types::Member>(&member_key_)
        {
            member_
        } else {
            panic_with_error!(&env, &errors::ContractErrors::UnknownMember)
        };

        'member_projects_badges: {
            for mut member_project_ in member_.projects.iter() {
                if member_project_.project == key {
                    for badge_ in badges.iter() {
                        if !member_project_.badges.contains(badge_.clone()) {
                            member_project_.badges.push_back(badge_);
                        }
                    }
                    break 'member_projects_badges;
                }
            }
            let project_badges = types::ProjectBadges {
                project: key.clone(),
                badges,
            };
            member_.projects.push_back(project_badges);
        }

        let badges_key_ = types::ProjectKey::Badges(key);
        let mut badges_ = if let Some(mut badges_) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Badges>(&badges_key_)
        {
            badges_
        } else {
            types::Badges {
                maintainer: Vec::new(&env),
                triage: Vec::new(&env),
                community: Vec::new(&env),
                verified: Vec::new(&env),
                default: Vec::new(&env),
            }
        };

        for badge in badges.iter() {
            match badge {
                types::Badge::Maintainer => badges_.maintainer.push_back(member.clone()),
                types::Badge::Triage => badges_.triage.push_back(member.clone()),
                types::Badge::Community => badges_.community.push_back(member.clone()),
                _ => (),
            };
        }

        env.storage().persistent().set(&project_key_, &project);
        env.storage().persistent().set(&badges_key_, &badges_);
        env.storage().persistent().set(&member_key_, &member_);
    }
}
