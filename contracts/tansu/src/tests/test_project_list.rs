#![cfg(test)]
extern crate std;

use super::test_utils::create_test_data;
use crate::{errors::ContractErrors, types::Project};
use soroban_sdk::{Env, String, vec};

#[test]
fn test_project_listing() {
    let setup = create_test_data();
    let client = &setup.contract;
    let env = &setup.env;

    let items_per_page = 10;
    let maintainer = &setup.grogu;
    let maintainers = vec![env, maintainer.clone()];
    let url_prefix = String::from_str(env, "github.com/tansu-");
    let ipfs_prefix = String::from_str(env, "2ef4f49fdd8fa9dc463f1f06a094c26b8871");

    // Let's mint some tokens to register the domain projects
    let genesis_amount: i128 = 1_000_000_000 * 10_000_000;
    setup.token_stellar.mint(maintainer, &genesis_amount);

    // Register multiple projects (items_per_page projects per page) so we can test pagination
    for i in 0u32..items_per_page + 3 {
        let suffix = convert_number_to_letter(i);

        let name_str = std::format!("tansu{}", suffix);
        let name = String::from_str(env, &name_str);

        let url_str = std::format!("{}{}", url_prefix, suffix);
        let url = String::from_str(env, &url_str);

        let ipfs_str = std::format!("{}{}", ipfs_prefix, i);
        let ipfs = String::from_str(env, &ipfs_str);

        client.register(maintainer, &name, &maintainers, &url, &ipfs);
    }

    // Check first page (should have items_per_page projects)
    let page_0 = client.get_projects(&0);
    assert_eq!(page_0.len(), items_per_page);
    for i in 0u32..items_per_page {
        assert_project(env, &page_0.get(i).unwrap(), i);
    }

    // Check second page (should have 3 projects)
    let page_1 = client.get_projects(&1);
    assert_eq!(page_1.len(), 3);
    for i in 0u32..page_1.len() {
        assert_project(env, &page_1.get(i).unwrap(), i + items_per_page);
    }

    // Check empty page
    let page_2 = client.get_projects(&2);
    assert_eq!(page_2.len(), 0);
}

#[test]
fn test_project_listing_with_page_size_larger_than_storage_limit_error() {
    let setup = create_test_data();

    // Page size larger than storage limit should panic with NoProjectPageFound error
    let max_page_size = 1000;
    let err = setup
        .contract
        .try_get_projects(&(&max_page_size + 1))
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::NoProjectPageFound.into());
}

fn assert_project(env: &Env, project: &Project, i: u32) {
    let suffix = convert_number_to_letter(i);

    let name_str = std::format!("tansu{}", suffix);
    assert_eq!(project.name, String::from_str(env, &name_str));

    let url_prefix = "github.com/tansu-";
    let url_str = std::format!("{}{}", url_prefix, suffix);
    assert_eq!(project.config.url, String::from_str(env, &url_str));

    let ipfs_prefix = "2ef4f49fdd8fa9dc463f1f06a094c26b8871";
    let ipfs_str = std::format!("{}{}", ipfs_prefix, i);
    assert_eq!(project.config.ipfs, String::from_str(env, &ipfs_str));
}

fn convert_number_to_letter(i: u32) -> std::string::String {
    let suffix: std::string::String = std::format!("{}", i)
        .chars()
        .map(|c| (c as u8 - 48 + 97) as char)
        .collect();
    suffix
}
