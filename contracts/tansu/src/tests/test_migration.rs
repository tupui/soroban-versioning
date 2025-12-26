extern crate std;
use super::test_utils::create_test_data;
use crate::contract_migration::MAX_PROJECTS_PER_PAGE;
use crate::errors::ContractErrors;
use crate::types::{Config, Project, ProjectKey};
use soroban_sdk::{Bytes, String, vec};

#[test]
fn test_add_projects_to_pagination_previously_registered_project() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    // Manually seed a project into storage without adding it to the project keys list
    let name_str = "registered";
    let name = String::from_str(env, name_str);
    let name_bytes = Bytes::from_slice(env, name_str.as_bytes());
    let key_bytes: Bytes = env.crypto().keccak256(&name_bytes).into();
    let key = ProjectKey::Key(key_bytes.clone());

    let project = Project {
        name: name.clone(),
        config: Config {
            url: String::from_str(env, "example.com"),
            ipfs: String::from_str(env, "ipfs_hash"),
        },
        maintainers: vec![env, setup.grogu.clone()],
    };

    env.as_contract(&setup.contract_id, || {
        env.storage().persistent().set(&key, &project);
    });

    // Assert that the projects list is empty since the project was not added to the pagination list
    let err = client.try_get_projects(&0).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());

    // Run migration using name
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, name.clone()]);

    // Assert that the first page has been updated and now contains 1 project.
    let projects = client.get_projects(&0);
    assert_eq!(projects.len(), 1);
    assert_eq!(projects.get(0).unwrap().name, name);

    // Assert that duplicate migration does nothing
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, name.clone()]);
    let projects = client.get_projects(&0);
    assert_eq!(projects.len(), 1);
}

#[test]
fn test_add_projects_to_pagination_unregistered_project() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    let names = vec![env, String::from_str(env, "unregistered")];

    // Run migration for a name that was never registered or seeded
    client.add_projects_to_pagination(&setup.contract_admin, &names);

    // Assert that the projects list is empty
    let err = client.try_get_projects(&0).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());
}

#[test]
fn test_add_projects_to_pagination_paused_error() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    let names = vec![env, String::from_str(env, "unregistered")];

    // Pause the contract
    client.pause(&setup.contract_admin, &true);

    // Try to migrate while paused
    let err = client
        .try_add_projects_to_pagination(&setup.contract_admin, &names)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ContractPaused.into());
}

#[test]
fn test_add_projects_to_pagination_unauthorized_admin_error() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    let names = vec![env, String::from_str(env, "unregistered")];

    // Try to migrate as non-admin
    let err = client
        .try_add_projects_to_pagination(&setup.grogu, &names)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());
}

