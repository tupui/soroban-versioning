use super::test_utils::{create_test_data, init_contract};
use crate::errors::ContractErrors;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, BytesN, String};

#[test]
fn test_add_member_with_git_happy_path() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = Bytes::from_array(&setup.env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123...\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:testuser");
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    setup.contract.add_member_with_git(
        &member, 
        &meta, 
        &git_identity, 
        &git_pubkey, 
        &msg, 
        &sig
    );

    // Verify member was added
    let stored_member = setup.contract.get_member(&member);
    assert_eq!(stored_member.meta, meta);
    assert!(stored_member.git_provider_username.is_some());
    
    assert_eq!(stored_member.git_provider_username.unwrap(), git_identity);
    assert_eq!(stored_member.git_pubkey_ed25519.unwrap(), git_pubkey);
    assert_eq!(stored_member.git_msg.unwrap(), msg);
    assert_eq!(stored_member.git_sig.unwrap(), sig);
    // Timestamp might be 0 in test environment, so just check it exists
    assert!(stored_member.git_signed_at.is_some());
}

#[test]
fn test_add_member_with_git_handle_conflict() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member1 = Address::generate(&setup.env);
    let member2 = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = Bytes::from_array(&setup.env, b"test message");
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // First member registers successfully
    setup.contract.add_member_with_git(
        &member1, 
        &meta, 
        &git_identity, 
        &git_pubkey, 
        &msg, 
        &sig
    );

    // Second member tries to register with same git handle - should fail
    let error = setup
        .contract
        .try_add_member_with_git(
            &member2, 
            &meta, 
            &git_identity, 
            &git_pubkey, 
            &msg, 
            &sig
        )
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::GitHandleTaken.into());
}

#[test]
fn test_add_member_with_git_invalid_identity() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, ""); // Empty identity
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = Bytes::from_array(&setup.env, b"test message");
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    let error = setup
        .contract
        .try_add_member_with_git(
            &member, 
            &meta, 
            &git_identity, 
            &git_pubkey, 
            &msg, 
            &sig
        )
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidTansuBindPayload.into());
}

#[test]
fn test_add_member_with_git_empty_message() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = Bytes::from_array(&setup.env, &[]); // Empty message
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    let error = setup
        .contract
        .try_add_member_with_git(
            &member, 
            &meta, 
            &git_identity, 
            &git_pubkey, 
            &msg, 
            &sig
        )
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidSep53Header.into());
}

#[test]
fn test_add_member_without_git_still_works() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");

    // Original add_member should still work
    setup.contract.add_member(&member, &meta);

    let stored_member = setup.contract.get_member(&member);
    assert_eq!(stored_member.meta, meta);
    assert!(stored_member.git_provider_username.is_none()); // No git identity
}