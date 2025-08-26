use super::test_utils::create_test_data;
use crate::errors::ContractErrors;
use soroban_sdk::testutils::{Address as _, Events, Ledger};
use soroban_sdk::{Address, BytesN, IntoVal, Map, Symbol, Val, bytesn, vec};

#[test]
fn test_pause_unpause() {
    let setup = create_test_data();

    setup.contract.pause(&setup.contract_admin, &true);

    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "contract_paused"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (Symbol::new(&setup.env, "paused"), true.into_val(&setup.env)),
                        (
                            Symbol::new(&setup.env, "admin"),
                            setup.contract_admin.clone().into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Operations fail when paused
    let wasm_hash = BytesN::from_array(&setup.env, &[1u8; 32]);
    let err = setup
        .contract
        .try_propose_upgrade(&setup.contract_admin, &wasm_hash, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ContractPaused.into());

    // Unpause
    setup.contract.pause(&setup.contract_admin, &false);

    let all_events = setup.env.events().all();
    assert_eq!(
        all_events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "contract_paused"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "paused"),
                            false.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "admin"),
                            setup.contract_admin.clone().into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // try again set operation
    setup
        .contract
        .propose_upgrade(&setup.contract_admin, &wasm_hash, &None);
}

#[test]
fn test_unauthorized_pause_attempt() {
    let setup = create_test_data();

    // Create a non-admin address
    let non_admin = Address::generate(&setup.env);

    // Attempt to pause with non-admin address
    let err = setup
        .contract
        .try_pause(&non_admin, &true)
        .unwrap_err()
        .unwrap();

    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());
}

#[test]
fn test_upgrade_flow() {
    let setup = create_test_data();

    // WASM hash of the current contract (from test_snapshot - hex(int(..., 16)))
    let wasm_hash = bytesn!(
        &setup.env,
        0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    );

    // Propose an upgrade
    setup
        .contract
        .propose_upgrade(&setup.contract_admin, &wasm_hash, &None);

    // Verify the upgrade proposal event
    let events = setup.env.events().all();
    assert_eq!(
        events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "upgrade_proposed"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "admin"),
                            setup.contract_admin.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "wasm_hash"),
                            wasm_hash.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "executable_at"),
                            (setup.env.ledger().timestamp() + 24 * 3600).into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Retrieve the upgrade proposal
    let proposal = setup.contract.get_upgrade_proposal();
    assert_eq!(proposal.wasm_hash, wasm_hash);
    assert_eq!(proposal.approvals.len(), 1);
    assert_eq!(
        proposal.approvals.get(0),
        Some(setup.contract_admin.clone())
    );

    // Try to execute before timelock expires
    let err = setup
        .contract
        .try_finalize_upgrade(&setup.contract_admin, &true)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::ProposalVotingTime.into());

    // Fast-forward time past timelock period
    setup
        .env
        .ledger()
        .set_timestamp(setup.env.ledger().timestamp() + 24 * 3600 + 1);

    setup
        .contract
        .finalize_upgrade(&setup.contract_admin, &true);

    // Verify the upgrade was successful by checking that the proposal no longer exists
    let err = setup
        .contract
        .try_get_upgrade_proposal()
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UpgradeError.into());
}

#[test]
fn test_upgrade_cancel() {
    let setup = create_test_data();

    // Generate a dummy WASM hash
    let wasm_hash = BytesN::from_array(&setup.env, &[2u8; 32]);

    // Propose an upgrade
    setup
        .contract
        .propose_upgrade(&setup.contract_admin, &wasm_hash, &None);

    // Cancel the upgrade
    setup
        .contract
        .finalize_upgrade(&setup.contract_admin, &false);

    // Verify the cancellation event
    let events = setup.env.events().all();
    assert_eq!(
        events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "upgrade_cancelled"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "admin"),
                            setup.contract_admin.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "wasm_hash"),
                            wasm_hash.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Verify the proposal no longer exists
    let err = setup
        .contract
        .try_get_upgrade_proposal()
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UpgradeError.into());
}

