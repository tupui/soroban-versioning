use super::test_utils::{create_test_data, init_contract};
use crate::types::{Badge, PublicVote, Vote, VoteChoice};
use soroban_sdk::testutils::{Address as _, Ledger, arbitrary::std::println};
use soroban_sdk::{Address, String, vec};

#[test]
fn test_cost_register_project() {
    let setup = create_test_data();
    let _project_id = init_contract(&setup);

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - register_project");
    println!("{budget:#?}");
}

#[test]
fn test_cost_create_proposal() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Test Proposal for Cost Analysis");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 7; // 7 days

    setup.contract.create_proposal(
        &setup.grogu,
        &project_id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true, // anonymous voting
        &Some(setup.outcomes_id),
    );

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - create_proposal");
    println!("{budget:#?}");
}

#[test]
fn test_cost_vote_on_proposal() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Test Proposal for Voting Cost");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 7;

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &project_id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &Some(setup.outcomes_id),
    );

    setup.contract.vote(
        &setup.mando,
        &project_id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - vote_on_proposal");
    println!("{budget:#?}");
}

#[test]
fn test_cost_execute_proposal() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let title = String::from_str(&setup.env, "Test Proposal for Execution Cost");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 7;

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &project_id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &Some(setup.outcomes_id),
    );

    // Vote to make it executable
    setup.contract.vote(
        &setup.mando,
        &project_id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // Move past voting deadline
    setup.env.ledger().set_timestamp(voting_ends_at + 1);

    setup
        .contract
        .execute(&setup.mando, &project_id, &proposal_id, &None, &None);

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - execute_proposal");
    println!("{budget:#?}");
}

#[test]
fn test_cost_multiple_proposals_flow() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let outcomes_contract = setup.outcomes_id;

    let num_proposals = 3;
    println!("Cost Estimate - multiple_proposals_flow");

    // Create multiple proposals
    for _i in 0..num_proposals {
        let title = String::from_str(&setup.env, "Test Proposal");
        let ipfs = String::from_str(
            &setup.env,
            "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
        );
        let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 7;

        setup.contract.create_proposal(
            &setup.grogu,
            &project_id,
            &title,
            &ipfs,
            &voting_ends_at,
            &true,
            &Some(outcomes_contract.clone()),
        );
    }

    // Vote on all proposals
    for i in 0..num_proposals {
        setup.contract.vote(
            &setup.mando,
            &project_id,
            &i,
            &Vote::PublicVote(PublicVote {
                address: setup.mando.clone(),
                weight: 1,
                vote_choice: VoteChoice::Approve,
            }),
        );
    }

    let budget = setup.env.cost_estimate().budget();
    println!("{budget:#?}");
}

#[test]
fn test_cost_add_member_and_badges() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let new_member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "New member for cost testing");

    setup.contract.add_member(&new_member, &meta);

    let badges = vec![&setup.env, Badge::Verified];
    setup
        .contract
        .set_badges(&setup.grogu, &project_id, &new_member, &badges);

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - add_member_and_badges");
    println!("{budget:#?}");
}

#[test]
fn test_cost_commit_hash() {
    let setup = create_test_data();
    let project_id = init_contract(&setup);

    let hash = String::from_str(&setup.env, "6663520bd9e6ede248fef8157b2af0b6b6b41046");
    setup.contract.commit(&setup.mando, &project_id, &hash);

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - commit_hash");
    println!("{budget:#?}");
}

#[test]
fn test_cost_comprehensive_dao_workflow() {
    let setup = create_test_data();

    // Step 1: Register project
    let project_id = init_contract(&setup);

    // Step 2: Add additional members
    let member1 = Address::generate(&setup.env);
    let member2 = Address::generate(&setup.env);
    setup.token_stellar.mint(&member1, &(110 * 10_000_000));
    setup.token_stellar.mint(&member2, &(110 * 10_000_000));

    setup
        .contract
        .add_member(&member1, &String::from_str(&setup.env, "Member 1"));
    setup
        .contract
        .add_member(&member2, &String::from_str(&setup.env, "Member 2"));

    // Step 3: Create proposal
    let title = String::from_str(&setup.env, "Comprehensive Workflow Proposal");
    let ipfs = String::from_str(
        &setup.env,
        "bafybeib6ioupho3p3pliusx7tgs7dvi6mpu2bwfhayj6w6ie44lo3vvc4i",
    );
    let voting_ends_at = setup.env.ledger().timestamp() + 3600 * 24 * 7;

    let proposal_id = setup.contract.create_proposal(
        &setup.grogu,
        &project_id,
        &title,
        &ipfs,
        &voting_ends_at,
        &true,
        &Some(setup.outcomes_id),
    );

    // Step 4: Multiple votes
    setup.contract.vote(
        &setup.mando,
        &project_id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: setup.mando.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    setup.contract.vote(
        &member1,
        &project_id,
        &proposal_id,
        &Vote::PublicVote(PublicVote {
            address: member1.clone(),
            weight: 1,
            vote_choice: VoteChoice::Approve,
        }),
    );

    // Step 5: Execute proposal
    setup.env.ledger().set_timestamp(voting_ends_at + 1);
    setup
        .contract
        .execute(&setup.mando, &project_id, &proposal_id, &None, &None);

    // Step 6: Commit new hash
    let hash = String::from_str(&setup.env, "abc123def456789");
    setup.contract.commit(&setup.mando, &project_id, &hash);

    let budget = setup.env.cost_estimate().budget();
    println!("Cost Estimate - comprehensive_dao_workflow");
    println!("{budget:#?}");
}
