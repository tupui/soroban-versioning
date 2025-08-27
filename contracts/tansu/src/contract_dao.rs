use crate::{
    DaoTrait, MembershipTrait, Tansu, TansuArgs, TansuClient, TansuTrait, errors, events, types,
};
use soroban_sdk::crypto::bls12_381::G1Affine;
use soroban_sdk::{
    Address, Bytes, BytesN, Env, Event, String, U256, Vec, contractimpl, panic_with_error, vec,
};

const MAX_TITLE_LENGTH: u32 = 256;
const MAX_PROPOSALS_PER_PAGE: u32 = 9;
const MAX_PAGES: u32 = 1000;
const MIN_VOTING_PERIOD: u64 = 24 * 3600; // 1 day in seconds
const MAX_VOTING_PERIOD: u64 = 30 * 24 * 3600; // 30 days in seconds
const MAX_VOTES_PER_PROPOSAL: u32 = 1000; // DoS protection

#[contractimpl]
impl DaoTrait for Tansu {
    /// Setup anonymous voting for a project.
    ///
    /// Configures BLS12-381 cryptographic primitives for anonymous voting.
    /// Only the contract admin can call this function.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - Unique identifier for the project
    /// * `public_key` - Asymmetric public key to be used for vote encryption
    ///
    /// # Panics
    /// * If the caller is not the contract admin
    fn anonymous_voting_setup(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        public_key: String,
    ) {
        crate::auth_maintainers(&env, &maintainer, &project_key);

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
            public_key: public_key.clone(),
        };

        env.storage().instance().set(
            &types::ProjectKey::AnonymousVoteConfig(project_key.clone()),
            &vote_config,
        );

