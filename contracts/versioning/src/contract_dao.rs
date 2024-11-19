use soroban_sdk::{Env, String};

use crate::{types, DaoTrait, Tansu, TansuClient};

impl DaoTrait for Tansu {
    fn create_proposal(env: Env, title: String, description: String, duration: u64) -> u32 {
        1
    }

    fn vote(env: Env, proposal_id: u32, vote: bool) {}

    fn get_proposal(env: Env, proposal_id: u32) -> types::Proposal {}
}
