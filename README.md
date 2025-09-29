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
- **🌍 Domain Integration**: Soroban Domains prevent name squatting and ensure authenticity
- **📁 IPFS Storage**: Decentralized content storage for proposals and project metadata
- **🔒 Privacy-First**: Optional anonymous voting with cryptographic commitment schemes
- **⚡ Real-time Events**: Instant updates through blockchain event streaming
- **🚀 Launchtube Integration**: Simplified transaction submission without XLM fees

## 🚀 Launchtube Integration

Tansu integrates with [Launchtube](https://github.com/stellar/launchtube) to simplify Soroban transaction submission. Launchtube eliminates the need for XLM fees and handles transaction complexity automatically.

### Benefits
- **No XLM Required**: Launchtube pays transaction fees using its own reserves
- **Automatic Retries**: Built-in retry logic for network issues  
- **Better UX**: Faster and more reliable transaction submission
- **Easy Setup**: Just add a token to your environment configuration

### Quick Setup
1. Get a testnet token from [testnet.launchtube.xyz/gen](https://testnet.launchtube.xyz/gen)
2. Add to your `.env` file:
   ```bash
   PUBLIC_USE_LAUNCHTUBE="true"
   PUBLIC_LAUNCHTUBE_TOKEN="your-jwt-token-here"
   ```
3. Restart your development server

For detailed setup instructions, see [dapp/LAUNCHTUBE.md](dapp/LAUNCHTUBE.md).

> **Note**: Launchtube integration is optional and can be easily disabled. The system automatically falls back to direct RPC submission if Launchtube is unavailable.