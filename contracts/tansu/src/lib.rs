#![no_std]

use soroban_sdk::{Address, Bytes, BytesN, Env, String, Vec, contract, panic_with_error};
use soroban_sdk::{Executable, contractmeta};

mod domain_contract {
    soroban_sdk::contractimport!(file = "../domain_current.wasm");
}

mod contract_dao;
mod contract_membership;
mod contract_tansu;
mod contract_versioning;
mod errors;
mod events;
#[cfg(test)]
mod tests;
mod types;

contractmeta!(key = "Description", val = "Tansu - Soroban Versioning");

#[contract]
pub struct Tansu;

pub trait TansuTrait {
    fn __constructor(env: Env, admin: Address);

    fn pause(env: Env, admin: Address, paused: bool);

    fn require_not_paused(env: Env);

    fn get_admins_config(env: Env) -> types::AdminsConfig;

    fn set_domain_contract(env: Env, admin: Address, domain_contract: types::Contract);

    fn set_collateral_contract(env: Env, admin: Address, collateral_contract: types::Contract);

    fn propose_upgrade(
        env: Env,
        caller: Address,
        new_wasm_hash: BytesN<32>,
        new_admins_config: Option<types::AdminsConfig>,
    );

    fn approve_upgrade(env: Env, signer: Address);

    fn finalize_upgrade(env: Env, executor: Address, accept: bool);

    fn get_upgrade_proposal(env: Env) -> types::UpgradeProposal;

    fn version() -> u32;
}

pub trait MembershipTrait {
    fn add_member(env: Env, member_address: Address, meta: String);

    fn get_member(env: Env, member_address: Address) -> types::Member;

    fn set_badges(
        env: Env,
        maintainer: Address,
        key: Bytes,
        member: Address,
        badges: Vec<types::Badge>,
    );

    fn get_badges(env: Env, key: Bytes) -> types::Badges;

    fn get_max_weight(env: Env, key: Bytes, member_address: Address) -> u32;
}

pub trait VersioningTrait {
    fn register(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        url: String,
        ipfs: String,
    ) -> Bytes;

    fn update_config(
        env: Env,
        maintainer: Address,
        key: Bytes,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
    );

    fn commit(env: Env, maintainer: Address, project_key: Bytes, hash: String);

    fn get_commit(env: Env, project_key: Bytes) -> String;

    fn get_project(env: Env, project_key: Bytes) -> types::Project;
}

pub trait DaoTrait {
    fn anonymous_voting_setup(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        public_key: String,
    );

    fn get_anonymous_voting_config(env: Env, project_key: Bytes) -> types::AnonymousVoteConfig;

    fn build_commitments_from_votes(
        env: Env,
        project_key: Bytes,
        votes: Vec<u128>,
        seeds: Vec<u128>,
    ) -> Vec<BytesN<96>>;

    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
        public_voting: bool,
    ) -> u32;

    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote);

    fn revoke_proposal(env: Env, maintainer: Address, project_key: Bytes, proposal_id: u32);

    fn execute(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        proposal_id: u32,
        tallies: Option<Vec<u128>>,
        seeds: Option<Vec<u128>>,
    ) -> types::ProposalStatus;

    fn proof(
        env: Env,
        project_key: Bytes,
        proposal: types::Proposal,
        tallies: Vec<u128>,
        seeds: Vec<u128>,
    ) -> bool;

    fn get_dao(env: Env, project_key: Bytes, page: u32) -> types::Dao;

    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal;
}

fn auth_maintainers(env: &Env, maintainer: &Address, project_key: &Bytes) -> types::Project {
    maintainer.require_auth();
    let project_key_ = types::ProjectKey::Key(project_key.clone());
    if let Some(project) = env
        .storage()
        .persistent()
        .get::<types::ProjectKey, types::Project>(&project_key_)
    {
        if !project.maintainers.contains(maintainer) {
            panic_with_error!(&env, &errors::ContractErrors::UnauthorizedSigner);
        }
        project
    } else {
        panic_with_error!(&env, &errors::ContractErrors::InvalidKey)
    }
}

/// Retrieve a contract address and WASM hash.
///
/// # Arguments
/// * `env` - The environment object
/// * `key` - The contract key
///
/// # Returns
/// * `types::Contract` - The contract object
///
/// # Panics
/// * If the contract cannot be found
/// * If the WASM hash of the contract does not match on-chain data
fn retrieve_contract(env: &Env, key: types::ContractKey) -> types::Contract {
    let retrieved_contract: types::Contract = env.storage().instance().get(&key).unwrap();
    validate_contract(env, &retrieved_contract);
    retrieved_contract
}

/// Validate the contract WASM hash match on-chain data.
///
/// # Arguments
/// * `env` - The environment object
/// * `contract` - The contract to validate
///
/// # Panics
/// * If the WASM hash of the contract does not match on-chain data
fn validate_contract(env: &Env, contract: &types::Contract) {
    let contract_executable = contract.address.executable();

    if let Some(wasm_hash) = contract.clone().wasm_hash {
        if contract_executable != Some(Executable::Wasm(wasm_hash)) {
            panic_with_error!(&env, &errors::ContractErrors::ContractValidation)
        }
    }
}
