# Launchtube Integration

This document explains how to set up and use Launchtube for simplified Soroban transaction submission in the Tansu dApp.

## What is Launchtube?

Launchtube is a service that handles the complexity of submitting Soroban transactions to the Stellar network. It eliminates the need for:

- Managing XLM for transaction fees
- Handling sequence numbers
- Implementing retry logic
- Managing rate limits and network timeouts

## Benefits

- **No XLM Required**: Launchtube pays transaction fees using its own XLM reserves
- **Simplified Flow**: Just sign and submit - no fee management needed
- **Automatic Retries**: Built-in retry logic for network issues
- **Rate Limiting**: Handles Stellar network rate limits automatically
- **Better UX**: Faster and more reliable transaction submission

## Setup

### 1. Install Dependencies

If you encounter TypeScript errors, you may need to install React types:

```bash
# Using bun
bun add -D @types/react @types/react-dom
bun add react react-dom

# Using npm
npm install -D @types/react @types/react-dom
npm install react react-dom

# Using yarn
yarn add -D @types/react @types/react-dom
yarn add react react-dom
```

Or run the provided script:
```bash
chmod +x scripts/install-launchtube-deps.sh
./scripts/install-launchtube-deps.sh
```

### 2. Get a Launchtube Token

For testnet usage:
1. Visit [https://testnet.launchtube.xyz/gen](https://testnet.launchtube.xyz/gen)
2. The API returns an array of tokens like: `["eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."]`
3. Copy the first token from the array (without the brackets and quotes)
4. Use this token in your configuration

> **Note**: This is the testnet Launchtube service. For mainnet, you would use different endpoints.

### 3. Configure Environment

Add these variables to your `.env` file:

```bash
# Enable Launchtube
PUBLIC_USE_LAUNCHTUBE="true"

# Your Launchtube JWT token
PUBLIC_LAUNCHTUBE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Restart Development Server

```bash
npm run dev
# or
bun dev
```

## Usage

Once configured, Launchtube will automatically be used for all Soroban contract transactions. The system will:

1. Try Launchtube first (if enabled and configured)
2. Fall back to direct RPC submission if Launchtube fails
3. Show appropriate error messages for different failure scenarios

## Testing the Integration

### 1. Quick Configuration Test

In your browser console, run:
```javascript
testLaunchtube()
```

This will run comprehensive tests to verify:
- Configuration is correct
- Token is valid
- Service connectivity
- Available credits

### 2. UI Testing Components

Add the test component to any page:
```tsx
import LaunchtubeTest from '../components/LaunchtubeTest';

// In your component
<LaunchtubeTest />
```

### 3. Manual Testing Steps

1. **Check Configuration**:
   - Ensure `PUBLIC_USE_LAUNCHTUBE="true"` in your `.env`
   - Verify you have a valid token from https://testnet.launchtube.xyz/gen

2. **Test Token Validity**:
   ```javascript
   // In browser console
   fetch('https://testnet.launchtube.xyz/info', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
   }).then(r => r.text()).then(console.log)
   ```

3. **Test Transaction Submission**:
   - Try any Soroban operation (vote, commit, etc.)
   - Check browser console for "Submitting transaction via Launchtube..." message
   - Verify transaction completes successfully

4. **Test Fallback**:
   - Temporarily set an invalid token
   - Try a transaction - should fall back to direct RPC
   - Check console for fallback message

### 4. Integration with Existing Features

Test Launchtube with these Tansu features:
- **Voting on proposals** - Should use Launchtube for vote submission
- **Committing hashes** - Should use Launchtube for commit transactions
- **Executing proposals** - Should use Launchtube for execution
- **Setting up anonymous voting** - Should use Launchtube for setup

### 5. Monitoring Credits

- Use the `LaunchtubeConfigPanel` component to monitor credits
- Check credits before running multiple transactions
- Each transaction typically costs 100-1000 stroops depending on complexity

## Monitoring

### Status Components

The integration includes several components for monitoring Launchtube status:

- `LaunchtubeStatus.astro` - Simple status indicator
- `LaunchtubeToggle.tsx` - Compact React component
- `LaunchtubeConfigPanel.tsx` - Full configuration panel

### Credit Management

Monitor your Launchtube credits using:

```typescript
import { getLaunchtubeCredits, checkLaunchtubeHealth } from '../service/LaunchtubeService';

// Get current credits
const credits = await getLaunchtubeCredits();

// Check overall health
const health = await checkLaunchtubeHealth();
```

## API Reference

### LaunchtubeService

#### `isLaunchtubeEnabled(): boolean`
Check if Launchtube is enabled and configured.

#### `submitViaLaunchtube(signedTxXdr: string): Promise<any>`
Submit a signed transaction via Launchtube.

#### `getLaunchtubeCredits(): Promise<number>`
Get remaining credits for the current token.

#### `checkLaunchtubeHealth(): Promise<{isHealthy: boolean, credits?: number, error?: string}>`
Check service health and get credits in one call.

### Configuration Utilities

#### `getLaunchtubeConfig(): LaunchtubeConfig`
Get current configuration settings.

#### `isValidLaunchtubeToken(token: string): boolean`
Validate JWT token format.

#### `formatCredits(credits: number): string`
Format credits for display (e.g., "1.2K", "5.5M").

#### `getCreditStatus(credits: number)`
Get credit level status with color coding.

## Error Handling

The integration handles various error scenarios:

- **Invalid Token**: Shows configuration error
- **Insufficient Credits**: Warns about low credits
- **Rate Limiting**: Handles rate limit errors gracefully
- **Network Issues**: Falls back to direct RPC

## Fallback Behavior

If Launchtube fails for any reason, the system automatically falls back to direct Soroban RPC submission. This ensures your dApp continues to work even if Launchtube is unavailable.

## Security Considerations

- Launchtube tokens are included in the frontend bundle
- Tokens are scoped to specific operations and have usage limits
- Consider the token as public - don't use high-value tokens in production
- Regularly monitor credit usage and rotate tokens as needed

## Troubleshooting

### Common Issues

1. **"Launchtube is not enabled"**
   - Check `PUBLIC_USE_LAUNCHTUBE="true"` in `.env`
   - Ensure you've restarted the dev server

2. **"Invalid Launchtube token"**
   - Verify token format (should be a JWT with 3 parts)
   - Get a new token from the claim page

3. **"Insufficient Launchtube credits"**
   - Check credit balance
   - Get a new token or contact SDF for more credits

4. **Transactions still failing**
   - Check browser console for detailed error messages
   - Verify contract addresses and network configuration
   - Test with Launchtube disabled to isolate issues

### Debug Mode

Enable debug logging by opening browser console. The integration logs:

- When Launchtube is used vs. direct RPC
- Credit levels and health checks
- Fallback scenarios

## Removing Launchtube

To easily remove Launchtube integration:

1. Set `PUBLIC_USE_LAUNCHTUBE="false"` in `.env`
2. Remove Launchtube-related components from your UI
3. The system will automatically use direct RPC submission

The integration is designed to be easily removable without breaking existing functionality.

## Support

For Launchtube-specific issues:
- Check the [Launchtube GitHub repository](https://github.com/stellar/launchtube)
- Contact [tyler@stellar.org](mailto:tyler@stellar.org) for SDF members

For integration issues:
- Check browser console for error messages
- Verify environment configuration
- Test with Launchtube disabled to isolate issues