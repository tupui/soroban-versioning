use super::test_utils::{create_test_data, init_contract};
use crate::{
    errors::ContractErrors,
    types::{AnonymousVote, Badge, Dao, ProposalStatus, PublicVote, Vote, VoteChoice},
};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, BytesN, String, vec};

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

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &true);

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

    setup.env.ledger().set_timestamp(voting_ends_at + 1);
    let result = setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);

    assert_eq!(result, ProposalStatus::Cancelled);
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

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &true);
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
    setup.contract.anonymous_voting_setup(&id, &public_key);

    // Add a member with elevated rights
    let kuiil = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "abcd");
    setup.contract.add_member(&kuiil, &meta);
    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .add_badges(&setup.mando, &id, &kuiil, &badges);

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &false);
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
            &vec![&setup.env, 0u32, 0u32, 1u32],
            &vec![&setup.env, 0u32, 0u32, 0u32],
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
            &vec![&setup.env, 3u32, 1u32, 1u32],
            &vec![&setup.env, 5u32, 4u32, 6u32],
        ),
    });
    setup.contract.vote(&kuiil, &id, &proposal_id, &vote_);

    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = setup.contract.execute(
        &setup.grogu,
        &id,
        &proposal_id,
        &Some(vec![&setup.env, 9u32, 3u32, 500003u32]),
        &Some(vec![&setup.env, 15u32, 12u32, 18u32]),
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

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &true);

    // Start testing bad behaviours

    // Not initialized private voting
    let error = setup
        .contract
        .try_create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &false)
        .unwrap_err()
        .unwrap();
    assert_eq!(error, ContractErrors::NoAnonymousVotingConfig.into());

    let public_key = String::from_str(&setup.env, "public key random");
    setup.contract.anonymous_voting_setup(&id, &public_key);

    let proposal_id_anonymous =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &false);

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
    setup.contract.add_member(&kuiil, &meta);

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
            &Some(vec![&setup.env, 9u32, 3u32, 500003u32]),
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
            &Some(vec![&setup.env, 0u32, 0u32, 500_001u32]), // 500_000u32
            &Some(vec![&setup.env, 0u32, 0u32, 0u32]),
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

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.grogu, &id, &title, &ipfs, &voting_ends_at, &true);

    // Add member with badge
    let kuiil = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test");
    setup.contract.add_member(&kuiil, &meta);
    let badges = vec![&setup.env, Badge::Community];
    setup
        .contract
        .add_badges(&setup.mando, &id, &kuiil, &badges);

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

    let proposal_id =
        setup
            .contract
            .create_proposal(&setup.mando, &id, &title, &ipfs, &voting_ends_at, &true);

    let kuiil = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test");
    setup.contract.add_member(&kuiil, &meta);

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
        .add_badges(&setup.mando, &id, &kuiil, &badges);

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
