use crate::{errors, types, DaoTrait, Tansu, TansuArgs, TansuClient};
use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contractimpl, panic_with_error, vec, Address, Bytes, Env, String, Vec};

const MAX_TITLE_LENGTH: u32 = 256;
const MAX_PROPOSALS_PER_PAGE: u32 = 9;
const MAX_PAGES: u32 = 1000;
const MIN_VOTING_PERIOD: u64 = 24 * 3600; // 1 day in seconds
const MAX_VOTING_PERIOD: u64 = 30 * 24 * 3600; // 30 days in seconds

#[contractimpl]
impl DaoTrait for Tansu {
    fn anonymous_voting_setup(env: Env, public_key: String) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&types::DataKey::Admin)
            .unwrap();
        admin.require_auth();

        // generators
        let bls12_381 = env.crypto().bls12_381();

        let vote_generator = Bytes::from_slice(&env, "VOTE_GENERATOR".as_bytes());
        let vote_dst = Bytes::from_slice(&env, "VOTE_COMMITMENT".as_bytes());
        let seed_generator = Bytes::from_slice(&env, "SEED_GENERATOR".as_bytes());
        let seed_dst = Bytes::from_slice(&env, "VOTE_SEED".as_bytes());

        let vote_generator_point = bls12_381
            .hash_to_g1(&vote_generator, &vote_dst)
            .to_xdr(&env);
        let seed_generator_point = bls12_381
            .hash_to_g1(&seed_generator, &seed_dst)
            .to_xdr(&env);

        let vote_config = types::AnonymousVoteConfig {
            vote_generator_point,
            seed_generator_point,
            public_key,
        };

        env.storage()
            .instance()
            .set(&types::DataKey::AnonymousVoteConfig, &vote_config);
    }

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
            let votes = vec![
                &env,
                types::Vote::PublicVote(types::PublicVote::Abstain(proposer.clone())),
            ];
            let voters = vec![&env, proposer];
            let vote_data = types::VoteData {
                voting_ends_at,
                public: true,
                votes,
                voters,
            };
            let proposal = types::Proposal {
                id: proposal_id,
                title,
                ipfs,
                vote_data,
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
        if proposal.vote_data.voters.contains(&voter) {
            panic_with_error!(&env, &errors::ContractErrors::AlreadyVoted);
        } else {
            // Record the vote
            proposal.vote_data.votes.push_back(vote);

            dao_page.proposals.set(sub_id, proposal);

            env.storage()
                .persistent()
                .set(&types::ProjectKey::Dao(project_key_, page), &dao_page)
        }
    }

    fn execute(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        proposal_id: u32,
    ) -> types::ProposalStatus {
        maintainer.require_auth();

        let project_key_ = project_key.clone();
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key_.clone(), page);
        let mut proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        let curr_timestamp = env.ledger().timestamp();

        // only allow to execute once
        if proposal.status != types::ProposalStatus::Active {
            panic_with_error!(&env, &errors::ContractErrors::AlreadyExecuted);
        } else if curr_timestamp < proposal.vote_data.voting_ends_at {
            panic_with_error!(&env, &errors::ContractErrors::ProposalVotingTime);
        } else {
            // count votes
            let mut voted_approve = 0;
            let mut voted_reject = 0;
            let mut voted_abstain = 0;
            for vote_ in &proposal.vote_data.votes {
                match &vote_ {
                    types::Vote::PublicVote(types::PublicVote::Approve(_)) => voted_approve += 1,
                    types::Vote::PublicVote(types::PublicVote::Reject(_)) => voted_reject += 1,
                    types::Vote::PublicVote(types::PublicVote::Abstain(_)) => voted_abstain += 1,
                    _ => {}
                }
            }

            // accept or reject if we have a majority
            if voted_approve > (voted_abstain + voted_reject) {
                proposal.status = types::ProposalStatus::Approved;
            } else if voted_reject > (voted_abstain + voted_approve) {
                proposal.status = types::ProposalStatus::Rejected;
            } else {
                proposal.status = types::ProposalStatus::Cancelled
            }

            dao_page.proposals.set(sub_id, proposal.clone());

            env.storage()
                .persistent()
                .set(&types::ProjectKey::Dao(project_key_, page), &dao_page);

            proposal.status
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
