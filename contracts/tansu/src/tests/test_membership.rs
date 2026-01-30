use super::test_utils::{create_test_data, init_contract};
use crate::errors::ContractErrors;
use crate::types::{Badge, ProjectBadges};
use soroban_sdk::testutils::{Address as _, Events};
use soroban_sdk::{Address, IntoVal, Map, String, Symbol, Val, vec};

#[test]
fn membership_badges() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup
        .contract
        .add_member(&member, &meta, &None, &None, &None, &None, &None, &None);

    // Verify member added event
    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "member_added"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [(
                        Symbol::new(&setup.env, "member_address"),
                        member.clone().into_val(&setup.env)
                    ),],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &badges);

    // Verify badges updated event
    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "badges_updated"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "project_key"),
                            id.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "maintainer"),
                            setup.mando.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "member"),
                            member.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "badges_count"),
                            1u32.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    let info = setup.contract.get_member(&member);
    assert_eq!(
        info.projects,
        vec![
            &setup.env,
            ProjectBadges {
                project: id.clone(),
                badges: badges.clone()
            }
        ]
    );

    let project_badges = setup.contract.get_badges(&id);
    assert_eq!(project_badges.community, vec![&setup.env, member.clone()]);

    let weight = setup.contract.get_max_weight(&id, &member);
    assert_eq!(weight, Badge::Community as u32);

    // remove badge by giving empty vector
    let empty = vec![&setup.env];
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &empty);
    let project_badges = setup.contract.get_badges(&id);
    assert!(project_badges.community.is_empty());

    let info = setup.contract.get_member(&member);
    assert_eq!(
        info.projects,
        vec![
            &setup.env,
            ProjectBadges {
                project: id.clone(),
                badges: empty
            }
        ]
    );
}

#[test]
fn membership_double_set_badges() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup
        .contract
        .add_member(&member, &meta, &None, &None, &None, &None, &None, &None);

    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &badges);

    // Try to set the same badge again
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &badges);

    // Verify that the badge was not added multiple times
    let project_badges = setup.contract.get_badges(&id);
    assert_eq!(project_badges.community, vec![&setup.env, member.clone()]);
    assert_eq!(project_badges.community.len(), 1);

    let info = setup.contract.get_member(&member);
    assert_eq!(
        info.projects,
        vec![
            &setup.env,
            ProjectBadges {
                project: id.clone(),
                badges: badges.clone()
            }
        ]
    );
}

#[test]
fn membership_multiple_different_badges() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup
        .contract
        .add_member(&member, &meta, &None, &None, &None, &None, &None, &None);

    // Set both Community and Triage badges in a single call
    let both_badges = vec![&setup.env, Badge::Community, Badge::Triage];
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &both_badges);

    // Verify get_badges shows member in both categories
    let project_badges = setup.contract.get_badges(&id);
    assert_eq!(project_badges.community, vec![&setup.env, member.clone()]);
    assert_eq!(project_badges.triage, vec![&setup.env, member.clone()]);

    // CRITICAL: Verify get_member shows ALL badges for the member
    let member_info = setup.contract.get_member(&member);
    let expected_badges = vec![&setup.env, Badge::Community, Badge::Triage];
    assert_eq!(
        member_info.projects,
        vec![
            &setup.env,
            ProjectBadges {
                project: id.clone(),
                badges: expected_badges
            }
        ]
    );

    // Verify weight calculation includes both badges
    let weight = setup.contract.get_max_weight(&id, &member);
    assert_eq!(weight, (Badge::Community as u32) + (Badge::Triage as u32));

    // TEST BADGE REMOVAL: Remove Community badge, keep Triage
    let triage_only_badges = vec![&setup.env, Badge::Triage];
    setup
        .contract
        .set_badges(&setup.mando, &id, &member, &triage_only_badges);

    // Verify get_badges shows member only in Triage category
    let project_badges_after_removal = setup.contract.get_badges(&id);
    assert_eq!(project_badges_after_removal.community, vec![&setup.env]);
    assert_eq!(
        project_badges_after_removal.triage,
        vec![&setup.env, member.clone()]
    );

    // Verify get_member shows only Triage badge
    let member_info_after_removal = setup.contract.get_member(&member);
    let expected_badges_after_removal = vec![&setup.env, Badge::Triage];
    assert_eq!(
        member_info_after_removal.projects,
        vec![
            &setup.env,
            ProjectBadges {
                project: id.clone(),
                badges: expected_badges_after_removal
            }
        ]
    );

    // Verify weight calculation includes only Triage badge
    let weight_after_removal = setup.contract.get_max_weight(&id, &member);
    assert_eq!(weight_after_removal, Badge::Triage as u32);
}

#[test]
fn membership_errors() {
    let setup = create_test_data();

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup
        .contract
        .add_member(&member, &meta, &None, &None, &None, &None, &None, &None);

    // Adding the same twice
    let error = setup
        .contract
        .try_add_member(&member, &meta, &None, &None, &None, &None, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::MemberAlreadyExist.into());

    // Unknown
    let not_member = Address::generate(&setup.env);
    let error = setup
        .contract
        .try_get_member(&not_member)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::UnknownMember.into());
}
