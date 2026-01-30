use super::test_utils::{create_test_data, init_contract};
use crate::{
    errors::ContractErrors,
    types::{AnonymousVote, Badge, Dao, ProposalStatus, PublicVote, Vote, VoteChoice},
};
use soroban_sdk::testutils::{Address as _, Events, Ledger};
use soroban_sdk::{Address, BytesN, IntoVal, Map, String, Symbol, Val, vec};

#[test]
fn proposal_flow() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Integrate with xlm.sh");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 2;

    let balance_proposer_init = setup.token_stellar.balance(&setup.grogu);
    let balance_voter_init = setup.token_stellar.balance(&setup.mando);

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );

    // Verify proposal creation event
    let mut all_events = setup.env.events().all();
    all_events.pop_front();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "proposal_created"), id.clone()).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "proposal_id"),
                            proposal_id.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "title"),
                            title.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "proposer"),
                            setup.grogu.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "voting_ends_at"),
                            voting_ends_at.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "public_voting"),
                            true.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    let balance_proposer_ = setup.token_stellar.balance(&setup.grogu);
    assert!(balance_proposer_init > balance_proposer_);

    setup.contract.vote(
        &setup.mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // Verify vote cast event
    let mut all_events = setup.env.events().all();
    all_events.pop_front();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "vote_cast"), id.clone()).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "proposal_id"),
                            proposal_id.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "voter"),
                            setup.mando.clone().into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    let balance_voter_ = setup.token_stellar.balance(&setup.mando);
    assert!(balance_voter_init > balance_voter_);

    setup.env.ledger().set_timestamp(voting_ends_at + 1);
    let result = setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);

    // Verify proposal executed event
    let mut all_events = setup.env.events().all();
    all_events.pop_front();
    all_events.pop_front();
    all_events.pop_front();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "proposal_executed"), id.clone()).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "proposal_id"),
                            proposal_id.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "status"),
                            String::from_str(&setup.env, "Cancelled").into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "maintainer"),
                            setup.mando.clone().into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    assert_eq!(result, ProposalStatus::Cancelled);

    let balance_proposer_ = setup.token_stellar.balance(&setup.grogu);
    assert_eq!(balance_proposer_init, balance_proposer_);

    let balance_voter_ = setup.token_stellar.balance(&setup.mando);
    assert_eq!(balance_voter_init, balance_voter_);
}

#[test]
fn dao_basic_functionality() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    // Test empty DAO initially
    let dao = setup.contract.get_dao(&id, &0);
    assert_eq!(
        dao,
        Dao {
            proposals: vec![&setup.env]
        }
    );

    let title = String::from_str(&setup.env, "Integrate with xlm.sh");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 2;

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );
    assert_eq!(proposal_id, 0);

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.id, 0);
    assert_eq!(proposal.title, title);
    assert_eq!(proposal.ipfs, ipfs);
    assert_eq!(proposal.vote_data.voting_ends_at, voting_ends_at);
    assert_eq!(
        proposal.vote_data.votes,
        vec![
            &setup.env,
            Vote::PublicVote(PublicVote {
                address: setup.grogu.clone(),
                weight: Badge::Verified as u32,
                vote_choice: VoteChoice::Abstain
            })
        ]
    );

    let dao = setup.contract.get_dao(&id, &0);
    assert_eq!(dao.proposals.len(), 1);
    assert_eq!(dao.proposals.get(0), Some(proposal));
}

