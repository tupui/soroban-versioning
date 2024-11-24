use crate::{errors, types, DaoTrait, Tansu, TansuClient};
use soroban_sdk::{contractimpl, panic_with_error, vec, Address, Bytes, Env, String, Vec};

#[contractimpl]
impl DaoTrait for Tansu {
    /// Create a proposal on the DAO of the project.
    /// Proposal initiators are automatically put in the abstain group.
    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
    ) -> u32 {
        let key_ = types::ProjectKey::Key(project_key.clone());
        if let Some(project) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
        {
            crate::auth_maintainers(&env, &proposer, &project.maintainers);

            let proposal_id = env
                .storage()
                .persistent()
                .get(&types::ProjectKey::DaoTotalProposals(project_key.clone()))
                .unwrap_or(0);

            let voters_abstain = vec![&env, proposer];
            let proposal = types::Proposal {
                id: proposal_id,
                title,
                ipfs,
                voting_ends_at,
                voters_approve: Vec::new(&env),
                voters_reject: Vec::new(&env),
                voters_abstain,
                nqg: 0,
                status: types::ProposalStatus::Active,
            };

            let next_id = proposal_id + 1;
            env.storage().persistent().set(
                &types::ProjectKey::DaoTotalProposals(project_key.clone()),
                &next_id,
            );

            let page = proposal_id.div_ceil(9);
            let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key.clone(), page);
            dao_page.proposals.push_back(proposal);

            env.storage().persistent().set(
                &types::ProjectKey::Dao(project_key.clone(), page),
                &dao_page,
            );

            proposal_id
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Cast a vote on a proposal.
    /// Double votes are not allowed.
    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote) {
        voter.require_auth();

        let page = proposal_id.div_ceil(9); // 10/10=1 but page 2 so 10-1
        let sub_id = proposal_id % 10;
        let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key.clone(), page);
        let mut proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        // only allow to vote once per voter
        if proposal.voters_approve.contains(&voter)
            | proposal.voters_reject.contains(&voter)
            | proposal.voters_abstain.contains(&voter)
        {
            panic_with_error!(&env, &errors::ContractErrors::AlreadyVoted);
        } else {
            match vote {
                types::Vote::Approve => proposal.voters_approve.push_back(voter),
                types::Vote::Reject => proposal.voters_reject.push_back(voter),
                types::Vote::Abstain => proposal.voters_abstain.push_back(voter),
            }

            dao_page.proposals.set(sub_id, proposal);

            env.storage()
                .persistent()
                .set(&types::ProjectKey::Dao(project_key, page), &dao_page)
        }
    }

    /// Get one page of proposal of the DAO.
    /// A page has 10 proposals.
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
                .unwrap_or(types::Dao {
                    proposals: Vec::new(&env),
                })
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Only return a single proposal
    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal {
        let page = proposal_id.div_ceil(9); // 10/10=1 but page 2 so 10-1
        let sub_id = proposal_id % 10;
        let dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key, page);
        let proposals = dao_page.proposals;
        match proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        }
    }
}
