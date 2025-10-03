# Tansu - Soroban Governance dApp

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

## ✨ Features

- **Project Management**: Registration, configuration, and version tracking
- **Governance System**: Proposal creation, voting, and execution
- **Membership Management**: Badge assignment and role-based access
- **Anonymous Voting**: BLS12-381 cryptographic voting with privacy
- **IPFS Integration**: Decentralized content storage
- **Responsive Design**: Mobile and desktop optimized interface

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 20.0 or higher
- **Bun**: Latest stable version
- **Git**: For version control

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

   Configure the following environment variables:

   ```bash
   # Network Configuration
   PUBLIC_SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
   PUBLIC_SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
   PUBLIC_HORIZON_URL="https://horizon-testnet.stellar.org"

   # Contract Addresses
   PUBLIC_TANSU_CONTRACT_ID="CBCXMB3JKKDOYHMBIBH3IQDPVCLHV4LQPCYA2LPKLLQ6JNJHAYPCUFAN"
   PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID="CAQWEZNN5X7LFD6PZBQXALVH4LSJW2KGNDMFJBQ3DWHXUVQ2JIZ6AQU6"

   # Development Settings
   PUBLIC_DEFAULT_FEE="100000"
   PUBLIC_DEFAULT_TIMEOUT=30
   ```

4. **Start development server**:

   ```bash
   bun dev
   ```

5. **Open your browser**: Navigate to `http://localhost:4321`

## 🔧 Development

### Available Scripts

```bash
# Development
bun dev              # Start development server
bun run build        # Build for production
bun run preview      # Preview production build

# Testing
bun test             # Run Playwright tests
bun run test:ui      # Run tests with UI
bun run test:debug   # Debug test failures

# Code Quality
bun run lint         # ESLint + Prettier check
bun run format       # Format code
bun run typecheck    # TypeScript type checking
bun run validate-errors # Validate contract error mapping
```

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

## 🧪 Testing

### Test Strategy

- **End-to-End Tests**: Playwright-based UI flow testing
- **Component Testing**: React component unit tests
- **Integration Testing**: Service layer and API testing
- **Mock Infrastructure**: Network and blockchain interaction mocking

### Running Tests

```bash
# Run all tests
bun test

# Run specific test suites
bun test --grep "governance"
bun test --grep "membership"

# Run tests with UI
bun run test:ui

# Debug test failures
bun run test:debug
```

### Test Coverage

- **User Flows**: Complete user journey testing
- **Error Scenarios**: Edge cases and failure handling
- **Performance**: Load time and responsiveness validation
- **Accessibility**: Screen reader and keyboard navigation testing

## 🚀 Deployment

### Testnet Deployment

```bash
# Build the application
bun run build

# Deploy to Netlify (or your preferred platform)
# The build output is in the `dist/` directory
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

- `PUBLIC_SOROBAN_NETWORK_PASSPHRASE`
- `PUBLIC_SOROBAN_RPC_URL`
- `PUBLIC_HORIZON_URL`
- `PUBLIC_TANSU_CONTRACT_ID`
- `PUBLIC_SOROBAN_DOMAIN_CONTRACT_ID`

## 🔒 Security

### Security Features

- **Non-custodial Design**: Private keys never leave user's wallet
- **Input Validation**: Comprehensive validation with Zod schemas
- **XSS Protection**: DOMPurify sanitization on all user content
- **Transaction Simulation**: All contract calls simulated before signing
- **Error Handling**: Graceful handling of failures and edge cases

### Best Practices

- **No Secrets in Code**: All sensitive data via environment variables
- **Type Safety**: Full TypeScript coverage for all components
- **Input Sanitization**: All user inputs properly validated and sanitized
- **Error Boundaries**: React error boundaries for graceful failure handling

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Guidelines

1. **Follow the Rules**: Adhere to the [tansu-rules](../../tansu-rules.md)
2. **Code Quality**: Use TypeScript, follow linting rules, and write tests
3. **Component Design**: Follow established patterns and use FlowProgressModal for flows
4. **Testing**: Ensure all tests pass and add tests for new features

### Code Style

- **TypeScript**: Strict mode enabled, no `any` types
- **React**: Functional components with hooks only
- **Styling**: Tailwind CSS with consistent class ordering
- **Naming**: Descriptive names, consistent conventions

## 📚 Documentation

- **[User Guide](https://docs.tansu.dev/using_the_dapp)**: How to use the dApp
- **[Developer Docs](https://docs.tansu.dev/developers/architecture)**: Technical architecture
- **[API Reference](https://docs.tansu.dev/developers/on_chain)**: Smart contract functions
- **[Component Usage](FLOW_COMPONENT_USAGE.md)**: FlowProgressModal usage guide

## 🌐 Networks

### Testnet (Current)

- **Network**: Stellar Testnet
- **Passphrase**: "Test SDF Network ; September 2015"
- **RPC URL**: `https://soroban-testnet.stellar.org`
- **Contract ID**: `CBCXMB3JKKDOYHMBIBH3IQDPVCLHV4LQPCYA2LPKLLQ6JNJHAYPCUFAN`

### Mainnet (Planned)

- **Network**: Stellar Mainnet
- **Passphrase**: "Public Global Stellar Network ; September 2015"
- **RPC URL**: `https://soroban-mainnet.stellar.org`
- **Launch**: Q2 2025 (after security audits)

## 🐛 Troubleshooting

### Common Issues

1. **Bun Installation**: Ensure Bun is properly installed and in PATH
2. **Dependencies**: Clear `node_modules` and reinstall with `bun install`
3. **Environment**: Verify all environment variables are set correctly
4. **Network**: Check Stellar testnet connectivity and RPC endpoints

### Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/tupui/soroban-versioning/issues)
- **Discord**: Join the [Tansu community](https://discord.gg/tansu)
- **Documentation**: Check the [docs](https://docs.tansu.dev) for detailed guides

---

**The Tansu dApp is the frontend interface for decentralized open source governance. Join us in building the future!** 🚀
