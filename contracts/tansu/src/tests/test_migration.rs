extern crate std;
use super::test_utils::TestSetup;
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
    let names = seed_projects(&setup, &[name_str]);
    let name = names.get(0).unwrap();

    // Assert that the projects list is empty since the project was not added to the pagination list
    let err = client.try_get_projects(&0).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());

    // Run migration using name
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, name.clone()]);

    // Assert that the first page has been updated and now contains 1 project.
    let projects = client.get_projects(&0);
    assert_eq!(projects.len(), 1);
    assert_eq!(projects.get(0).unwrap().name, name);
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
fn test_add_projects_to_pagination_multi_page_allows() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    // Seed projects until we fill the first page and start the second
    // The max projects per page is MAX_PROJECTS_PER_PAGE, so we seed MAX_PROJECTS_PER_PAGE + 1 projects
    let name_strs = [
        "tansua", "tansub", "tansuc", "tansud", "tansue", "tansuf", "tansug", "tansuh", "tansui",
        "tansuj", "tansuk",
    ];

    let names = seed_projects(&setup, &name_strs);

    // Verify Page 0 doesn't exist yet
    let err = client.try_get_projects(&0).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());

    // Run migration for these projects
    client.add_projects_to_pagination(&setup.contract_admin, &names);

    // Verify we have MAX_PROJECTS_PER_PAGE + 1 projects in total
    // Page 0 should have MAX_PROJECTS_PER_PAGE, Page 1 should have 1
    let page_0_projects = client.get_projects(&0);
    assert_eq!(page_0_projects.len(), MAX_PROJECTS_PER_PAGE);
    for i in 0..MAX_PROJECTS_PER_PAGE {
        assert_eq!(
            page_0_projects.get(i).unwrap().name,
            String::from_str(env, name_strs[i as usize])
        );
    }

    let page_1_projects = client.get_projects(&1);
    assert_eq!(page_1_projects.len(), 1);
    assert_eq!(
        page_1_projects.get(0).unwrap().name,
        String::from_str(env, "tansuk")
    );

    // NOTE: This is one off run, so if the migration is run multiple times, the last page will have duplicates.
    // Try to migrate AGAIN "tansua" which is on Page 0
    let project_0_name = names.get(0).unwrap();
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, project_0_name.clone()]);

    // Verify that "tansua" WAS added again to the current last page (Page 1)
    // Total projects should now be MAX_PROJECTS_PER_PAGE + 2
    let page_0_projects = client.get_projects(&0);
    assert_eq!(page_0_projects.len(), MAX_PROJECTS_PER_PAGE);
    for i in 0..MAX_PROJECTS_PER_PAGE {
        assert_eq!(
            page_0_projects.get(i).unwrap().name,
            String::from_str(env, name_strs[i as usize])
        );
    }

    let page_1_projects = client.get_projects(&1);
    assert_eq!(page_1_projects.len(), 2);
    assert_eq!(
        page_1_projects.get(0).unwrap().name,
        String::from_str(env, "tansuk")
    );
    assert_eq!(
        page_1_projects.get(1).unwrap().name,
        String::from_str(env, "tansua")
    );
}

#[test]
fn test_add_projects_to_pagination_duplication_allows() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    // Seed a project
    let name_strs = ["tansua"];

    let names = seed_projects(&setup, &name_strs);

    // Verify Page 0 doesn't exist yet
    let err = client.try_get_projects(&0).unwrap_err().unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());

    // Run migration for these projects
    client.add_projects_to_pagination(&setup.contract_admin, &names);

    // Verify we have 1 project in total
    // Page 0 should have 1 project
    let page_0_projects = client.get_projects(&0);
    assert_eq!(page_0_projects.len(), 1);
    assert_eq!(
        page_0_projects.get(0).unwrap().name,
        String::from_str(env, name_strs[0])
    );

    // NOTE: This is one off run, so if the migration is run multiple times, the last page will have duplicates.
    // Try to migrate AGAIN "tansua" which is on Page 0
    let project_0_name = names.get(0).unwrap();
    client.add_projects_to_pagination(&setup.contract_admin, &vec![env, project_0_name.clone()]);

    // Verify that "tansua" WAS added again to the current last page (Page 1)
    // Total projects should now be 2
    let page_0_projects = client.get_projects(&0);
    assert_eq!(page_0_projects.len(), 2);
    assert_eq!(
        page_0_projects.get(0).unwrap().name,
        String::from_str(env, name_strs[0])
    );
    assert_eq!(
        page_0_projects.get(1).unwrap().name,
        String::from_str(env, name_strs[0])
    );
}

fn seed_projects(setup: &TestSetup, name_strs: &[&str]) -> soroban_sdk::Vec<soroban_sdk::String> {
    let env = &setup.env;
    let mut names = soroban_sdk::Vec::new(env);
    for name_str in name_strs {
        let name = String::from_str(env, name_str);
        names.push_back(name.clone());

        let name_bytes = Bytes::from_slice(env, name_str.as_bytes());
        let key_bytes: Bytes = env.crypto().keccak256(&name_bytes).into();
        let key = ProjectKey::Key(key_bytes.clone());

        let project = Project {
            name: name.clone(),
            config: Config {
                url: String::from_str(env, "url"),
                ipfs: String::from_str(env, "ipfs"),
            },
            maintainers: vec![env, setup.grogu.clone()],
        };

        env.as_contract(&setup.contract_id, || {
            env.storage().persistent().set(&key, &project);
        });
    }
    names
}
