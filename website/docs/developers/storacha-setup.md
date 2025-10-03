# Storacha (IPFS) Setup Guide

This guide explains how to set up Storacha (formerly Web3.Storage) for IPFS integration in the Tansu project, including creating and encrypting proof files using AES256 encryption.

## Overview

Tansu uses Storacha to store and manage content on IPFS (InterPlanetary File System). To enable IPFS functionality, you need to:

1. Create a Storacha account and generate a proof file
2. Encrypt the proof file using AES256 encryption
3. Configure environment variables with the necessary credentials

## Prerequisites

- Node.js installed on your system
- A Storacha account (free tier available)
- Access to the project's encryption utility

## Step 1: Create a Storacha Account

1. Visit [https://storacha.network](https://storacha.network)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a Space

Spaces in Storacha are like project containers where you store your files.

1. Log in to your Storacha account
2. Click on "Create Space" in the dashboard
3. Give your space a meaningful name (e.g., "tansu-project")
4. Note down the Space DID (Decentralized Identifier) - you'll need this later

## Step 3: Generate Agent Keys and Proof

You'll need to generate a private key and delegation proof to authenticate your application with Storacha.

### Using the Storacha CLI

1. Install the Storacha CLI globally:
   ```bash
   npm install -g @web3-storage/w3cli
   ```

2. Login to Storacha via CLI:
   ```bash
   w3 login
   ```

3. Create a new space or select an existing one:
   ```bash
   w3 space create tansu-project
   ```

4. Generate an agent key:
   ```bash
   w3 key create
   ```

   This will output a private key in the format: `MgCY...` (Ed25519 key)

5. Create a delegation proof for your space:
   ```bash
   w3 delegation create <your-agent-did> --can 'space/blob/add' --can 'space/index/add' --can 'filecoin/offer' --can 'upload/add' > proof.ucan
   ```

   The proof will be saved to `proof.ucan` file.

## Step 4: Encrypt the Proof File

The proof file contains sensitive delegation information and must be encrypted before being stored in the repository.

1. Navigate to the project root directory:
   ```bash
   cd /path/to/soroban-versioning
   ```

2. Prepare your proof file content:
   - Open the `proof.ucan` file and copy its entire content
   - You'll need to modify the encryption script to use your actual proof data

3. Edit the encryption script at `tools/AES256-encrypt.js`:
   ```javascript
   // Replace this line:
   const data = new TextEncoder().encode("This is some secret data...");

   // With your actual proof content:
   const data = new TextEncoder().encode("your-proof-ucan-content-here");
   ```

4. Run the encryption script:
   ```bash
   node tools/AES256-encrypt.js
   ```

5. The script will:
   - Generate a random AES-256 encryption key
   - Display the key in hexadecimal format (64 characters)
   - Encrypt your proof data
   - Save the encrypted data to `encrypted_proof.bin` in the dapp directory

6. **IMPORTANT**: Copy and securely store the hexadecimal key displayed in the console. You'll need this for the environment variables.

## Step 5: Move Encrypted Proof to the Correct Location

The encrypted proof file should be placed in the dapp directory:

```bash
# If not already there, move the encrypted proof
mv encrypted_proof.bin ./dapp/encrypted_proof.bin
```

## Step 6: Configure Environment Variables

Add the following environment variables to your `.env` file in the `dapp` directory:

```bash
# Storacha Configuration
STORACHA_SING_PRIVATE_KEY="your-ed25519-private-key-from-step3"
STORACHA_PROOF="your-64-character-hex-key-from-step4"
```

### Environment Variable Details

- **STORACHA_SING_PRIVATE_KEY**: The Ed25519 private key generated in Step 3 (starts with `MgC...`)
- **STORACHA_PROOF**: The 64-character hexadecimal encryption key generated in Step 4

### For Production Deployment

When deploying to production:

1. Set these environment variables in your hosting platform (Vercel, Netlify, etc.)
2. **DO NOT** commit the `.env` file to version control
3. Ensure `encrypted_proof.bin` is included in your deployment
4. The `.env.example` file shows the required variables without sensitive values

## Step 7: Verify the Setup

To verify your Storacha setup is working correctly:

1. Start the development server:
   ```bash
   cd dapp
   npm run dev
   ```

2. Test IPFS upload functionality in your application
3. Check that files are successfully uploaded to your Storacha space

## How It Works

### Encryption Flow

1. The proof file is encrypted using AES-256-GCM encryption
2. The encryption process generates:
   - A random 12-byte nonce (IV)
   - An authentication tag for data integrity
   - The encrypted ciphertext
   - A header ("storachaProof") for additional authentication

3. All components are stored in `encrypted_proof.bin` as a JSON object:
   ```json
   {
     "nonce": "base64-encoded-nonce",
     "header": "base64-encoded-header",
     "ciphertext": "base64-encoded-data",
     "tag": "base64-encoded-auth-tag"
   }
   ```

### Decryption Flow

When the application needs to use the Storacha proof:

1. It reads the hex key from `STORACHA_PROOF` environment variable
2. Loads the `encrypted_proof.bin` file
3. Uses the `decryptProof()` function in `dapp/src/utils/decryptAES256.ts` to decrypt
4. The decrypted proof is used to authenticate with Storacha

## Security Considerations

1. **Never commit sensitive files**:
   - `.env` files with actual keys
   - Unencrypted proof files (`proof.ucan`)
   - The hexadecimal encryption key

2. **Encrypted proof file**:
   - `encrypted_proof.bin` can be safely committed to the repository
   - It's useless without the encryption key stored in environment variables

3. **Key rotation**:
   - Periodically regenerate your Storacha agent keys
   - Re-encrypt the proof file with a new AES key
   - Update environment variables accordingly

4. **Access control**:
   - Limit the capabilities in your delegation proof to only what's needed
   - Use short expiration times for delegations when possible
   - Monitor your Storacha space for unauthorized uploads

## Troubleshooting

### "Storacha credentials not configured" Error

- Ensure both `STORACHA_SING_PRIVATE_KEY` and `STORACHA_PROOF` are set in your environment
- Verify there are no extra spaces or quotes around the values

### Decryption Fails

- Confirm the hex key is exactly 64 characters
- Verify `encrypted_proof.bin` exists in the dapp directory
- Ensure the encryption key matches the one used to encrypt the proof

### Upload Fails

- Check that your Storacha space has available storage
- Verify the agent key has the necessary permissions
- Ensure the delegation proof hasn't expired

## Additional Resources

- [Storacha Documentation](https://docs.storacha.network)
- [Web3.Storage Client Library](https://github.com/web3-storage/w3up/tree/main/packages/w3up-client)
- [IPFS Documentation](https://docs.ipfs.tech)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

## Related Files

- Encryption script: `tools/AES256-encrypt.js`
- Decryption utility: `dapp/src/utils/decryptAES256.ts`
- IPFS utilities: `dapp/src/utils/ipfsFunctions.ts`
- Delegation endpoint: `dapp/src/pages/api/w3up-delegation.js`
- Environment example: `dapp/.env.example`
