Closes #217

## Summary
Adds an **optional Git handle binding** during member registration. Users can skip the step or link `github|gitlab:<username>`, sign a **SEP-53** 5-line envelope with their Git Ed25519 key (SSH or GPG), and submit `{git_identity, git_pubkey, msg, sig}` in a single wallet-signed transaction.

## What's implemented
- **On-chain security**
  - Enabled `ed25519_verify(pubkey, msg, sig)` in the contract (Soroban crypto) — invalid signatures are rejected.
  - Full SEP-53 envelope checks: header, network passphrase (pubnet/testnet), invoker account, 32-hex nonce, `tansu-bind|<contractId>|<provider:username>` payload.
- **Frontend flow**
  - Real values for passphrase, invoker, contractId.
  - SSH/GPG signing commands shown; signature parsed and verified client-side (only enables **Join** after success).
- **Uniqueness**
  - Case-insensitive global uniqueness for handles; original case stored for display; conflicts return `GitHandleTaken`.
- **Profile UX**
  - Data stored to render `<provider>:<username>` as **Verified**; shows **Not linked** when absent.
- **Tests**
  - SEP-53 line-by-line validation (bad header/passphrase/account/nonce/payload).
  - Invalid signature rejection.
  - Race/conflict on same handle.
  - Existing tests still pass.

## Notes for reviewers
- PR uses a **single wallet signature** after embedding `{git_identity, git_pubkey, msg, sig}`.
- Uses official user-keys endpoints (GitHub/GitLab) to fetch **ssh-ed25519** keys.
- Follows SEP-53 "Stellar Signed Message" format and Soroban's on-chain Ed25519 verify.

## Key Files Changed
- `contracts/tansu/src/contract_membership.rs` - Enabled Ed25519 verification and SEP-53 validation
- `contracts/tansu/src/types.rs` - Added network passphrase constants
- `contracts/tansu/src/tests/test_git_binding.rs` - Comprehensive test coverage
- `dapp/src/components/page/dashboard/GitIdentityBinding.tsx` - Real values + client-side verification
- `dapp/package.json` - Added noble-ed25519 dependency

## Security Features
✅ **Production-ready** - Ed25519 signature verification is now active and rejecting invalid signatures  
✅ **SEP-53 Compliant** - Full envelope format validation with official network passphrases  
✅ **Handle Security** - Unique handle enforcement with conflict detection  
✅ **User Experience** - Real-time signature verification in UI

## Screenshots / GIFs
_Screenshots can be added showing the Git identity binding flow, verification success states, and profile verification badges._

## Testing
All existing tests pass. New comprehensive test suite covers:
- SEP-53 envelope validation (each line validated separately)
- Ed25519 signature verification (invalid signatures properly rejected)
- Handle uniqueness and race conditions
- Git identity format validation
- Both GitHub and GitLab provider support

## PR URL
[To be filled after PR creation]