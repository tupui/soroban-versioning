use soroban_sdk::{Env, String};

use crate::{types, DaoTrait, Tansu, TansuClient};

impl DaoTrait for Tansu {
    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
    ) -> u32 {
        1
    }

    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: bool) {}

    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal {}
}
