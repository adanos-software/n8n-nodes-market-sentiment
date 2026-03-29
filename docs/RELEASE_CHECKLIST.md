# Release Checklist

## Before publishing

- run `npm test`
- run `npm run typecheck`
- run `npm run build`
- run `python3 -m pytest /Users/alexschneider/Documents/Privat/Reddit-Sentiment/tests/test_n8n_market_sentiment_node_package.py -q`

## One-time setup

Before the first npm release:

1. create the package on npm by publishing once through the repo workflow
2. configure npm Trusted Publisher for:
   - owner: `adanos-software`
   - repo: `n8n-nodes-market-sentiment`
   - workflow: `.github/workflows/publish.yml`
3. confirm the package name `n8n-nodes-market-sentiment` is still free or already owned by Adanos

The publish workflow is tag-driven and uses npm provenance.

## Release flow

1. make sure `package.json` version is correct
2. push the version bump to `main`
3. create and push a matching Git tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. wait for `.github/workflows/publish.yml` to pass
5. verify the package on npm

The workflow refuses to publish if the Git tag does not match `package.json` exactly.

## Runtime validation

Minimum smoke test inside a real n8n instance:

1. install the package from npm or a local tarball
2. create one `Adanos API` credential
3. import `examples/manual-snapshot-validation.workflow.json`
4. import `examples/manual-enrichment-validation.workflow.json`
5. run both workflows from the editor

Expected outcomes:

- `Manual Snapshot Validation` returns combined ticker snapshots
- `Manual Enrichment Validation` returns one item per seeded ticker with a nested `marketSentiment` object

## Trader sanity check

Before release, verify one high-interest watchlist manually:

- `AAPL`
- `NVDA`
- `TSLA`
- `PLTR`

Look for:

- non-zero `averageBuzz` on at least one fast-moving name
- plausible `coverage`
- sensible `sourceAlignment`
- useful nested `sources` payloads for downstream filters or alerts

## npm package

- confirm `package.json` version
- confirm `publishConfig.access` is `public`
- confirm `files` only ships `dist`
- confirm `dist/index.js` exists after build
- confirm `dist/nodes/MarketSentiment/marketSentiment.svg` exists after build

## Community node readiness

- package name starts with `n8n-nodes-`
- no runtime `dependencies`
- README explains credentials, operations, and example workflows
- examples are importable without editing JSON structure
