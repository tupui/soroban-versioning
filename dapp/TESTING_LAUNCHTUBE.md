# Testing Launchtube Integration

This guide provides step-by-step instructions for testing the Launchtube integration in your Tansu dApp.

## Prerequisites

1. **Get a testnet token**: 
   - Visit [https://testnet.launchtube.xyz/gen](https://testnet.launchtube.xyz/gen)
   - The API returns an array like: `["eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."]`
   - Copy the token from inside the array (without brackets/quotes)

2. **Configure environment**:
   ```bash
   PUBLIC_USE_LAUNCHTUBE="true"
   PUBLIC_LAUNCHTUBE_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
   ```
3. **Restart your dev server**: `npm run dev` or `bun dev`

## Quick Tests

### 1. Browser Console Test

Open browser console and run:
```javascript
testLaunchtube()
```

Expected output:
```
🚀 Launchtube Integration Tests
⚙️ Configuration
✅ Launchtube configuration is valid
🌐 Connectivity  
✅ Launchtube connectivity successful
💰 Credits
✅ Credits available: 1000000 stroops
🎉 All Launchtube tests passed!
```

### 2. Manual Token Test

First, get a token from the API:
```javascript
// Get a new token
fetch('https://testnet.launchtube.xyz/gen')
  .then(r => r.json())
  .then(tokens => {
    console.log('Generated tokens:', tokens);
    const token = tokens[0]; // Take the first token from the array
    console.log('Your token:', token);
    
    // Test the token
    return fetch('https://testnet.launchtube.xyz/info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  })
  .then(r => r.text())
  .then(credits => console.log('Credits:', credits))
  .catch(err => console.error('Token test failed:', err))
```

Or test your existing token:
```javascript
const token = "YOUR_TOKEN_HERE"; // From your .env file
fetch('https://testnet.launchtube.xyz/info', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.text())
.then(credits => console.log('Credits:', credits))
.catch(err => console.error('Token test failed:', err))
```

## Integration Tests

### 3. Test with Real Transactions

1. **Connect your wallet** (Freighter, etc.)
2. **Try a simple operation**:
   - Go to any project page
   - Try voting on a proposal
   - Or commit a hash
   - Or execute a proposal

3. **Check console logs**:
   - Look for: `"Submitting transaction via Launchtube..."`
   - Transaction should complete successfully
   - No fallback messages should appear

### 4. Test Fallback Behavior

1. **Temporarily break the token**:
   ```bash
   PUBLIC_LAUNCHTUBE_TOKEN="invalid-token"
   ```

2. **Restart dev server**

3. **Try a transaction**:
   - Should see: `"Launchtube submission failed, falling back to direct RPC"`
   - Transaction should still complete (via direct RPC)

4. **Restore valid token** and restart

## UI Component Tests

### 5. Test Status Components

Add to any page:
```tsx
import LaunchtubeConfigPanel from '../components/LaunchtubeConfigPanel';
import LaunchtubeToggle from '../components/LaunchtubeToggle';
import LaunchtubeTest from '../components/LaunchtubeTest';

// In your component JSX:
<LaunchtubeConfigPanel />
<LaunchtubeToggle />
<LaunchtubeTest />
```

Expected behavior:
- **ConfigPanel**: Shows green status, credit count
- **Toggle**: Shows green dot with "Active" status
- **Test**: All tests pass when clicked

## Performance Tests

### 6. Compare Transaction Times

1. **With Launchtube enabled**:
   - Time a few transactions
   - Note the speed and reliability

2. **With Launchtube disabled**:
   ```bash
   PUBLIC_USE_LAUNCHTUBE="false"
   ```
   - Restart and time the same operations
   - Compare performance

3. **Expected results**:
   - Launchtube should be faster (no fee calculation)
   - More reliable (automatic retries)
   - No XLM balance required

## Troubleshooting Tests

### 7. Common Issues

**"Launchtube is not enabled"**:
```bash
# Check your .env file
cat .env | grep LAUNCHTUBE
# Should show:
# PUBLIC_USE_LAUNCHTUBE="true"
# PUBLIC_LAUNCHTUBE_TOKEN="eyJ..."
```

**"Invalid Launchtube token"**:
```javascript
// Test token format
const token = "YOUR_TOKEN_HERE";
console.log('Token parts:', token.split('.').length); // Should be 3
console.log('Valid format:', /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token));
```

**"Insufficient credits"**:
```javascript
// Check credits
fetch('https://testnet.launchtube.xyz/info', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.text()).then(console.log)
```

### 8. Network Issues

Test connectivity:
```javascript
// Test Launchtube service
fetch('https://testnet.launchtube.xyz/info')
  .then(r => console.log('Service status:', r.status))
  .catch(err => console.error('Service unreachable:', err))

// Test fallback RPC
fetch('https://soroban-testnet.stellar.org:443', { method: 'POST' })
  .then(r => console.log('RPC status:', r.status))
  .catch(err => console.error('RPC unreachable:', err))
```

## Success Criteria

✅ **Configuration tests pass**  
✅ **Token is valid and has credits**  
✅ **Transactions submit via Launchtube**  
✅ **Fallback works when Launchtube fails**  
✅ **UI components show correct status**  
✅ **Performance is improved vs direct RPC**  

## Getting Help

If tests fail:

1. **Check the browser console** for detailed error messages
2. **Verify your token** at https://testnet.launchtube.xyz/gen
3. **Test with Launchtube disabled** to isolate issues
4. **Check network connectivity** to both Launchtube and Stellar RPC

For integration issues, see [LAUNCHTUBE.md](LAUNCHTUBE.md) for detailed troubleshooting.