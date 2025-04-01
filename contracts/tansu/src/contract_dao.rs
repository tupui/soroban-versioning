use crate::{errors, types, DaoTrait, Tansu, TansuArgs, TansuClient};
use soroban_sdk::crypto::bls12_381::{Fr, G1Affine};
use soroban_sdk::xdr::{FromXdr, ToXdr};
use soroban_sdk::{
    bytesn, contractimpl, panic_with_error, vec, Address, Bytes, Env, String, Vec, U256,
};

const MAX_TITLE_LENGTH: u32 = 256;
const MAX_PROPOSALS_PER_PAGE: u32 = 9;
const MAX_PAGES: u32 = 1000;
const MIN_VOTING_PERIOD: u64 = 24 * 3600; // 1 day in seconds
const MAX_VOTING_PERIOD: u64 = 30 * 24 * 3600; // 30 days in seconds

#[contractimpl]
impl DaoTrait for Tansu {
    /// Anonymous voting primitives.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `public_key` - Asymmetric public key to be used to encode seeds
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
                types::Vote::PublicVote(types::PublicVote {
                    address: proposer.clone(),
                    vote_choice: types::VoteChoice::Abstain,
                }),
            ];
            let vote_data = types::VoteData {
                voting_ends_at,
                public: true,
                votes,
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
        let has_already_voted = proposal.vote_data.votes.iter().any(|vote_| match vote_ {
            types::Vote::PublicVote(public_vote) => public_vote.address == voter,
            types::Vote::AnonymousVote(anonymous_vote) => anonymous_vote.address == voter,
        });

        if has_already_voted {
            panic_with_error!(&env, &errors::ContractErrors::AlreadyVoted);
        }

        // proposals are either public or anonymous so only a single type of vote
        // can be registered for a given proposal
        let is_public_vote = matches!(vote, types::Vote::PublicVote(_));
        if is_public_vote != proposal.vote_data.public {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoteType);
        }

        // can only vote for yourself so address must match
        let vote_address = match &vote {
            types::Vote::PublicVote(vote_choice) => &vote_choice.address,
            types::Vote::AnonymousVote(vote_choice) => &vote_choice.address,
        };
        if vote_address != &voter {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoter);
        }

        // Record the vote
        proposal.vote_data.votes.push_back(vote);

        dao_page.proposals.set(sub_id, proposal);

        env.storage()
            .persistent()
            .set(&types::ProjectKey::Dao(project_key_, page), &dao_page)
    }

    /// Execute a vote after the voting period ends.
    /// Double votes are not allowed.
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - Address of the maintainer
    /// * `project_key` - Unique identifier for the project
    /// * `proposal_id` - ID of the proposal
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
            panic_with_error!(&env, &errors::ContractErrors::ProposalActive);
        } else if curr_timestamp < proposal.vote_data.voting_ends_at {
            panic_with_error!(&env, &errors::ContractErrors::ProposalVotingTime);
        } else {
            // TODO anonymous branching
            // match proposal.vote_data.public {
            //     true => {}
            //     false => {}
            // }

            // count votes
            let mut voted_approve = 0;
            let mut voted_reject = 0;
            let mut voted_abstain = 0;
            for vote_ in &proposal.vote_data.votes {
                match &vote_ {
                    types::Vote::PublicVote(vote) => match vote.vote_choice {
                        types::VoteChoice::Approve => voted_approve += 1,
                        types::VoteChoice::Reject => voted_reject += 1,
                        types::VoteChoice::Abstain => voted_abstain += 1,
                    },
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

    fn proof(env: Env, project_key: Bytes, proposal_id: u32, tally: u32, seed: u32) -> bool {
        let project_key_ = project_key.clone();
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key_.clone(), page);
        let proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        // only allow to proof if proposal is not active
        if proposal.status != types::ProposalStatus::Active {
            panic_with_error!(&env, &errors::ContractErrors::ProposalActive);
        }

        // we can only proof anonymous votes
        if proposal.vote_data.public {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoteType);
        }

        let bls12_381 = env.crypto().bls12_381();

        let vote_config: types::AnonymousVoteConfig = env
            .storage()
            .instance()
            .get(&types::DataKey::AnonymousVoteConfig)
            .unwrap();

        let seed_generator_point =
            G1Affine::from_xdr(&env, &vote_config.seed_generator_point).unwrap();
        let vote_generator_point =
            G1Affine::from_xdr(&env, &vote_config.vote_generator_point).unwrap();

        // calculate commitments from vote tally and seed tally
        let seed: U256 = U256::from_u32(&env, seed);
        let tally: U256 = U256::from_u32(&env, tally);
        let seed_point = bls12_381.g1_mul(&seed_generator_point, &seed.into());
        let tally_commitment_votes = bls12_381.g1_mul(&vote_generator_point, &tally.into());

        let commitment_check = bls12_381.g1_add(&tally_commitment_votes, &seed_point);

        // tally commitments from recorded votes (vote + seed)
        let mut tally_commitment = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
        for vote_ in proposal.vote_data.votes.iter() {
            if let types::Vote::AnonymousVote(anonymous_vote) = &vote_ {
                let commitment = G1Affine::from_xdr(&env, &anonymous_vote.commitment).unwrap();
                tally_commitment = bls12_381.g1_add(&tally_commitment, &commitment);
            };
        }

        // compare commitments
        commitment_check == tally_commitment
    }

    fn transparent_proof(env: Env, project_key: Bytes, proposal_id: u32, seeds: Vec<u32>) -> bool {
        let project_key_ = project_key.clone();
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key_.clone(), page);
        let proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        // only allow to proof if proposal is not active
        if proposal.status != types::ProposalStatus::Active {
            panic_with_error!(&env, &errors::ContractErrors::ProposalActive);
        }

        // we can only proof anonymous votes
        if proposal.vote_data.public {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoteType);
        }

        let bls12_381 = env.crypto().bls12_381();

        let vote_config: types::AnonymousVoteConfig = env
            .storage()
            .instance()
            .get(&types::DataKey::AnonymousVoteConfig)
            .unwrap();

        let seed_generator_point =
            G1Affine::from_xdr(&env, &vote_config.seed_generator_point).unwrap();

        // use decrypted seeds to remove them from commitments to have vote commitments
        //
        let mut tally_commitment = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
        let mut tally_commitment_votes = G1Affine::from_bytes(bytesn!(&env, 0x400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000));
        for it in proposal.vote_data.votes.iter().zip(seeds.iter()) {
            let (vote_, seed) = it;
            if let types::Vote::AnonymousVote(anonymous_vote) = &vote_ {
                let commitment = G1Affine::from_xdr(&env, &anonymous_vote.commitment).unwrap();

                tally_commitment = bls12_381.g1_add(&tally_commitment, &commitment);

                let recovered_vote =
                    recover_vote_choice_commitment(&env, &commitment, &seed, &seed_generator_point);
                tally_commitment_votes = bls12_381.g1_add(&tally_commitment_votes, &recovered_vote)
            };
        }

        let tally_seed: U256 = U256::from_u32(&env, seeds.iter().sum());
        let tally_seed_point = bls12_381.g1_mul(&seed_generator_point, &tally_seed.into());
        let commitment_check = bls12_381.g1_add(&tally_commitment_votes, &tally_seed_point);

        // compare commitments
        commitment_check == tally_commitment
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

