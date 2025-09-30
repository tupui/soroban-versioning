# Add Network Picker for Unified Deployment

## Problem

Previously, we had 2 separate deployments (testnet and mainnet) which created maintenance overhead and limited our ability to test UI changes across networks efficiently. Users couldn't easily switch between networks without separate deployment URLs.

## Solution

Implemented a unified deployment approach with runtime network selection:

### 🎯 Key Changes

- **Network Picker Component**: Added dropdown in navbar for switching between testnet/mainnet
- **Centralized Configuration**: Created `utils/networks.ts` for all network settings
- **Dynamic Service Creation**: All services (wallet kit, domain SDK, tansu client) now use current network config
- **CORS Fix**: Added development proxy for mainnet RPC endpoints
- **Footer Integration**: Stellar Explorer links now update based on selected network

### 🔧 Technical Implementation

1. **NetworkPicker Component** (`src/components/page/network/NetworkPicker.tsx`)
   - Clean dropdown with network status indicators
   - Visual feedback (green dot for mainnet, yellow for testnet)
   - Click-outside-to-close functionality

2. **Network Configuration** (`src/utils/networks.ts`)
   - Testnet and mainnet settings in one place
   - LocalStorage persistence for user choice
   - Helper functions for getting current network config

3. **Service Updates**
   - `stellar-wallets-kit.ts`: Dynamic wallet configuration
   - `soroban_domain_sdk.ts`: Network-aware domain SDK
   - `soroban_tansu.ts`: Dynamic contract client creation

4. **Development Proxy** (`astro.config.mjs`)
   - Solves CORS issues with mainnet RPC endpoints
   - Allows `x-client-name` header from Stellar SDK

### 🎨 UI/UX Features

- Network status indicators (Live/Test badges)
- Hover states and smooth transitions
- Accessible dropdown with proper focus management
- Integrated seamlessly into existing navbar layout

### ✅ Benefits

- **Single Deployment**: Easier maintenance and CI/CD
- **Full Flexibility**: Users can test both networks in same UI
- **Better DX**: Developers can switch networks without environment changes
- **Future-Proof**: Easy to add more networks if needed

### 🧪 Testing

- Switching networks reloads page with new configuration
- All contract calls use selected network
- Stellar Explorer links update correctly
- LocalStorage preserves user's network choice

## Before/After

**Before**: 2 separate deployments, hardcoded network settings
**After**: 1 deployment, runtime network selection with persistent user choice

---

Resolves the deployment complexity while maintaining full testing flexibility across networks.