use crate::{errors, types, DaoTrait, Tansu, TansuArgs, TansuClient};
use soroban_sdk::{contractimpl, panic_with_error, vec, Address, Bytes, Env, String, Vec};

const MAX_TITLE_LENGTH: u32 = 256;
const MAX_PROPOSALS_PER_PAGE: u32 = 9;
const MAX_PAGES: u32 = 1000;
const MIN_VOTING_PERIOD: u64 = 24 * 3600; // 1 day in seconds
const MAX_VOTING_PERIOD: u64 = 30 * 24 * 3600; // 30 days in seconds

#[contractimpl]
impl DaoTrait for Tansu {
    /// Create a proposal on the DAO of the project.
    /// Proposal initiators are automatically put in the abstain group.
    /// # Arguments
    /// * `env` - The environment object
    /// * `proposer` - Address of the proposal creator
    /// * `project_key` - Unique identifier for the project
    /// * `title` - Title of the proposal
    /// * `ipfs` - IPFS content identifier describing the proposal
    /// * `voting_ends_at` - UNIX timestamp when voting ends
    /// # Returns
    /// * `u32` - The ID of the created proposal
    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
    ) -> u32 {
        // Some input validations
        let curr_timestamp = env.ledger().timestamp();
        let min_voting_timestamp = curr_timestamp + MIN_VOTING_PERIOD;
        let max_voting_timestamp = curr_timestamp + MAX_VOTING_PERIOD;
        let ipfs_len = ipfs.len();
        let title_len = title.len();

        if !((min_voting_timestamp..=max_voting_timestamp).contains(&voting_ends_at)
            && (10..=MAX_TITLE_LENGTH).contains(&title_len)
            && (32..=64).contains(&ipfs_len))
        {
            panic_with_error!(&env, &errors::ContractErrors::ProposalInputValidation);
        }

        // proposers can only be maintainers of existing projects
        let project_key_ = project_key.clone();
        let key_ = types::ProjectKey::Key(project_key_.clone());
        if let Some(project) = env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
        {
            crate::auth_maintainers(&env, &proposer, &project.maintainers);

            let proposal_id = env
                .storage()
                .persistent()
                .get(&types::ProjectKey::DaoTotalProposals(project_key_.clone()))
                .unwrap_or(0);

            // proposer is automatically in the abstain group
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
                &types::ProjectKey::DaoTotalProposals(project_key_.clone()),
                &next_id,
            );

            let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
            let mut dao_page =
                <Tansu as DaoTrait>::get_dao(env.clone(), project_key_.clone(), page);
            dao_page.proposals.push_back(proposal);

            env.storage().persistent().set(
                &types::ProjectKey::Dao(project_key_.clone(), page),
                &dao_page,
            );

            // probably publish an event
            // env.events()
            //     .publish((symbol_short!("proposal"), project_key_.clone()), title);

            proposal_id
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Cast a vote on a proposal.
    /// Double votes are not allowed.
    /// # Arguments
    /// * `env` - The environment object
    /// * `voter` - Address of the voter
    /// * `project_key` - Unique identifier for the project
    /// * `proposal_id` - ID of the proposal
    /// * `vote` - Approve, reject or abstain decision
    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote) {
        voter.require_auth();

        let project_key_ = project_key.clone();
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key_.clone(), page);
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
            // Record the vote
            match vote {
                types::Vote::Approve => proposal.voters_approve.push_back(voter),
                types::Vote::Reject => proposal.voters_reject.push_back(voter),
                types::Vote::Abstain => proposal.voters_abstain.push_back(voter),
            }

            dao_page.proposals.set(sub_id, proposal);

            env.storage()
                .persistent()
                .set(&types::ProjectKey::Dao(project_key_, page), &dao_page)
        }
    }

    /// Get one page of proposal of the DAO.
    /// A page has 0 to MAX_PROPOSALS_PER_PAGE proposals.
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - Unique identifier for the project
    /// * `page` - Page of proposals
    /// # Returns
    /// * `types::Dao` - The Dao object (vector of proposals)
    fn get_dao(env: Env, project_key: Bytes, page: u32) -> types::Dao {
        if page >= MAX_PAGES {
            panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound);
        }

        let project_key_ = project_key.clone();
        let key_ = types::ProjectKey::Key(project_key_.clone());
        if env
            .storage()
            .persistent()
            .get::<types::ProjectKey, types::Project>(&key_)
            .is_some()
        {
            env.storage()
                .persistent()
                .get(&types::ProjectKey::Dao(project_key_, page))
                .unwrap_or(types::Dao {
                    proposals: Vec::new(&env),
                })
        } else {
            panic_with_error!(&env, &errors::ContractErrors::InvalidKey);
        }
    }

    /// Only return a single proposal
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - Unique identifier for the project
    /// * `proposal_id` - ID of the proposal
    /// # Returns
    /// * `types::Proposal` - The proposal object
    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal {
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key, page);
        let proposals = dao_page.proposals;
        match proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        }
    }
}
