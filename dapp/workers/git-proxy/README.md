# Git Proxy Cloudflare Worker

A Cloudflare Worker that provides a unified API for fetching git commit data from multiple git hosting providers. This worker acts as a proxy to avoid CORS issues and rate limiting when fetching git data from the browser.

## Supported Git Hosts

- **GitHub** (github.com)
- **GitLab** (gitlab.com)
- **Bitbucket** (bitbucket.org)
- **Codeberg** (codeberg.org)
- **Gitea** (gitea.com)
- **SourceHut** (sr.ht, git.sr.ht)

Additional hosts can be added via the `EXTRA_GIT_HOSTS` environment variable.

## Security

### Allow List

The worker only proxies requests to repositories hosted on allowed domains. This prevents abuse and ensures the proxy is only used for legitimate git hosting services.

### CORS

Only requests from allowed origins are accepted:
- `http://localhost:4321` (development)
- `https://testnet.tansu.dev`
- `https://app.tansu.dev`
- `https://tansu.xlm.sh`
- Netlify deploy previews

## API

All requests are POST requests with a JSON body.

### Get Commit History

```json
{
  "action": "history",
  "repoUrl": "https://github.com/owner/repo",
  "page": 1,
  "perPage": 30
}
```

### Get Commit Details

```json
{
  "action": "commit",
  "repoUrl": "https://github.com/owner/repo",
  "sha": "abc123..."
}
```

### Get Latest Commit Hash

```json
{
  "action": "latest-hash",
  "repoUrl": "https://github.com/owner/repo"
}
```

### Get README Content

```json
{
  "action": "readme",
  "repoUrl": "https://github.com/owner/repo"
}
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN` (optional): GitHub personal access token for higher rate limits
- `GITLAB_TOKEN` (optional): GitLab token for private repositories
- `EXTRA_GIT_HOSTS` (optional): Comma-separated list of additional allowed hosts

### Deployment

```bash
# Development
npm run dev

# Deploy to testnet
npm run deploy:testnet

# Deploy to production
npm run deploy:production
```

## Using with the dApp

Set the `PUBLIC_GIT_PROXY_URL` environment variable in your dApp:

```env
# Use Cloudflare proxy instead of local /api/git
PUBLIC_GIT_PROXY_URL=https://git.tansu.dev
```

When this variable is set, the GithubService will use the Cloudflare Worker instead of the local API endpoint.
