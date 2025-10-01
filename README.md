# 🏛️ Tansu - Decentralized project governance on Stellar

[![SCF Awards](https://img.shields.io/badge/SCF-28,30-blue)](https://github.com/your-org/tansu)
[![Stellar Network](https://img.shields.io/badge/network-testnet-purple)](https://stellar.org)

Tansu provides cryptographic proof of code integrity and transparent governance for open-source projects. Built on
Stellar's Soroban platform, it offers immutable commit tracking, community-driven proposals, and privacy-preserving
voting mechanisms.

🌐 **Website**: [tansu.dev](https://tansu.dev)

---

## ✨ At a Glance

- **🔗 On-chain Version Control**: Immutable commit hash tracking
- **🗳️ Decentralized Governance**: Community proposals with public and anonymous voting
- **👥 Membership System**: Role-based access control with achievement badges
- **🔐 Git Identity Binding**: Link GitHub/GitLab accounts with Ed25519 cryptographic proof
- **🌍 Domain Integration**: Soroban Domains prevent name squatting and ensure authenticity
- **📁 IPFS Storage**: Decentralized content storage for proposals and project metadata
- **🔒 Privacy-First**: Optional anonymous voting with cryptographic commitment schemes
- **⚡ Real-time Events**: Instant updates through blockchain event streaming

## 🆕 New Feature: Git Identity Binding

Tansu now supports optional Git identity binding during member registration, allowing users to cryptographically prove ownership of their GitHub or GitLab accounts using Ed25519 signatures.

### How it works:

1. **Optional Flow**: During registration, users can choose to link their Git handle
2. **Provider Support**: Works with GitHub and GitLab accounts
3. **Key Selection**: Automatically fetches and displays user's Ed25519 public keys
4. **SEP-53 Signing**: Generates a Stellar Signed Message envelope for signing
5. **Cryptographic Proof**: Verifies Ed25519 signatures on-chain using Soroban's crypto module
6. **Handle Uniqueness**: Enforces case-insensitive global uniqueness of Git handles
7. **Reputation Building**: Linked accounts build verifiable reputation in the ecosystem

### Benefits:

- **Authenticity**: Cryptographic proof of Git account ownership
- **Reputation**: Build trust through verified Git contributions
- **Uniqueness**: Prevent handle squatting with case-insensitive validation
- **Backward Compatibility**: Existing registration flow unchanged for users who skip Git binding

### Technical Implementation:

The Git identity binding uses **SEP-53 (Stellar Signed Messages)** for secure authentication:

#### SEP-53 Envelope Format:
```
Stellar Signed Message
Test SDF Network ; September 2015
STELLAR_ACCOUNT_ADDRESS
RANDOM_NONCE
tansu-bind|CONTRACT_ID|PROVIDER:USERNAME
```

#### Validation Process:
1. **Message Generation**: Frontend creates a 5-line SEP-53 envelope
2. **Signature Creation**: User signs with their Git account's Ed25519 private key
3. **On-chain Verification**: Contract validates signature using Soroban's `crypto::ed25519_verify`
4. **Handle Normalization**: Converts handles to lowercase for case-insensitive uniqueness
5. **Storage**: Stores binding data (provider:username, pubkey, message, signature, timestamp)

#### Network Support:
- **Testnet**: `Test SDF Network ; September 2015`
- **Mainnet**: `Public Global Stellar Network ; September 2015`

The contract automatically detects the network and validates the appropriate passphrase.
