#![no_std]

use soroban_sdk::contractmeta;
use soroban_sdk::{contract, panic_with_error, Address, Bytes, BytesN, Env, String, Vec};

mod domain_contract {
    soroban_sdk::contractimport!(
        file = "../domain_3ebbeec072f4996958d4318656186732773ab5f0c159dcf039be202b4ecb8af8.wasm"
    );
}

mod contract_dao;
mod contract_tansu;
mod contract_versioning;
mod errors;
mod test;
mod test_anonym_votes;
mod types;

contractmeta!(key = "Description", val = "Tansu - Soroban Versioning");

#[contract]
pub struct Tansu;

pub trait TansuTrait {
    fn __constructor(env: Env, admin: Address);

    fn upgrade(env: Env, hash: BytesN<32>);

    fn version() -> u32;
}

pub trait VersioningTrait {
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
    fn anonymous_voting_setup(env: Env, project_key: Bytes, public_key: String);

    fn get_anonymous_voting_config(env: Env, project_key: Bytes) -> types::AnonymousVoteConfig;

    fn build_commitments_from_votes(
        env: Env,
        project_key: Bytes,
        votes: Vec<u32>,
        seeds: Vec<u32>,
    ) -> Vec<BytesN<96>>;

    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
        public: bool,
    ) -> u32;

    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote);

    fn execute(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        proposal_id: u32,
        tallies: Option<Vec<u32>>,
        seeds: Option<Vec<u32>>,
    ) -> types::ProposalStatus;

    fn proof(
        env: Env,
        project_key: Bytes,
        proposal: types::Proposal,
        tallies: Vec<u32>,
        seeds: Vec<u32>,
    ) -> bool;

    fn get_dao(env: Env, project_key: Bytes, page: u32) -> types::Dao;

    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal;
}

fn auth_maintainers(env: &Env, maintainer: &Address, maintainers: &Vec<Address>) {
    maintainer.require_auth();
    if !maintainers.contains(maintainer) {
        panic_with_error!(&env, &errors::ContractErrors::UnregisteredMaintainer);
    }
}
