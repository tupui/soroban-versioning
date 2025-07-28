use super::test_utils::{create_test_data, init_contract};
use crate::{
    errors::ContractErrors,
    types::{Badge, Dao, ProposalStatus, PublicVote, Vote, VoteChoice},
};
use soroban_sdk::testutils::{Address as _, Ledger, arbitrary::std::println};
use soroban_sdk::{Address, String, vec};

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

    let cost = setup.env.cost_estimate().budget();
    println!("{cost:#?}");
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

    // Vote successfully
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

    // Too early to execute
    let err = setup
        .contract
        .try_execute(&setup.mando, &id, &proposal_id, &None, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProposalVotingTime.into());

    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    let vote_result = setup
        .contract
        .execute(&setup.mando, &id, &proposal_id, &None, &None);
    assert_eq!(vote_result, ProposalStatus::Approved);

    let proposal = setup.contract.get_proposal(&id, &proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Approved);

    // Already executed
    let err = setup
        .contract
        .try_execute(&setup.mando, &id, &proposal_id, &None, &None)
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
