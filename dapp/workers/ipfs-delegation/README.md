# IPFS Delegation Worker

Cloudflare Worker that generates Storacha delegations for IPFS uploads.

## API

```json
POST /
{
  "did": "did:key:...",
  "signedTxXdr": "AAAA..."
}
```

Returns: binary delegation archive

The worker validates the signed transaction is cryptographically signed by the source account before generating the delegation. It automatically detects whether the transaction is from testnet or mainnet.

## Storacha setup

Follow Storacha's documentation to create a Space and obtain its Proof (a UCAN proof string).

If you do not have an account, you will be prompted to create one and select a plan. The free plan is more than enough
for what we want to do.

Install the CLI:

```bash
bun install @storacha/cli
```

Create an account or log in:

```bash
storacha login
```

Create a space:

```bash
storacha space create tansu
```

This will generate a space which is identifiable by a DID, something like `did:key:z6Mk...`.

The next step is to create a key, this is `STORACHA_SING_PRIVATE_KEY`:

```bash
storacha key create --json
```

The key itself has it's own DID. Use that DID to create a delegation proof:

```bash
export AUDIENCE=did:key:z6Mk...
storacha delegation create $AUDIENCE -c space/blob/add -c space/index/add -c filecoin/offer -c upload/add --base64
```

This is your `STORACHA_PROOF`.

## Development

Add your `STORACHA_SING_PRIVATE_KEY` and `STORACHA_PROOF` to `.dev.vars`

### Start the Worker

```bash
cd dapp/workers/ipfs-delegation
bun install
bun run dev
```

### Test the Worker

In another terminal:

```bash
cd dapp/workers/ipfs-delegation
bun run test
```

Or against deployed environments (see next section):

```bash
ENV=DEV bun run test  # Use testnet environment
ENV=PROD bun run test # Use production environment
```

## Deployment

### Prerequisites

```bash
bunx wrangler login
```

### Security

All secrets are stored in Cloudflare Secrets. Set secrets via wrangler (per environment):

```bash
# Development
bunx wrangler secret put STORACHA_SING_PRIVATE_KEY --env testnet
bunx wrangler secret put STORACHA_PROOF --env testnet

# Production
bunx wrangler secret put STORACHA_SING_PRIVATE_KEY --env production
bunx wrangler secret put STORACHA_PROOF --env production
```

### Development (Testnet)

```bash
bunx wrangler deploy --env testnet
```

Deploys to `https://ipfs-testnet.tansu.dev`

### Production (Mainnet)

```bash
bunx wrangler deploy --env production
```

Deploys to `https://ipfs.tansu.dev`

Custom Domain configuration automatically handles DNS records and SSL certificates.
