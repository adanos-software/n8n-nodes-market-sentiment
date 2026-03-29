# n8n Verified Submission

Use this package in two stages:

1. npm distribution
2. n8n Creator Portal verification

## Current package

- package: `n8n-nodes-market-sentiment`
- npm: `0.1.1`
- repo: `adanos-software/n8n-nodes-market-sentiment`

## Ready for submission

The package already meets the core submission prerequisites:

- package name starts with `n8n-nodes-`
- includes `n8n-community-node-package` keyword
- no runtime `dependencies`
- README documents credentials, operations, and example workflows
- package is published to npm
- releases now publish through GitHub Actions with provenance

## Creator Portal steps

1. open the n8n Creator Portal
2. submit `n8n-nodes-market-sentiment`
3. provide the public repository URL
4. provide the npm package URL
5. describe the node as a finance automation node for stock sentiment snapshots, trending stocks, and watchlist enrichment

## Useful links

- npm package: `https://www.npmjs.com/package/n8n-nodes-market-sentiment`
- repository: `https://github.com/adanos-software/n8n-nodes-market-sentiment`
- homepage: `https://adanos.org`
- API key signup: `https://adanos.org/reddit-stock-sentiment#api-form`
- submission docs: `https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/`
- verification guidelines: `https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/`

## Reviewer notes

The node is intentionally small:

- `Get Stock Snapshot`
- `Get Trending Stocks`
- `Enrich Incoming Items`

It is designed for finance automations such as:

- daily market recap workflows
- stock watchlist enrichment
- Slack or Discord sentiment alerts
- content pipelines for newsletters and market briefings
