#![no_std]

use soroban_sdk::contractmeta;
use soroban_sdk::{contract, panic_with_error, Address, Bytes, BytesN, Env, String, Vec};

mod domain_contract {
    soroban_sdk::contractimport!(
        file = "../domain_3ebbeec072f4996958d4318656186732773ab5f0c159dcf039be202b4ecb8af8.wasm"
    );
}

mod contract_dao;
mod contract_versioning;
mod errors;
mod test;
mod types;

contractmeta!(key = "Description", val = "Tansu - Soroban Versioning");

#[contract]
pub struct Tansu;

pub trait VersioningTrait {
    fn init(env: Env, admin: Address);

    fn upgrade(env: Env, hash: BytesN<32>);

    fn version() -> u32;

    fn register(
        env: Env,
        maintainer: Address,
        name: String,
        maintainers: Vec<Address>,
        url: String,
        hash: String,
        domain_contract_id: Address,
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
    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
    ) -> u32;

    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote);

    fn get_dao(env: Env, project_key: Bytes, page: u32) -> types::Dao;

    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal;
}

fn auth_maintainers(env: &Env, maintainer: &Address, maintainers: &Vec<Address>) {
    maintainer.require_auth();
    if !maintainers.contains(maintainer) {
        panic_with_error!(&env, &errors::ContractErrors::UnregisteredMaintainer);
    }
}