/// Voting choice commitment.
///
/// Recover the commitment by removing the randomization introduced by the
/// seed.
///
/// Vote commitment is:
///
/// C = g^v * h^r (in additive notation: g*v + h*r),
///
/// where g, h point generator and v is the vote choice, r is the seed.
///
/// # Arguments
/// * `env` - The environment object
/// * `commitment` - Vote commitment
/// * `seed` - decoded seed value
/// * `seed_generator` - G1 generator point
/// # Returns
/// * `G1Affine` - The commitment of the choice
pub fn recover_vote_choice_commitment(
    env: &Env,
    commitment: &G1Affine,
    seed: &u32,
    seed_generator: &G1Affine,
) -> G1Affine {
    let bls12_381 = env.crypto().bls12_381();

    let seed_fr = Fr::from_u256(U256::from_u32(env, *seed).clone());
    let seed_point = bls12_381.g1_mul(seed_generator, &seed_fr);
    let neg_seed = neg_value(env, seed_point);

    // Remove randomization
    bls12_381.g1_add(commitment, &neg_seed)
}

/// Negate a point on the G1 curve.
/// # Arguments
/// * `env` - The environment object
/// * `value` - point on G1 to negate
/// # Returns
/// * `types::G1Affine` - The proposal object
fn neg_value(env: &Env, value: G1Affine) -> G1Affine {
    // Create -1 in Fr field using fr_sub(0, 1)
    let bls12_381 = env.crypto().bls12_381();
    let zero = U256::from_u32(env, 0);
    let one = U256::from_u32(env, 1);
    let neg_one = bls12_381.fr_sub(&zero.into(), &one.into());

    // negate the value
    bls12_381.g1_mul(&value, &neg_one)
}