        // Emit event for anonymous voting setup
        events::AnonymousVotingSetup {
            project_key,
            maintainer,
            public_key,
        }
        .publish(&env);
    }

    /// Get the anonymous voting configuration for a project.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    ///
    /// # Returns
    /// * `types::AnonymousVoteConfig` - The anonymous voting configuration
    ///
    /// # Panics
    /// * If no anonymous voting configuration exists for the project
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

    /// Build vote commitments from votes and seeds for anonymous voting.
    ///
    /// Creates BLS12-381 commitments for each vote using the formula:
    /// C = g^vote * h^seed where g and h are generator points.
    ///
    /// Note: This function does not consider voting weights, which are applied
    /// during the tallying phase. Calling this on the smart contract would reveal
    /// the votes and seeds, so it must be run either in simulation or client-side.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - Unique identifier for the project
    /// * `votes` - Vector of vote choices (0=abstain, 1=approve, 2=reject)
    /// * `seeds` - Vector of random seeds for each vote
    ///
    /// # Returns
    /// * `Vec<BytesN<96>>` - Vector of vote commitments (one per vote)
    ///
    /// # Panics
    /// * If no anonymous voting configuration exists for the project
    fn build_commitments_from_votes(
        env: Env,
        project_key: Bytes,
        votes: Vec<u128>,
        seeds: Vec<u128>,
    ) -> Vec<BytesN<96>> {
        let vote_config = Self::get_anonymous_voting_config(env.clone(), project_key);

        let bls12_381 = env.crypto().bls12_381();
        let seed_generator_point = G1Affine::from_bytes(vote_config.seed_generator_point);
        let vote_generator_point = G1Affine::from_bytes(vote_config.vote_generator_point);

        let mut commitments = Vec::new(&env);
        for (vote_, seed_) in votes.iter().zip(seeds.iter()) {
            let vote_: U256 = U256::from_u128(&env, vote_);
            let seed_: U256 = U256::from_u128(&env, seed_);
            let seed_point_ = bls12_381.g1_mul(&seed_generator_point, &seed_.into());
            let vote_point_ = bls12_381.g1_mul(&vote_generator_point, &vote_.into());

            commitments.push_back(bls12_381.g1_add(&vote_point_, &seed_point_).to_bytes());
        }
        commitments
    }

    /// Create a new proposal for a project.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `proposer` - Address of the proposal creator
    /// * `project_key` - Unique identifier for the project
    /// * `title` - Title of the proposal
    /// * `ipfs` - IPFS content identifier describing the proposal
    /// * `voting_ends_at` - UNIX timestamp when voting ends
    /// * `public_voting` - Whether voting is public or anonymous
    /// # Returns
    /// * `u32` - The ID of the created proposal.
    ///
    /// The proposer is automatically added to the abstain group.
    ///
    /// # Panics
    /// * If the title is too long
    /// * If the voting period is invalid
    /// * If the project doesn't exist
    fn create_proposal(
        env: Env,
        proposer: Address,
        project_key: Bytes,
        title: String,
        ipfs: String,
        voting_ends_at: u64,
        public_voting: bool,
    ) -> u32 {
        Tansu::require_not_paused(env.clone());

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
        crate::auth_maintainers(&env, &proposer, &project_key);

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
                address: proposer.clone(),
                weight: abstain_weight,
                vote_choice: types::VoteChoice::Abstain,
            }),
            false => types::Vote::AnonymousVote(types::AnonymousVote {
                address: proposer.clone(),
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
                commitments: Self::build_commitments_from_votes(
                    env.clone(),
                    project_key.clone(),
                    vec![&env, 0u128, 0u128, 1u128],
                    vec![&env, 0u128, 0u128, 0u128],
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
        let mut dao_page = Self::get_dao(env.clone(), project_key.clone(), page);
        dao_page.proposals.push_back(proposal.clone());

        env.storage().persistent().set(
            &types::ProjectKey::Dao(project_key.clone(), page),
            &dao_page,
        );

        events::ProposalCreated {
            project_key,
            proposal_id,
            title: proposal.title,
            proposer,
            voting_ends_at,
            public_voting,
        }
        .publish(&env);

        proposal_id
    }

    /// Cast a vote on a proposal.
    ///
    /// Allows a member to vote on a proposal.
    /// The vote can be either public or anonymous depending on the proposal configuration.
    /// For public votes, the choice and weight are visible. For anonymous votes, only
    /// the weight is visible, and the choice is encrypted.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `voter` - The address of the voter
    /// * `project_key` - The project key identifier
    /// * `proposal_id` - The ID of the proposal to vote on
    /// * `vote` - The vote data (public or anonymous)
    ///
    /// # Panics
    /// * If the voter has already voted
    /// * If the voting period has ended
    /// * If the proposal doesn't exist
    /// * If the voter's weight exceeds their maximum allowed weight
    /// * If the voter is not a member of the project
    fn vote(env: Env, voter: Address, project_key: Bytes, proposal_id: u32, vote: types::Vote) {
        Tansu::require_not_paused(env.clone());

        voter.require_auth();

        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = Self::get_dao(env.clone(), project_key.clone(), page);
        let mut proposal = match dao_page.proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        };

        // Check vote limits for DoS protection
        if proposal.vote_data.votes.len() >= MAX_VOTES_PER_PROPOSAL {
            panic_with_error!(&env, &errors::ContractErrors::VoteLimitExceeded);
        }

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

        if !is_public_vote && let types::Vote::AnonymousVote(vote_choice) = &vote {
            if vote_choice.commitments.len() != 3 {
                panic_with_error!(&env, &errors::ContractErrors::BadCommitment)
            }
            for commitment in &vote_choice.commitments {
                G1Affine::from_bytes(commitment);
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
        proposal.vote_data.votes.push_back(vote.clone());

        dao_page.proposals.set(sub_id, proposal);

        env.storage().persistent().set(
            &types::ProjectKey::Dao(project_key.clone(), page),
            &dao_page,
        );

        events::VoteCast {
            project_key,
            proposal_id,
            voter,
        }
        .publish(&env);
    }

    /// Execute a vote after the voting period ends.
    ///
    /// Processes the voting results and determines the final status of the proposal.
    /// For public votes, the results are calculated directly from vote counts.
    /// For anonymous votes, tallies and seeds are validated against vote commitments
    /// to ensure the results are correct.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `maintainer` - The address of the maintainer executing the proposal
    /// * `project_key` - The project key identifier
    /// * `proposal_id` - The ID of the proposal to execute
    /// * [`Option<tallies>`] - decoded tally values (scaled by weights), respectively Approve, reject and abstain
    /// * [`Option<seeds>`] - decoded seed values (scaled by weights), respectively Approve, reject and abstain
    ///
    /// # Returns
    /// * `types::ProposalStatus` - The final status of the proposal (Approved, Rejected, or Cancelled)
    ///
    /// # Panics
    /// * If the voting period hasn't ended
    /// * If the proposal doesn't exist
    /// * If tallies/seeds are missing for anonymous votes
    /// * If commitment validation fails for anonymous votes
    /// * If the maintainer is not authorized
    fn execute(
        env: Env,
        maintainer: Address,
        project_key: Bytes,
        proposal_id: u32,
        tallies: Option<Vec<u128>>,
        seeds: Option<Vec<u128>>,
    ) -> types::ProposalStatus {
        Tansu::require_not_paused(env.clone());

        maintainer.require_auth();

        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let mut dao_page = Self::get_dao(env.clone(), project_key.clone(), page);
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
                if !Self::proof(
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

        env.storage().persistent().set(
            &types::ProjectKey::Dao(project_key.clone(), page),
            &dao_page,
        );

        events::ProposalExecuted {
            project_key: project_key.clone(),
            proposal_id,
            status: match proposal.status {
                types::ProposalStatus::Active => String::from_str(&env, "Active"),
                types::ProposalStatus::Approved => String::from_str(&env, "Approved"),
                types::ProposalStatus::Rejected => String::from_str(&env, "Rejected"),
                types::ProposalStatus::Cancelled => String::from_str(&env, "Cancelled"),
            },
            maintainer: maintainer.clone(),
        }
        .publish(&env);

        proposal.status
    }

    /// Verify vote commitment proof for anonymous voting.
    ///
    /// Validates that the provided tallies and seeds match the vote commitments
    /// without revealing individual votes. This ensures the integrity of anonymous
    /// voting results.
    ///
    /// The commitment is:
    ///
    /// C = g^v * h^r (in additive notation: g*v + h*r),
    ///
    /// where g, h are BLS12-381 generator points and v is the vote choice,
    /// r is the seed. Voting weight is introduced during the tallying phase.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    /// * `proposal` - The proposal containing vote commitments
    /// * `tallies` - Decoded tally values [approve, reject, abstain] (scaled by weights)
    /// * `seeds` - Decoded seed values [approve, reject, abstain] (scaled by weights)
    ///
    /// # Returns
    /// * `bool` - True if all commitments match the provided tallies and seeds
    ///
    /// # Panics
    /// * If no anonymous voting configuration exists for the project
    fn proof(
        env: Env,
        project_key: Bytes,
        proposal: types::Proposal,
        tallies: Vec<u128>,
        seeds: Vec<u128>,
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
            let seed_: U256 = U256::from_u128(&env, seed_);
            let tally_: U256 = U256::from_u128(&env, tally_);
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
                let weight_: U256 = U256::from_u32(&env, anonymous_vote.weight);
                for (commitment, tally_commitment) in anonymous_vote
                    .commitments
                    .iter()
                    .zip(tally_commitments.iter_mut())
                {
                    let commitment_ = G1Affine::from_bytes(commitment);
                    // scale the commitment by the voter weight: g*v*weight + h*r*weight.
                    let weighted_commitment =
                        bls12_381.g1_mul(&commitment_, &weight_.clone().into());
                    *tally_commitment = bls12_381.g1_add(tally_commitment, &weighted_commitment);
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

    /// Returns a page of proposals (0 to MAX_PROPOSALS_PER_PAGE proposals per page).
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    /// * `page` - The page number (0-based)
    ///
    /// # Returns
    /// * `types::Dao` - The DAO object containing a page of proposals
    ///
    /// # Panics
    /// * If the page number is out of bounds
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

    /// Get a single proposal by ID.
    ///
    /// # Arguments
    /// * `env` - The environment object
    /// * `project_key` - The project key identifier
    /// * `proposal_id` - The ID of the proposal to retrieve
    ///
    /// # Returns
    /// * `types::Proposal` - The proposal object
    ///
    /// # Panics
    /// * If the proposal doesn't exist
    fn get_proposal(env: Env, project_key: Bytes, proposal_id: u32) -> types::Proposal {
        let page = proposal_id / MAX_PROPOSALS_PER_PAGE;
        let sub_id = proposal_id % MAX_PROPOSALS_PER_PAGE;
        let dao_page = Self::get_dao(env.clone(), project_key, page);
        let proposals = dao_page.proposals;
        match proposals.try_get(sub_id) {
            Ok(Some(proposal)) => proposal,
            _ => panic_with_error!(&env, &errors::ContractErrors::NoProposalorPageFound),
        }
    }
}

/// Execute a public voting proposal.
///
/// Helper function to determine the final status of a public voting proposal
/// based on the vote counts. For public voting, all votes are visible and
/// the result is calculated by summing the weighted votes for each choice.
///
/// # Arguments
/// * `proposal` - The proposal to execute
///
/// # Returns
/// * `types::ProposalStatus` - The final status (Approved if approve > reject, Rejected if reject > approve, Cancelled if equal)
pub fn public_execute(proposal: &types::Proposal) -> types::ProposalStatus {
    // count votes
    let mut voted_approve = 0;
    let mut voted_reject = 0;
    let mut voted_abstain = 0;
    for vote_ in &proposal.vote_data.votes {
        if let types::Vote::PublicVote(vote) = &vote_ {
            match vote.vote_choice {
                types::VoteChoice::Approve => voted_approve += vote.weight as u128,
                types::VoteChoice::Reject => voted_reject += vote.weight as u128,
                types::VoteChoice::Abstain => voted_abstain += vote.weight as u128,
            };
        }
    }

    tallies_to_result(voted_approve, voted_reject, voted_abstain)
}

/// Execute an anonymous voting proposal.
///
/// Helper function to determine the final status of an anonymous voting proposal
/// based on the tallied vote counts. For anonymous voting, individual votes are
/// not visible, only the aggregated tallies.
///
/// # Arguments
/// * `tallies` - The tallied vote counts [approve, reject, abstain]
///
/// # Returns
/// * `types::ProposalStatus` - The final status (Approved if approve > reject, Rejected if reject > approve, Cancelled if equal)
pub fn anonymous_execute(tallies: &Vec<u128>) -> types::ProposalStatus {
    let mut iter = tallies.iter();

    let voted_approve = iter.next().unwrap();
    let voted_reject = iter.next().unwrap();
    let voted_abstain = iter.next().unwrap();

    tallies_to_result(voted_approve, voted_reject, voted_abstain)
}

/// Convert vote tallies to proposal status.
///
/// Helper function to determine the final status based on vote counts.
/// Abstain votes are ignored in the decision. If approve and reject are equal,
/// the proposal is cancelled.
///
/// # Arguments
/// * `voted_approve` - Number of approve votes
/// * `voted_reject` - Number of reject votes
/// * `voted_abstain` - Number of abstain votes (not used in decision)
///
/// # Returns
/// * `types::ProposalStatus` - The final status (Approved, Rejected, or Cancelled)
fn tallies_to_result(
    voted_approve: u128,
    voted_reject: u128,
    voted_abstain: u128,
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