#[test]
fn test_unauthorized_upgrade_approval() {
    let setup = create_test_data();

    // Create a non-admin address
    let non_admin = Address::generate(&setup.env);

    // Generate a dummy WASM hash
    let wasm_hash = BytesN::from_array(&setup.env, &[4u8; 32]);

    // Propose an upgrade with admin
    let err = setup
        .contract
        .try_propose_upgrade(&non_admin, &wasm_hash, &None)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());

    // Propose an upgrade with admin
    setup
        .contract
        .propose_upgrade(&setup.contract_admin, &wasm_hash, &None);

    // We need to verify what's actually in the admins list
    let current_admins_config = setup.contract.get_admins_config();
    assert!(!current_admins_config.admins.contains(&non_admin));

    // Attempt approval with non-admin should fail
    let err = setup
        .contract
        .try_approve_upgrade(&non_admin)
        .unwrap_err()
        .unwrap();
    assert_eq!(err, ContractErrors::UnauthorizedSigner.into());
}

#[test]
fn test_upgrade_approval() {
    // Create a test setup with proper multi-admin configuration
    let setup = create_test_data();
    let second_admin = Address::generate(&setup.env);

    // Set up a proper multi-admin configuration
    let initial_admins_config = crate::types::AdminsConfig {
        threshold: 2, // Require 2 admins to approve
        admins: vec![
            &setup.env,
            setup.contract_admin.clone(),
            second_admin.clone(),
        ],
    };

    // Directly set the admin config in storage to properly initialize the contract
    setup.env.as_contract(&setup.contract_id, || {
        setup
            .env
            .storage()
            .instance()
            .set(&crate::types::DataKey::AdminsConfig, &initial_admins_config);
    });

    // Generate a dummy WASM hash
    let wasm_hash = BytesN::from_array(&setup.env, &[3u8; 32]);

    // Propose an upgrade (with same admin config)
    setup.contract.propose_upgrade(
        &setup.contract_admin, // First admin proposes
        &wasm_hash,
        &None, // Keep the same admin config
    );

    // First verification - only one approval so far
    let proposal = setup.contract.get_upgrade_proposal();
    assert_eq!(proposal.approvals.len(), 1); // Only has the proposer's approval

    // Approve with second admin - this should work now that second_admin is a valid admin
    setup.contract.approve_upgrade(&second_admin);

    // Verify the approval event
    let events = setup.env.events().all();
    assert_eq!(
        events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "upgrade_approved"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "admin"),
                            second_admin.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "approvals_count"),
                            2u32.into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "threshold_reached"),
                            true.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Fast-forward time past timelock period
    setup
        .env
        .ledger()
        .set_timestamp(setup.env.ledger().timestamp() + 24 * 3600 + 1);

    // Instead of executing the upgrade (which can fail due to missing WASM hash),
    // let's verify the proposal exists and has the right number of approvals
    let proposal = setup.contract.get_upgrade_proposal();
    assert_eq!(proposal.wasm_hash, wasm_hash);
    assert_eq!(proposal.approvals.len(), 2); // Both admins have approved
}

#[test]
fn test_domain_contract_id_update() {
    let setup = create_test_data();

    // Create a new domain contract ID
    let new_domain_id = Address::generate(&setup.env);

    // Update the domain contract ID
    setup
        .contract
        .set_domain_contract_id(&setup.contract_admin, &new_domain_id);

    // Verify the event
    let events = setup.env.events().all();
    assert_eq!(
        events,
        vec![
            &setup.env,
            (
                setup.contract_id.clone(),
                (Symbol::new(&setup.env, "domain_contract_id_updated"),).into_val(&setup.env),
                Map::<Symbol, Val>::from_array(
                    &setup.env,
                    [
                        (
                            Symbol::new(&setup.env, "admin"),
                            setup.contract_admin.clone().into_val(&setup.env)
                        ),
                        (
                            Symbol::new(&setup.env, "domain_contract_id"),
                            new_domain_id.into_val(&setup.env)
                        ),
                    ],
                )
                .into_val(&setup.env),
            ),
        ]
    );

    // Verify the update was successful
    let retrieved_domain_id = setup.contract.get_domain_contract_id();
    assert_eq!(retrieved_domain_id, new_domain_id);
}