#[test]
fn dao_anonymous() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Integrate with xlm.sh");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 2;

    let public_key = String::from_str(&setup.env, "public key random");
    setup
        .contract
        .anonymous_voting_setup(&setup.mando, &id, &public_key);

    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (
                    Symbol::new(&setup.env, "anonymous_voting_setup"),
                    id.clone()
                )
                    .into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "maintainer"),
                            setup.mando.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "public_key"),
                            public_key.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Add a member with elevated rights
    let kuiil = Address::generate(&setup.env);
    setup.token_stellar.mint(&kuiil, &(10 * 10_000_000));
    let meta = String::from_str(&setup.env, "abcd");
    setup
        .contract
        .add_member(&kuiil, &meta, &None, &None, &None, &None, &None, &None);
    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &kuiil, &badges);

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &false,
        &None,
    );
    assert_eq!(proposal_id, 0);

    let proposal = setup.contract.get_proposal(&id, &proposal_id);

    // test build_commitments_from_votes and abstain
    let abstain_vote = Vote::AnonymousVote(AnonymousVote {
        address: setup.grogu.clone(),
        weight: Badge::Verified as u32,
        encrypted_seeds: vec![
            &setup.env,
            String::from_str(&setup.env, "0"),
            String::from_str(&setup.env, "0"),
            String::from_str(&setup.env, "0"),
        ],
        encrypted_votes: vec![
            &setup.env,
            String::from_str(&setup.env, "0"),
            String::from_str(&setup.env, "0"),
            String::from_str(&setup.env, "1"),
        ],
        commitments: setup.contract.build_commitments_from_votes(
            &id,
            &vec![&setup.env, 0u128, 0u128, 1u128],
            &vec![&setup.env, 0u128, 0u128, 0u128],
        ),
    });

    assert_eq!(
        proposal.vote_data.votes,
        vec![&setup.env, abstain_vote.clone()]
    );

    let vote_ = Vote::AnonymousVote(AnonymousVote {
        address: kuiil.clone(),
        weight: 3,
        encrypted_seeds: vec![
            &setup.env,
            String::from_str(&setup.env, "fafdas"),
            String::from_str(&setup.env, "fafdas"),
            String::from_str(&setup.env, "fafdas"),
        ],
        encrypted_votes: vec![
            &setup.env,
            String::from_str(&setup.env, "fafdas"),
            String::from_str(&setup.env, "fafdas"),
            String::from_str(&setup.env, "rewrewr"),
        ],
        commitments: setup.contract.build_commitments_from_votes(
            &id,
            &vec![&setup.env, 3u128, 1u128, 1u128],
            &vec![&setup.env, 5u128, 4u128, 6u128],
        ),
    });
    setup.contract.vote(&kuiil, &id, &proposal_id, &vote_);

    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = setup.contract.execute(
        &setup.grogu,
        &id,
        &proposal_id,
        &Some(vec![&setup.env, 9u128, 3u128, 500003u128]),
        &Some(vec![&setup.env, 15u128, 12u128, 18u128]),
    );

    assert_eq!(vote_result, ProposalStatus::Cancelled);
}

#[test]
fn voting_errors() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Test Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 2;

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );

    // Start testing bad behaviours

    // Not initialized private voting
    let error = setup
        .contract
        .try_create_proposal(
            &setup.grogu,
            &id,
            &title,
            &ipfs,
            &voting_ends_at,
            &false,
            &None,
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::NoAnonymousVotingConfig.into());

    let public_key = String::from_str(&setup.env, "public key random");
    setup
        .contract
        .anonymous_voting_setup(&setup.mando, &id, &public_key);

    let proposal_id_anonymous = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &false,
        &None,
    );

    // Wrong vote type anonymous vs public
    let err = setup
        .contract
        .try_vote(
            &setup.mando,
            &id,
            &proposal_id_anonymous,
            &Vote::PublicVote(PublicVote {
                address: setup.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::WrongVoteType.into());

    // Cannot vote for your own proposal (creator automatically abstains)
    let err = setup
        .contract
        .try_vote(
            &setup.grogu,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: setup.grogu.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::AlreadyVoted.into());

    // Sending wrong commitments
    let error = setup
        .contract
        .try_vote(
            &setup.mando,
            &id,
            &proposal_id_anonymous,
            &Vote::AnonymousVote(AnonymousVote {
                address: setup.mando.clone(),
                weight: Badge::Verified as u32,
                encrypted_seeds: vec![&setup.env, String::from_str(&setup.env, "abcd")],
                encrypted_votes: vec![&setup.env, String::from_str(&setup.env, "fsfds")],
                commitments: vec![
                    &setup.env,
                    BytesN::from_array(&setup.env, &[0; 96]),
                    BytesN::from_array(&setup.env, &[0; 96]),
                ],
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::BadCommitment.into());

    // Vote successfully with another user
    setup.contract.vote(
        &setup.mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // Cannot vote twice
    let err = setup
        .contract
        .try_vote(
            &setup.mando,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: setup.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::AlreadyVoted.into());

    // Cannot vote for someone else
    let kuiil = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test");
    setup
        .contract
        .add_member(&kuiil, &meta, &None, &None, &None, &None, &None, &None);

    let err = setup
        .contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: setup.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::WrongVoter.into());

    // Non-existent proposal
    let err = setup
        .contract
        .try_get_proposal(&id, &10)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::NoProposalorPageFound.into());

    // Too early to execute
    let err = setup
        .contract
        .try_execute(&setup.mando, &id, &proposal_id, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProposalVotingTime.into());

    // advance time to allow execution
    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    // Using args for anonymous voting in public votes. And the other way
    let err = setup
        .contract
        .try_execute(
            &setup.mando,
            &id,
            &proposal_id,
            &Some(vec![&setup.env, 9u128, 3u128, 500003u128]),
            &None,
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::TallySeedError.into());

    let err = setup
        .contract
        .try_execute(&setup.mando, &id, &proposal_id_anonymous, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::TallySeedError.into());

    // Wrong tallies for proof
    let err = setup
        .contract
        .try_execute(
            &setup.grogu,
            &id,
            &proposal_id_anonymous,
            &Some(vec![&setup.env, 0u128, 0u128, 500_001u128]), // 500_000u128
            &Some(vec![&setup.env, 0u128, 0u128, 0u128]),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::InvalidProof.into());

    // Execute proposal for real
    setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);

    // Already executed
    let err = setup
        .contract
        .try_execute(&setup.mando, &id, &proposal_id, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProposalActive.into());
}

#[test]
fn proposal_execution() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    setup.env.ledger().set_timestamp(1234567890);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;

    let title = String::from_str(&setup.env, "Test Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );

    // Add member with badge
    let kuiil = Address::generate(&setup.env);
    setup.token_stellar.mint(&kuiil, &(10 * 10_000_000));
    let meta = String::from_str(&setup.env, "test");
    setup
        .contract
        .add_member(&kuiil, &meta, &None, &None, &None, &None, &None, &None);
    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &kuiil, &badges);

    setup.contract.vote(
        &setup.mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    setup.contract.vote(
        &kuiil,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: kuiil.clone(),
            weight: Badge::Community as u32,
            vote_choice: VoteChoice::Approve,
        }),
    );

    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);
    assert_eq!(vote_result, ProposalStatus::Approved);

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Approved);
}