#[test]
fn test_add_projects_to_pagination_multi_page_no_duplicates() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    // Mint tokens for grogu to register projects
    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.grogu, &genesis_amount);

    // Register projects until we fill the first page and start the second
    // The max projects per page is MAX_PROJECTS_PER_PAGE, so we register MAX_PROJECTS_PER_PAGE + 1 projects
    let name_strs = [
        "tansua", "tansub", "tansuc", "tansud", "tansue", "tansuf", "tansug", "tansuh", "tansui",
        "tansuj", "tansuk",
    ];

    let mut names = std::vec::Vec::new();
    for name_str in name_strs {
        let name = String::from_str(env, name_str);
        names.push(name.clone());
        client.register(
            &setup.grogu,
            &name,
            &vec![env, setup.grogu.clone()],
            &String::from_str(env, "url"),
            &String::from_str(env, "ipfs"),
        );
    }

    // Verify we have MAX_PROJECTS_PER_PAGE + 1 projects in total
    // Page 0 should have MAX_PROJECTS_PER_PAGE, Page 1 should have 1
    assert_eq!(client.get_projects(&0).len(), MAX_PROJECTS_PER_PAGE);
    assert_eq!(client.get_projects(&1).len(), 1);

    // Try to migrate "tansua" which is on Page 0
    let project_0_name = names.get(0).unwrap().clone();
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, project_0_name]);

    // Verify that "tansua" was NOT added again
    // Total projects should still be MAX_PROJECTS_PER_PAGE + 1
    assert_eq!(client.get_projects(&0).len(), MAX_PROJECTS_PER_PAGE);
    assert_eq!(client.get_projects(&1).len(), 1);

    // Page 1 should still only have 1 project (tansuk)
    let page_1_projects = client.get_projects(&1);
    assert_eq!(page_1_projects.len(), 1);
    assert_eq!(
        page_1_projects.get(0).unwrap().name,
        String::from_str(env, "tansuk")
    );

    // Try to migrate "tansuk" which is on Page 1
    let project_11_name = names.get(MAX_PROJECTS_PER_PAGE as usize).unwrap().clone();
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, project_11_name]);

    // Verify that "tansuk" was NOT added again
    // Total projects should still be MAX_PROJECTS_PER_PAGE + 1
    assert_eq!(client.get_projects(&0).len(), MAX_PROJECTS_PER_PAGE);
    assert_eq!(client.get_projects(&1).len(), 1);

    // Page 1 should still only have 1 project (tansuk)
    let page_1_projects = client.get_projects(&1);
    assert_eq!(page_1_projects.len(), 1);
    assert_eq!(
        page_1_projects.get(0).unwrap().name,
        String::from_str(env, "tansuk")
    );
}

#[test]
fn test_migration_creates_new_page_when_full() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    // Mint tokens for grogu to register the tansu projects
    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(&setup.grogu, &genesis_amount);

    // Register projects until we fill the first page
    // The max projects per page is MAX_PROJECTS_PER_PAGE
    let name_strs = [
        "tansua", "tansub", "tansuc", "tansud", "tansue", "tansuf", "tansug", "tansuh", "tansui",
        "tansuj",
    ];

    // Fill Page 0 exactly using registration (MAX_PROJECTS_PER_PAGE projects)
    for name_str in name_strs {
        let name = String::from_str(env, name_str);
        client.register(
            &setup.grogu,
            &name,
            &vec![env, setup.grogu.clone()],
            &String::from_str(env, "url"),
            &String::from_str(env, "ipfs"),
        );
    }

    // Verify Page 0 is full and total_projects is MAX_PROJECTS_PER_PAGE
    assert_eq!(client.get_projects(&0).len(), MAX_PROJECTS_PER_PAGE);
    // Verify Page 1 doesn't exist yet
    let err = client.try_get_projects(&1).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());

    // Manually seed an (MAX_PROJECTS_PER_PAGE + 1)th project (not in pagination)
    let migrate_name_str = "migrateme";
    let migrate_name = String::from_str(env, migrate_name_str);
    let name_bytes = Bytes::from_slice(env, migrate_name_str.as_bytes());
    let key_bytes: Bytes = env.crypto().keccak256(&name_bytes).into();

    let project = Project {
        name: migrate_name.clone(),
        config: Config {
            url: String::from_str(env, "example.com"),
            ipfs: String::from_str(env, "ipfs_hash"),
        },
        maintainers: vec![env, setup.grogu.clone()],
    };

    env.as_contract(&setup.contract_id, || {
        env.storage()
            .persistent()
            .set(&ProjectKey::Key(key_bytes), &project);
    });

    // Run migration for this project
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, migrate_name.clone()]);

    // Verify that Page 1 was created and contains the migrated project
    let page_1 = client.get_projects(&1);
    assert_eq!(page_1.len(), 1);
    assert_eq!(page_1.get(0).unwrap().name, migrate_name);

    // Page 0 should still have MAX_PROJECTS_PER_PAGE
    assert_eq!(client.get_projects(&0).len(), MAX_PROJECTS_PER_PAGE);
}
