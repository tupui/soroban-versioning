# Tansu - dApp

A decentralized application built on Soroban for governance and voting, powered by [Astro](https://astro.build/).

## 🏗️ Project Structure

```text
.
├── src/                    # Source code for the dApp
│   ├── components/         # UI components
│   │   ├── layout/        # Page layouts and navigation
│   │   ├── page/          # Page-specific components
│   │   └── utils/         # Utility components
│   ├── layouts/            # Astro page layouts
│   ├── pages/              # Astro pages and routing
│   ├── contracts/          # Contract interfaces and SDKs
│   ├── service/            # Contract interaction services
│   ├── utils/              # Utility functions and helpers
│   └── types/              # TypeScript type definitions
├── packages/               # Reusable packages
│   └── tansu/             # Core governance utilities
├── public/                 # Static assets and icons
├── tests/                  # End-to-end tests with Playwright
└── voting.ts               # Cryptographic voting utilities
```

## 🚀 Getting Started

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/tupui/soroban-versioning.git
   cd soroban-versioning/dapp
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Environment configuration**:

   ```bash
   cp .env.example .env
   ```

   All variables in `.env.example` are required. `PUBLIC_DELEGATION_API_URL` is used for IPFS upload flows.

See the [contributing guide](../CONTRIBUTING.md) for details about IPFS.

4. **Start development server**:

   ```bash
   bun dev
   ```

5. **Open your browser**: Navigate to `http://localhost:4321`

### Technology Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator
- **UI Library**: [React](https://react.dev/) - Interactive components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Package Manager**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Testing**: [Playwright](https://playwright.dev/) - End-to-end testing
- **Blockchain**: [Soroban](https://soroban.stellar.org/) - Stellar smart contracts

### Key Components

- **FlowProgressModal**: Standardized flow component for all user journeys
- **Contract Services**: Type-safe contract interaction layer
- **State Management**: Nanostores for reactive state management
- **Wallet Integration**: Stellar Wallets Kit for secure wallet connections
- **IPFS Services**: Decentralized content storage and retrieval
