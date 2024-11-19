use soroban_sdk::{contractimpl, panic_with_error, Address, Bytes, Env, String};

use crate::{errors, types, DaoTrait, Tansu, TansuClient};

#[contractimpl]
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

    fn get_dao(env: Env, project_key: Bytes, page: u32) -> types::Dao {
        let key_ = types::ProjectKey::Key(project_key.clone());
        if env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
            .is_some()
        {
            env.storage()
                .persistent()
                .get(&types::ProjectKey::Dao(project_key, page))
                .unwrap_or_else(|| {
                    panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound);
                })
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal {
        let page = proposal_id / 10; // round down
        let sub_id = proposal_id % 10;
        let dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key, page);
        let proposals = dao_page.proposals.unwrap_or_else(|| {
            panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound);
        });
        match proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        }
    }
}
