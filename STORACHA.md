# Storacha IPFS Setup and AES-256 Proof Encryption

This guide explains how to set up IPFS uploads via Storacha for the dApp, how to generate and encrypt your Storacha proof with AES-256, and how to configure the required environment variables.

The dApp server route `dapp/src/pages/api/w3up-delegation.js` expects:
- `STORACHA_SING_PRIVATE_KEY` (required): your Storacha ED25519 principal private key.

If `STORACHA_PROOF` is exactly 64 characters, the app treats it as an AES key (hex) and decrypts a local `encrypted_proof.bin` using `dapp/src/utils/decryptAES256.ts`.

---

## 1) Create a Storacha Proof

Follow Storacha docs to create a Space and obtain its Proof (a UCAN proof string). You will end up with a proof string you can paste into an environment variable or encrypt locally.

Install CLI:

```bash
bun install -g @storacha/cli
```

Create a space:

```bash
w3 space create
```
You will be prompted to enter a name for your space:

```
What would you like to call this space? <enter name>
```

The CLI will then output something like:

```
You need to save the following secret recovery key somewhere safe!
For example write it down on a piece of paper and put it inside your favorite book.

••••• •••••••• •••• •••••• ••••••• ••••• ••••• •••••••• •••• ••••• •••• ••••• •••• ••••••• •••••• •••• •••••
••••••• ••• •••••• •••••• •••• ••••••• •••••••

🔐 Secret recovery key is correct!
🏗️ To serve this space we need to set a billing account
? How do you want to authorize your account? Via Email
? 📧 Please enter an email address to setup an account: <enter email>
Authorize your account
Select a payment plan
```

This will generate a UCAN proof string (in `proof.txt`) that you can:

* Paste directly into an environment variable (**plain mode**), or
* Encrypt into `encrypted_proof.bin` (**encrypted mode**, recommended).

Keep this string safe; it grants the app permission to delegate for uploads.

---

## 2) Choose Your Storage Mode for the Proof

You have two supported options.

- Plain mode (simplest): store the proof directly in the `STORACHA_PROOF` environment variable.
- Encrypted mode (recommended): encrypt the proof locally into `encrypted_proof.bin` and store only the AES key (hex) in the environment.

> Why encrypted mode?
> Some hosting providers (like **Netlify**) impose strict limits on environment variable size.
> Since proofs can be large, we use AES encryption to store them in a file (`encrypted_proof.bin`) and only keep the short AES key in `STORACHA_PROOF`.

The runtime logic in `w3up-delegation.js`:
- If `STORACHA_PROOF.length === 64` → treat it as AES key hex and decrypt `encrypted_proof.bin` at runtime.
- Otherwise, treat `STORACHA_PROOF` as the plain proof string.

---
## 3) Encrypted Mode: Generate AES Key and `encrypted_proof.bin`

The repository provides [`tools/AES256-encrypt.js`](../tools/AES256-encrypt.js), which encrypts your proof with **AES-GCM** and writes an `encrypted_proof.bin` file.

Run it with your proof as an argument:

```bash
node tools/AES256-encrypt.js "<PASTE_YOUR_STORACHA_PROOF_STRING>"
```

The script will output something like:

```
This is our key in hex: <64-hex-key>
Encrypted data written to encrypted_proof.bin
```

* Copy the 64-hex key and keep it safe.
* Move the generated file into the dApp root so the server can find it at runtime:

```bash
mv encrypted_proof.bin dapp/
```

### Notes:

* The decryption helper [`decryptAES256.ts`](../dapp/src/utils/decryptAES256.ts) expects the same header (`storachaProof`).
  If you change the header in the encryption script, you must also update it in the decryption code.
* You **may commit** `encrypted_proof.bin` if needed to reproduce builds.
  But never commit your AES key or `.env` file.

---

## 4) Configure Environment Variables

Create your dApp environment file from the template and populate required values:

```bash
cp dapp/.env.example dapp/.env
```

Open `dapp/.env` and set:

- `STORACHA_SING_PRIVATE_KEY`: Your storacha principal private key.
- `STORACHA_PROOF`:
  - Encrypted mode: set this to the 64-hex key printed by the encryption script. Ensure `dapp/encrypted_proof.bin` exists.
  - Plain mode: set this to the entire proof string.

Example (`dapp/.env`):

```dotenv
# ... other PUBLIC_ variables omitted for brevity
STORACHA_SING_PRIVATE_KEY="<YOUR_ED25519_PRIVATE_KEY>"
# Encrypted mode: 64-hex key from the encryption step; requires dapp/encrypted_proof.bin
STORACHA_PROOF="<64-HEX-AES-KEY>"
```

If you prefer plain mode:

```dotenv
STORACHA_SING_PRIVATE_KEY="<YOUR_ED25519_PRIVATE_KEY>"
STORACHA_PROOF="<YOUR_PLAIN_STORACHA_PROOF_STRING>"
```

---

## 5) Verify Your Setup

- Development server:
  ```bash
  cd dapp
  bun install
  bun run dev
  ```

- Trigger the delegation API in the app flow that requests delegation (proposal/member/project). The server route `POST /src/pages/api/w3up-delegation.js` will:
  - Validate inputs and environment.
  - If `STORACHA_PROOF` is 64 hex, call `decryptAES256` to read `encrypted_proof.bin` and decrypt your proof.
  - Initialize a storacha client and return a delegation archive.

If misconfigured, you may see:
- `Storacha credentials not configured. Please set STORACHA_SING_PRIVATE_KEY and STORACHA_PROOF` (missing env vars)
- Decryption errors (mismatched key/header or missing `dapp/encrypted_proof.bin`).

---