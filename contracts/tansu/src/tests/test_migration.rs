extern crate std;
use super::test_utils::create_test_data;
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
