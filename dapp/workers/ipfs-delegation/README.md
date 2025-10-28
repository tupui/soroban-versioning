# IPFS Delegation Worker

Cloudflare Worker that generates Storacha delegations for IPFS uploads.

## Prerequisites

```bash
bunx wrangler login
```

## Security

All secrets are stored in Cloudflare Secrets.

**For local development**: Use `.dev.vars` (gitignored)

**For production**: Set secrets via wrangler (per environment):

```bash
# Development
bunx wrangler secret put STORACHA_SING_PRIVATE_KEY --env testnet
bunx wrangler secret put STORACHA_PROOF --env testnet

# Production
bunx wrangler secret put STORACHA_SING_PRIVATE_KEY --env production
bunx wrangler secret put STORACHA_PROOF --env production
```

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

## Development

### Start the Worker

In one terminal:

```bash
cd dapp/workers/ipfs-delegation
bun install
bun run dev
```

The worker will start on `http://localhost:8787` and automatically reload on code changes.

### Test the Worker

In another terminal:

```bash
cd dapp/workers/ipfs-delegation
bun run test
```

Or with custom environment:

```bash
ENV=DEV bun run test  # Use testnet environment
ENV=PROD bun run test # Use production environment
```

## Deployment

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
