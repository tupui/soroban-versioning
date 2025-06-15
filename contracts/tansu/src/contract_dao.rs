use crate::{DaoTrait, MembershipTrait, Tansu, TansuArgs, TansuClient, errors, types};
use soroban_sdk::crypto::bls12_381::G1Affine;
use soroban_sdk::{
    Address, Bytes, BytesN, Env, String, U256, Vec, contractimpl, panic_with_error, vec,
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
    /// * `project_key` - Unique identifier for the project
    /// * `public_key` - Asymmetric public key to be used to encode seeds
    fn anonymous_voting_setup(env: Env, project_key: Bytes, public_key: String) {
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

        let vote_generator_point = bls12_381.hash_to_g1(&vote_generator, &vote_dst).to_bytes();
        let seed_generator_point = bls12_381.hash_to_g1(&seed_generator, &seed_dst).to_bytes();

        let vote_config = types::AnonymousVoteConfig {
            vote_generator_point,
            seed_generator_point,
            public_key,
        };

        env.storage().instance().set(
            &types::ProjectKey::AnonymousVoteConfig(project_key),
            &vote_config,
        );
    }

    fn get_anonymous_voting_config(env: Env, project_key: Bytes) -> types::AnonymousVoteConfig {
        env.storage()
            .instance()
            .get::<types::ProjectKey, types::AnonymousVoteConfig>(
                &types::ProjectKey::AnonymousVoteConfig(project_key),
            )
            .unwrap_or_else(|| {
                panic_with_error!(&env, &errors::ContractErrors::NoAnonymousVotingConfig);
            })
    }

    /// Build all three commitments from the votes and seeds.
    ///
    /// Calling that on the smart contract itself would reveal the votes and seeds.
    /// This can be run in simulation in your RPC or used as a basis for
    /// implementation client-side.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - Unique identifier for the project
    /// * `votes` - Vector of votes.
    /// * `seeds` - Vector of seeds.
    /// # Returns
    /// * `Vec<BytesN<96>>` - The three voting commitments.
    fn build_commitments_from_votes(
        env: Env,
        project_key: Bytes,
        votes: Vec<u32>,
        seeds: Vec<u32>,
    ) -> Vec<BytesN<96>> {
        let vote_config =
            <Tansu as DaoTrait>::get_anonymous_voting_config(env.clone(), project_key);

        let bls12_381 = env.crypto().bls12_381();
        let seed_generator_point = G1Affine::from_bytes(vote_config.seed_generator_point);
        let vote_generator_point = G1Affine::from_bytes(vote_config.vote_generator_point);

        let mut commitments = Vec::new(&env);
        for (vote_, seed_) in votes.iter().zip(seeds.iter()) {
            let vote_: U256 = U256::from_u32(&env, vote_);
            let seed_: U256 = U256::from_u32(&env, seed_);
            let seed_point_ = bls12_381.g1_mul(&seed_generator_point, &seed_.into());
            let vote_point_ = bls12_381.g1_mul(&vote_generator_point, &vote_.into());

            commitments.push_back(bls12_381.g1_add(&vote_point_, &seed_point_).to_bytes());
        }
        commitments
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
        public_voting: bool,
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

            // proposer is automatically in the abstain group
            // use the first level to not block a vote from proposer with
            // a very high level of trust
            let abstain_weight = types::Badge::Verified as u32;
            let vote_ = match public_voting {
                true => types::Vote::PublicVote(types::PublicVote {
                    address: proposer,
                    weight: abstain_weight,
                    vote_choice: types::VoteChoice::Abstain,
                }),
                false => types::Vote::AnonymousVote(types::AnonymousVote {
                    address: proposer,
                    weight: abstain_weight,
                    encrypted_seeds: vec![
                        &env,
                        String::from_str(&env, "0"),
                        String::from_str(&env, "0"),
                        String::from_str(&env, "0"),
                    ],
                    encrypted_votes: vec![
                        &env,
                        String::from_str(&env, "0"),
                        String::from_str(&env, "0"),
                        String::from_str(&env, "1"),
                    ],
                    commitments: <Tansu as DaoTrait>::build_commitments_from_votes(
                        env.clone(),
                        project_key.clone(),
                        vec![&env, 0u32, 0u32, 1u32],
                        vec![&env, 0u32, 0u32, 0u32],
                    ),
                }),
            };

            let votes = vec![&env, vote_];
            let vote_data = types::VoteData {
                voting_ends_at,
                public_voting,
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
                &types::ProjectKey::DaoTotalProposals(project_key.clone()),
                &next_id,
            );

            let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
            let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key.clone(), page);
            dao_page.proposals.push_back(proposal);

            env.storage().persistent().set(
                &types::ProjectKey::Dao(project_key.clone(), page),
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

        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key.clone(), page);
        let mut proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        // only allow to vote once per voter
        let has_already_voted = proposal.vote_data.votes.iter().any(|vote_| match vote_ {
            types::Vote::PublicVote(vote_choice) => vote_choice.address == voter,
            types::Vote::AnonymousVote(vote_choice) => vote_choice.address == voter,
        });

        if has_already_voted {
            panic_with_error!(&env, &errors::ContractErrors::AlreadyVoted);
        }

        // proposals are either public or anonymous so only a single type of vote
        // can be registered for a given proposal
        let is_public_vote = matches!(vote, types::Vote::PublicVote(_));
        if is_public_vote != proposal.vote_data.public_voting {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoteType);
        }

        if !is_public_vote {
            if let types::Vote::AnonymousVote(vote_choice) = &vote {
                if vote_choice.commitments.len() != 3 {
                    panic_with_error!(&env, &errors::ContractErrors::BadCommitment)
                }
                for commitment in &vote_choice.commitments {
                    G1Affine::from_bytes(commitment);
                }
            }
        }

        // can only vote for yourself so address must match
        let vote_address = match &vote {
            types::Vote::PublicVote(vote_choice) => &vote_choice.address,
            types::Vote::AnonymousVote(vote_choice) => &vote_choice.address,
        };
        if vote_address != &voter {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoter);
        }

        // Voter can use up to their max allowed voting weight
        let vote_weight = match &vote {
            types::Vote::PublicVote(vote_choice) => &vote_choice.weight,
            types::Vote::AnonymousVote(vote_choice) => &vote_choice.weight,
        };

        let voter_max_weight = <Tansu as MembershipTrait>::get_max_weight(
            env.clone(),
            project_key.clone(),
            vote_address.clone(),
        );

        if vote_weight > &voter_max_weight {
            panic_with_error!(&env, &errors::ContractErrors::VoterWeight);
        }

        // Record the vote
        proposal.vote_data.votes.push_back(vote);

        dao_page.proposals.set(sub_id, proposal);

        env.storage()
            .persistent()
            .set(&types::ProjectKey::Dao(project_key, page), &dao_page)
    }

    /// Execute a vote after the voting period ends.
    ///
    /// When proposals are anonymous, `tally` is validated against the sum of
    /// all vote commitments. The `seed` is essential for the validation.
    ///
    /// # Panics
    ///
    /// Double votes are not allowed. Tally and seed must be present for
    /// anonymous votes and forbidden otherwise. For anonymous votes, it will
    /// panic if the commitment proof validation fails.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - Address of the maintainer
    /// * `project_key` - Unique identifier for the project
    /// * `proposal_id` - ID of the proposal
    /// * [`Option<tallies>`] - decoded tally values, respectively Approve, reject and abstain
    /// * [`Option<seeds>`] - decoded seed values, respectively Approve, reject and abstain
    fn execute(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        proposal_id: u32,
        tallies: Option<Vec<u32>>,
        seeds: Option<Vec<u32>>,
    ) -> types::ProposalStatus {
        maintainer.require_auth();

        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = <Tansu as DaoTrait>::get_dao(env.clone(), project_key.clone(), page);
        let mut proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        let curr_timestamp = env.ledger().timestamp();

        // only allow to execute once
        if proposal.status != types::ProposalStatus::Active {
            panic_with_error!(&env, &errors::ContractErrors::ProposalActive);
        }
        if curr_timestamp < proposal.vote_data.voting_ends_at {
            panic_with_error!(&env, &errors::ContractErrors::ProposalVotingTime);
        }

        // tally to results
        proposal.status = match proposal.vote_data.public_voting {
            true => {
                if tallies.is_some() | seeds.is_some() {
                    panic_with_error!(&env, &errors::ContractErrors::TallySeedError);
                }
                public_execute(&proposal)
            }
            false => {
                if !(tallies.is_some() & seeds.is_some()) {
                    panic_with_error!(&env, &errors::ContractErrors::TallySeedError);
                }
                let tallies_ = tallies.unwrap();
                if !<Tansu as DaoTrait>::proof(
                    env.clone(),
                    project_key.clone(),
                    proposal.clone(),
                    tallies_.clone(),
                    seeds.unwrap(),
                ) {
                    panic_with_error!(&env, &errors::ContractErrors::InvalidProof)
                }
                anonymous_execute(&tallies_)
            }
        };

        dao_page.proposals.set(sub_id, proposal.clone());

        env.storage()
            .persistent()
            .set(&types::ProjectKey::Dao(project_key, page), &dao_page);

        proposal.status
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
    /// * `project_key` - Unique identifier for the project
    /// * `commitment` - Vote commitment
    /// * `tally` - decoded tally value
    /// * `seed` - decoded seed value
    /// # Returns
    /// * `bool` - True if the commitment match
    fn proof(
        env: Env,
        project_key: Bytes,
        proposal: types::Proposal,
        tallies: Vec<u32>,
        seeds: Vec<u32>,
    ) -> bool {
        // only allow to proof if proposal is not active
        if proposal.status != types::ProposalStatus::Active {
            panic_with_error!(&env, &errors::ContractErrors::ProposalActive);
        }

        // we can only proof anonymous votes
        if proposal.vote_data.public_voting {
            panic_with_error!(&env, &errors::ContractErrors::WrongVoteType);
        }

        let bls12_381 = env.crypto().bls12_381();

        let vote_config: types::AnonymousVoteConfig = env
            .storage()
            .instance()
            .get(&types::ProjectKey::AnonymousVoteConfig(project_key))
            .unwrap();

        let seed_generator_point = G1Affine::from_bytes(vote_config.seed_generator_point);
        let vote_generator_point = G1Affine::from_bytes(vote_config.vote_generator_point);

        // calculate commitments from vote tally and seed tally
        let mut commitment_checks = Vec::new(&env);
        for it in tallies.iter().zip(seeds.iter()) {
            let (tally_, seed_) = it;
            let seed_: U256 = U256::from_u32(&env, seed_);
            let tally_: U256 = U256::from_u32(&env, tally_);
            let seed_point_ = bls12_381.g1_mul(&seed_generator_point, &seed_.into());
            let tally_commitment_votes_ = bls12_381.g1_mul(&vote_generator_point, &tally_.into());
            let commitment_check_ = bls12_381.g1_add(&tally_commitment_votes_, &seed_point_);
            commitment_checks.push_back(commitment_check_);
        }

        // tally commitments from recorded votes (vote + seed)
        let mut g1_identity = [0u8; 96];
        g1_identity[0] = 0x40;
        let tally_commitment_init_ = G1Affine::from_bytes(BytesN::from_array(&env, &g1_identity));

        let mut tally_commitments = [
            tally_commitment_init_.clone(),
            tally_commitment_init_.clone(),
            tally_commitment_init_.clone(),
        ];

        for vote_ in proposal.vote_data.votes.iter() {
            if let types::Vote::AnonymousVote(anonymous_vote) = &vote_ {
                for (commitment, tally_commitment) in anonymous_vote
                    .commitments
                    .iter()
                    .zip(tally_commitments.iter_mut())
                {
                    let commitment_ = G1Affine::from_bytes(commitment);
                    *tally_commitment = bls12_381.g1_add(tally_commitment, &commitment_);
                }
            };
        }

        // compare commitments
        for (commitment_check, tally_commitment) in
            commitment_checks.iter().zip(tally_commitments.iter())
        {
            if commitment_check != *tally_commitment {
                return false;
            }
        }

        true
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

pub fn public_execute(proposal: &types::Proposal) -> types::ProposalStatus {
    // count votes
    let mut voted_approve = 0;
    let mut voted_reject = 0;
    let mut voted_abstain = 0;
    for vote_ in &proposal.vote_data.votes {
        if let types::Vote::PublicVote(vote) = &vote_ {
            match vote.vote_choice {
                types::VoteChoice::Approve => voted_approve += vote.weight,
                types::VoteChoice::Reject => voted_reject += vote.weight,
                types::VoteChoice::Abstain => voted_abstain += vote.weight,
            };
        }
    }

    tallies_to_result(voted_approve, voted_reject, voted_abstain)
}

pub fn anonymous_execute(tallies: &Vec<u32>) -> types::ProposalStatus {
    let mut iter = tallies.iter();

    let voted_approve = iter.next().unwrap();
    let voted_reject = iter.next().unwrap();
    let voted_abstain = iter.next().unwrap();

    tallies_to_result(voted_approve, voted_reject, voted_abstain)
}

fn tallies_to_result(
    voted_approve: u32,
    voted_reject: u32,
    voted_abstain: u32,
) -> types::ProposalStatus {
    // accept or reject if we have a majority
    if voted_approve > (voted_abstain + voted_reject) {
        types::ProposalStatus::Approved
    } else if voted_reject > (voted_abstain + voted_approve) {
        types::ProposalStatus::Rejected
    } else {
        types::ProposalStatus::Cancelled
    }
}
