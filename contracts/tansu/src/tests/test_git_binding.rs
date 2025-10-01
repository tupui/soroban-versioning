use super::test_utils::{create_test_data, init_contract};
use crate::errors::ContractErrors;
use crate::types;
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
    let msg = create_basic_valid_envelope(&setup.env);  // Use proper SEP-53 envelope
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

// Helper function to create a basic valid envelope for testing
fn create_basic_valid_envelope(env: &soroban_sdk::Env) -> Bytes {
    Bytes::from_slice(env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123456789012345678901234567890123456789012345678\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:testuser")
}

// Helper function to create a valid envelope for github:testuser1
fn create_github_testuser1_envelope(env: &soroban_sdk::Env) -> Bytes {
    Bytes::from_slice(env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123456789012345678901234567890123456789012345678\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:testuser1")
}

// Helper function to create a valid envelope for gitlab:testuser2  
fn create_gitlab_testuser2_envelope(env: &soroban_sdk::Env) -> Bytes {
    Bytes::from_slice(env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123456789012345678901234567890123456789012345678\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|gitlab:testuser2")
}

#[test]
fn test_sep53_validation_wrong_header() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Wrong header
    let msg = Bytes::from_slice(&setup.env, b"Wrong Header\nTest SDF Network ; September 2015\nGABC123...\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:testuser");

    let error = setup
        .contract
        .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidSep53Header.into());
}

#[test]
fn test_sep53_validation_wrong_passphrase() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Wrong network passphrase
    let msg = Bytes::from_slice(&setup.env, b"Stellar Signed Message\nWrong Network Passphrase\nGABC123...\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:testuser");

    let error = setup
        .contract
        .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidNetworkPassphrase.into());
}

#[test]
fn test_sep53_validation_wrong_line_count() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Only 3 lines instead of 5
    let msg = Bytes::from_slice(&setup.env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123...");

    let error = setup
        .contract
        .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidSep53Header.into());
}

#[test]
fn test_tansu_bind_payload_validation_wrong_prefix() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Wrong prefix in payload line
    let msg = Bytes::from_slice(&setup.env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123...\n1234567890abcdef1234567890abcdef\nwrong-bind|CONTRACT123|github:testuser");

    let error = setup
        .contract
        .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidTansuBindPayload.into());
}

#[test]
fn test_tansu_bind_payload_validation_identity_mismatch() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Different git identity in payload vs parameter
    let msg = Bytes::from_slice(&setup.env, b"Stellar Signed Message\nTest SDF Network ; September 2015\nGABC123...\n1234567890abcdef1234567890abcdef\ntansu-bind|CONTRACT123|github:otheruser");

    let error = setup
        .contract
        .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::InvalidTansuBindPayload.into());
}

#[test]
fn test_git_identity_format_validation() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = create_basic_valid_envelope(&setup.env);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Test various invalid formats
    let invalid_identities = [
        "",                    // Empty
        "github",              // No colon
        "github:",             // No username
        ":testuser",           // No provider
        "github:user:extra",   // Multiple colons
        "invalidprovider:user", // Invalid provider
        "a",                   // Too short
    ];

    for invalid_identity in invalid_identities {
        let git_identity = String::from_str(&setup.env, invalid_identity);
        
        let error = setup
            .contract
            .try_add_member_with_git(&member, &meta, &git_identity, &git_pubkey, &msg, &sig)
            .unwrap_err()
            .unwrap();
        
        assert_eq!(error, ContractErrors::InvalidTansuBindPayload.into());
    }
}

#[test]
fn test_both_providers_accepted() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member1 = Address::generate(&setup.env);
    let member2 = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // Test GitHub
    let github_identity = String::from_str(&setup.env, "github:testuser1");
    let github_msg = create_github_testuser1_envelope(&setup.env);
    
    setup.contract.add_member_with_git(&member1, &meta, &github_identity, &git_pubkey, &github_msg, &sig);

    // Test GitLab
    let gitlab_identity = String::from_str(&setup.env, "gitlab:testuser2");
    let gitlab_msg = create_gitlab_testuser2_envelope(&setup.env);
    
    setup.contract.add_member_with_git(&member2, &meta, &gitlab_identity, &git_pubkey, &gitlab_msg, &sig);

    // Both should be registered successfully
    let member1_data = setup.contract.get_member(&member1);
    let member2_data = setup.contract.get_member(&member2);
    
    assert_eq!(member1_data.git_provider_username.unwrap(), github_identity);
    assert_eq!(member2_data.git_provider_username.unwrap(), gitlab_identity);
}

#[test]
fn test_race_condition_handle_conflict() {
    let setup = create_test_data();
    let _id = init_contract(&setup);

    let member1 = Address::generate(&setup.env);
    let member2 = Address::generate(&setup.env);
    let meta = String::from_str(&setup.env, "test member");
    let git_identity = String::from_str(&setup.env, "github:testuser");
    let git_pubkey = BytesN::from_array(&setup.env, &[1u8; 32]);
    let msg = create_basic_valid_envelope(&setup.env);
    let sig = BytesN::from_array(&setup.env, &[2u8; 64]);

    // First user successfully registers
    setup.contract.add_member_with_git(&member1, &meta, &git_identity, &git_pubkey, &msg, &sig);
    
    // Second user tries to register with same handle (simulating race condition)
    let msg2 = create_basic_valid_envelope(&setup.env);
    let error = setup
        .contract
        .try_add_member_with_git(&member2, &meta, &git_identity, &git_pubkey, &msg2, &sig)
        .unwrap_err()
        .unwrap();
    
    assert_eq!(error, ContractErrors::GitHandleTaken.into());
    
    // First user should still be registered
    let member1_data = setup.contract.get_member(&member1);
    assert_eq!(member1_data.git_provider_username.unwrap(), git_identity);
    
    // Second user should not be registered
    let member2_result = setup.contract.try_get_member(&member2);
    assert!(member2_result.is_err());
}