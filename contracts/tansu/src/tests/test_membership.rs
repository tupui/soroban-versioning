use super::test_utils::{create_test_data, init_contract};
use crate::types::{Badge, ProjectBadges};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, String, vec};

#[test]
fn membership_badges() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup.contract.add_member(&member, &meta);

    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .add_badges(&setup.mando, &id, &member, &badges);

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
        .add_badges(&setup.mando, &id, &member, &empty);
    let project_badges = setup.contract.get_badges(&id);
    assert!(project_badges.community.is_empty());
}

#[test]
fn membership_double_add_badges() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup.contract.add_member(&member, &meta);

    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .add_badges(&setup.mando, &id, &member, &badges);

    // Try to add the same badge again
    setup
        .contract
        .add_badges(&setup.mando, &id, &member, &badges);

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
