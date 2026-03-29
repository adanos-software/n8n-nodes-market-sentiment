# n8n Market Sentiment Node

`n8n-nodes-market-sentiment` is a community node for [n8n](https://github.com/n8n-io/n8n) that brings Adanos market sentiment data into automation workflows.

It is designed for practical finance automations:

- enrich stock watchlists from Google Sheets, Airtable, or Notion
- send Slack or Discord alerts when sentiment spikes
- build daily market recap workflows
- generate newsletter snippets from trending stocks

## Install in n8n

1. Open `Settings -> Community Nodes`.
2. Install `n8n-nodes-market-sentiment`.
3. Create an `Adanos API` credential with your API key.
4. Add the `Market Sentiment` node to your workflow.

Get an API key:

- [https://adanos.org/reddit-stock-sentiment#api-form](https://adanos.org/reddit-stock-sentiment#api-form)

## Supported sources

- `reddit`
- `x`
- `news`
- `polymarket`

## Operations

### 1. Get Stock Snapshot

Fetch combined or per-source sentiment snapshots for one or more tickers.

Inputs:

- `tickers`: comma-separated stock tickers such as `AAPL,NVDA,TSLA`
- `sources`: any mix of `reddit`, `x`, `news`, `polymarket`
- `days`: 1 to 90
- `outputMode`:
  - `combined`: one item per ticker with averaged metrics and source alignment
  - `perSource`: one item per ticker/source pair
  - `raw`: one item with the raw source payloads

### 2. Get Trending Stocks

Fetch the current trending stocks for a single source.

Inputs:

- `source`: `reddit`, `x`, `news`, or `polymarket`
- `days`: 1 to 90
- `limit`: 1 to 100
- `offset`
- `assetType`: `all`, `stock`, `etf`

### 3. Enrich Incoming Items

Attach combined market sentiment data to incoming n8n items using a ticker field.

Typical use:

`Google Sheets -> Market Sentiment -> Slack`

Inputs:

- `tickerField`: input JSON field that holds the stock ticker
- `targetField`: where the snapshot should be written back
- `sources`
- `days`
- `includeSources`

## Credential

The node uses one credential:

- `API Key`
- `Base URL` (defaults to `https://api.adanos.org`)

## Example output

Combined snapshot shape:

```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "averageBuzz": 68.4,
  "averageBullishPct": 61.5,
  "averageBearishPct": 18.5,
  "averageSentimentScore": 0.27,
  "coverage": 3,
  "sourceAlignment": "aligned_bullish",
  "sources": {
    "reddit": {
      "sourceLabel": "Reddit",
      "buzzScore": 72.1,
      "bullishPct": 64,
      "activity": 218,
      "activityLabel": "mentions",
      "trend": "rising"
    }
  }
}
```

## Local development

```bash
cd integrations/n8n/market-sentiment-node
npm install
npm run test
npm run typecheck
npm run build
```

## Example workflows

- [Daily market recap](./examples/daily-market-recap.workflow.json)
- [Watchlist enrichment](./examples/watchlist-enrichment.workflow.json)
- [Trending alert](./examples/trending-alert.workflow.json)