#[test]
fn proposal_revoke() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    setup.env.ledger().set_timestamp(1234567890);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;

    let title = String::from_str(&setup.env, "Test Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );

    let kuiil = Address::generate(&setup.env);
    let err = setup
        .contract
        .try_revoke_proposal(&kuiil, &id, &proposal_id)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());

    setup
        .contract
        .revoke_proposal(&setup.mando, &id, &proposal_id);

    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "proposal_executed"), id.clone()).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "proposal_id"),
                            proposal_id.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "status"),
                            String::from_str(&setup.env, "Malicious").into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "maintainer"),
                            setup.mando.clone().into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.title, String::from_str(&setup.env, "REDACTED"));
    assert_eq!(proposal.ipfs, String::from_str(&setup.env, "NONE"));
    assert_eq!(proposal.status, ProposalStatus::Malicious);

    // already revoked and also try to call as an admin should go through the
    // auth part and fail later
    let err = setup
        .contract
        .try_revoke_proposal(&setup.contract_admin, &id, &proposal_id)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProposalActive.into());
}

#[test]
fn voter_weight_validation() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    setup.env.ledger().set_timestamp(1234567890);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;

    let title = String::from_str(&setup.env, "Test Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );

    let proposal_id = setup.contract.create_proposal(
        &setup.mando,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &None,
    );

    let kuiil = Address::generate(&setup.env);
    setup.token_stellar.mint(&kuiil, &(10 * 10_000_000));
    let meta = String::from_str(&setup.env, "test");
    setup
        .contract
        .add_member(&kuiil, &meta, &None, &None, &None, &None, &None, &None);

    // Cannot vote with weight higher than max allowed
    let err = setup
        .contract
        .try_vote(
            &kuiil,
            &id,
            &proposal_id,
            &Vote::PublicVote(PublicVote {
                address: kuiil.clone(),
                weight: u32::MAX,
                vote_choice: VoteChoice::Approve,
            }),
        )
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::VoterWeight.into());

    // Add developer badge and test reduced weight voting
    let badges = vec![&setup.env, Badge::Developer, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &kuiil, &badges);

    let max_weight = setup.contract.get_max_weight(&id, &kuiil);
    assert_eq!(max_weight, 11_000_000u32);

    // Vote with reduced weight (should work)
    setup.contract.vote(
        &kuiil,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: kuiil.clone(),
            weight: 42, // kuiil has up to 11M
            vote_choice: VoteChoice::Approve,
        }),
    );

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    let votes = &proposal.vote_data.votes;

    // Find kuiil's vote
    let kuiil_vote = votes.iter().find(|vote| {
        if let Vote::PublicVote(public_vote) = vote {
            public_vote.address == kuiil
        } else {
            false
        }
    });

    assert!(kuiil_vote.is_some());
    if let Some(Vote::PublicVote(public_vote)) = kuiil_vote {
        assert_eq!(public_vote.weight, 42);
        assert_eq!(public_vote.vote_choice, VoteChoice::Approve);
    }
}

#[test]
fn outcomes_execution() {
    let setup = create_test_data();
    let id = init_contract(&setup);

    setup.env.ledger().set_timestamp(1234567890);
    let voting_ends_at = 1234567890 + 3600 * 24 * 2;

    let title = String::from_str(&setup.env, "Test Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &Some(setup.outcomes_id),
    );

    // Add member with badge
    let kuiil = Address::generate(&setup.env);
    setup.token_stellar.mint(&kuiil, &(10 * 10_000_000));
    let meta = String::from_str(&setup.env, "test");
    setup
        .contract
        .add_member(&kuiil, &meta, &None, &None, &None, &None, &None, &None);
    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .set_badges(&setup.mando, &id, &kuiil, &badges);

    setup.contract.vote(
        &setup.mando,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    setup.contract.vote(
        &kuiil,
        &id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: kuiil.clone(),
            weight: Badge::Community as u32,
            vote_choice: VoteChoice::Approve,
        }),
    );

    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);
    assert_eq!(vote_result, ProposalStatus::Approved);

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Approved);
}
