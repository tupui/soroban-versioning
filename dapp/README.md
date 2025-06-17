# Tansu - Soroban Governance dApp

A decentralized application built on Soroban for governance and voting, powered by [Astro](https://astro.build/).

## Project Structure

```text
.
├── src/                    # Source code for the dApp
│   ├── components/         # UI components
│   ├── layouts/            # Page layouts
│   ├── pages/              # Astro pages
│   ├── contracts/          # Contract interfaces
│   ├── service/            # Contract interaction services
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── packages/               # Reusable packages
│   └── tansu/              # Core governance utilities
├── public/                 # Static assets
└── voting.ts               # Cryptographic voting utilities
```

## Features

- Project management
- Proposal creation and voting
- Governance dashboard
- Secure cryptographic voting with BLS12-381 curve
- IPFS integration for decentralized storage

## Getting Started

1. Clone the repository
2. Create environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the development server:
   ```bash
   bun dev
   ```

## Technology Stack

- Astro: Core framework
- React: Interactive components
- TypeScript: Type-safe development
- Tailwind CSS: Styling
- Soroban: Smart contract platform
- IPFS: Decentralized storage
