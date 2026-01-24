extern crate std;
use super::test_utils::create_test_data;
use crate::errors::ContractErrors;
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::testutils::{Address as _, Ledger as _};
use soroban_sdk::{Address, String};
use std::format;

#[test]
fn test_add_member_with_valid_git_identity() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id = String::from_str(env, "github:alice");

    // Generate Ed25519 keypair for Git identity
    let mut rng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut rng);
    let verifying_key = signing_key.verifying_key();
    let pubkey_hex = hex::encode(verifying_key.to_bytes());

    // Prepare the message for signing
    // Stellar Signed Message\n{passphrase}\n{address}\n{nonce}\ntansu-bind|{contractId}|{gitId}
    let passphrase = "Test SDF Network ; September 2015";
    let addr_str = member.to_string();

    let mut addr_buf = [0u8; 128];
    addr_str.copy_into_slice(&mut addr_buf[..addr_str.len() as usize]);
    let addr_string = core::str::from_utf8(&addr_buf[..addr_str.len() as usize]).unwrap();

    let nonce = "00000000000000000000000000000000";
    let payload = "tansu-bind|TANSU|github:alice";
    let msg = format!(
        "Stellar Signed Message\n{}\n{}\n{}\n{}",
        passphrase, addr_string, nonce, payload
    );

    // Sign the message
    let signature = signing_key.sign(msg.as_bytes());
    let sig_hex = hex::encode(signature.to_bytes());

    // Set network passphrase in env to match
    let passphrase_bytes = soroban_sdk::Bytes::from_slice(env, passphrase.as_bytes());
    let passphrase_hash = env.crypto().sha256(&passphrase_bytes);

    // In current Soroban SDK, we can set network id via Ledger trait from testutils
    env.ledger().set_network_id(passphrase_hash.into());

    // Add member with Git identity
    setup.contract.add_member(
        &member,
        &meta,
        &Some(git_id.clone()),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );

    // Verify member info
    let info = setup.contract.get_member(&member);
    assert_eq!(info.git_identity, Some(git_id));
    assert_eq!(info.git_pubkey, Some(String::from_str(env, &pubkey_hex)));
}

#[test]
fn test_add_member_with_invalid_git_signature() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id = String::from_str(env, "github:alice");

    let pubkey_hex = "0".repeat(64);
    let msg = "some message";
    let sig_hex = "0".repeat(128);

    let result = setup.contract.try_add_member(
        &member,
        &meta,
        &Some(git_id),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );

    // This should fail because the signature is invalid
    assert!(result.is_err());
}
#[test]
fn test_add_member_mismatched_git_id() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id_arg = String::from_str(env, "github:bob"); // Different from message

    let mut rng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut rng);
    let pubkey_hex = hex::encode(signing_key.verifying_key().to_bytes());

    let passphrase = "Test SDF Network ; September 2015";
    let addr_string = member.to_string();
    let nonce = "00000000000000000000000000000000";
    let payload = "tansu-bind|TANSU|github:alice"; // Message says alice
    let msg = format!(
        "Stellar Signed Message\n{}\n{}\n{}\n{}",
        passphrase, addr_string, nonce, payload
    );

    let signature = signing_key.sign(msg.as_bytes());
    let sig_hex = hex::encode(signature.to_bytes());

    let passphrase_hash = env
        .crypto()
        .sha256(&soroban_sdk::Bytes::from_slice(env, passphrase.as_bytes()));
    env.ledger().set_network_id(passphrase_hash.into());

    let result = setup.contract.try_add_member(
        &member,
        &meta,
        &Some(git_id_arg),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );

    assert_eq!(
        result.err().unwrap().unwrap(),
        ContractErrors::InvalidEnvelope.into()
    );
}

#[test]
fn test_add_member_wrong_network() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id = String::from_str(env, "github:alice");

    let mut rng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut rng);
    let pubkey_hex = hex::encode(signing_key.verifying_key().to_bytes());

    let passphrase = "Wrong Network Passphrase";
    let addr_string = member.to_string();
    let nonce = "00000000000000000000000000000000";
    let payload = "tansu-bind|TANSU|github:alice";
    let msg = format!(
        "Stellar Signed Message\n{}\n{}\n{}\n{}",
        passphrase, addr_string, nonce, payload
    );

    let signature = signing_key.sign(msg.as_bytes());
    let sig_hex = hex::encode(signature.to_bytes());

    // Set network to something else
    let real_passphrase = "Test SDF Network ; September 2015";
    let passphrase_hash = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(
        env,
        real_passphrase.as_bytes(),
    ));
    env.ledger().set_network_id(passphrase_hash.into());

    let result = setup.contract.try_add_member(
        &member,
        &meta,
        &Some(git_id),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );

    assert_eq!(
        result.err().unwrap().unwrap(),
        ContractErrors::InvalidEnvelope.into()
    );
}

#[test]
#[should_panic(expected = "Message too long")]
fn test_add_member_message_too_long() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id = String::from_str(env, "github:alice");

    let mut rng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut rng);
    let pubkey_hex = hex::encode(signing_key.verifying_key().to_bytes());

    let long_payload = "a".repeat(1100);
    let msg = format!(
        "Stellar Signed Message\nTest\nAddr\nNonce\n{}",
        long_payload
    );
    let signature = signing_key.sign(msg.as_bytes());
    let sig_hex = hex::encode(signature.to_bytes());

    setup.contract.add_member(
        &member,
        &meta,
        &Some(git_id),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );
}

#[test]
fn test_add_member_invalid_payload_format() {
    let setup = create_test_data();
    let env = &setup.env;

    let member = Address::generate(env);
    let meta = String::from_str(env, "some_meta");
    let git_id = String::from_str(env, "github:alice");

    let mut rng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut rng);
    let pubkey_hex = hex::encode(signing_key.verifying_key().to_bytes());

    let passphrase = "Test SDF Network ; September 2015";
    let addr_string = member.to_string();
    let nonce = "00000000000000000000000000000000";
    let payload = "invalid-format|TANSU|github:alice"; // Should start with tansu-bind|
    let msg = format!(
        "Stellar Signed Message\n{}\n{}\n{}\n{}",
        passphrase, addr_string, nonce, payload
    );

    let signature = signing_key.sign(msg.as_bytes());
    let sig_hex = hex::encode(signature.to_bytes());

    let passphrase_hash = env
        .crypto()
        .sha256(&soroban_sdk::Bytes::from_slice(env, passphrase.as_bytes()));
    env.ledger().set_network_id(passphrase_hash.into());

    let result = setup.contract.try_add_member(
        &member,
        &meta,
        &Some(git_id),
        &Some(String::from_str(env, &pubkey_hex)),
        &Some(String::from_str(env, &msg)),
        &Some(String::from_str(env, &sig_hex)),
    );

    assert_eq!(
        result.err().unwrap().unwrap(),
        ContractErrors::InvalidEnvelope.into()
    );
}
