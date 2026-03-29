"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketSentiment = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const helpers_1 = require("./helpers");
const sourceOptions = [
    { name: 'Reddit', value: 'reddit' },
    { name: 'X.com', value: 'x' },
    { name: 'Finance News', value: 'news' },
    { name: 'Polymarket', value: 'polymarket' },
];
const properties = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        default: 'getStockSnapshot',
        options: [
            {
                name: 'Get Stock Snapshot',
                value: 'getStockSnapshot',
                description: 'Fetch a combined or per-source market sentiment snapshot for one or more tickers',
                action: 'Get stock snapshot',
            },
            {
                name: 'Get Trending Stocks',
                value: 'getTrendingStocks',
                description: 'Fetch the current trending stocks for one source',
                action: 'Get trending stocks',
            },
            {
                name: 'Enrich Incoming Items',
                value: 'enrichIncomingItems',
                description: 'Attach combined market sentiment data to each incoming item using a ticker field',
                action: 'Enrich incoming items',
            },
        ],
    },
    {
        displayName: 'Tickers',
        name: 'tickers',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'AAPL,NVDA,TSLA',
        description: 'Comma-separated stock tickers',
        displayOptions: {
            show: {
                operation: ['getStockSnapshot'],
            },
        },
    },
    {
        displayName: 'Sources',
        name: 'sources',
        type: 'multiOptions',
        default: ['reddit', 'x', 'news', 'polymarket'],
        required: true,
        options: sourceOptions,
        description: 'Sources to include in the combined snapshot',
        displayOptions: {
            show: {
                operation: ['getStockSnapshot', 'enrichIncomingItems'],
            },
        },
    },
    {
        displayName: 'Days',
        name: 'days',
        type: 'number',
        typeOptions: {
            minValue: 1,
            maxValue: 90,
        },
        default: 7,
        description: 'Lookback window in days',
        displayOptions: {
            show: {
                operation: ['getStockSnapshot', 'enrichIncomingItems'],
            },
        },
    },
    {
        displayName: 'Output Mode',
        name: 'outputMode',
        type: 'options',
        default: 'combined',
        options: [
            { name: 'Combined', value: 'combined' },
            { name: 'Per Source', value: 'perSource' },
            { name: 'Raw', value: 'raw' },
        ],
        description: 'How the snapshot response should be shaped',
        displayOptions: {
            show: {
                operation: ['getStockSnapshot'],
            },
        },
    },
    {
        displayName: 'Source',
        name: 'source',
        type: 'options',
        required: true,
        default: 'reddit',
        options: sourceOptions,
        description: 'Source to fetch trending stocks from',
        displayOptions: {
            show: {
                operation: ['getTrendingStocks'],
            },
        },
    },
    {
        displayName: 'Days',
        name: 'trendingDays',
        type: 'number',
        typeOptions: {
            minValue: 1,
            maxValue: 90,
        },
        default: 1,
        description: 'Lookback window for trending stocks',
        displayOptions: {
            show: {
                operation: ['getTrendingStocks'],
            },
        },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: {
            minValue: 1,
            maxValue: 100,
        },
        default: 20,
        description: 'Maximum number of trending stocks to return',
        displayOptions: {
            show: {
                operation: ['getTrendingStocks'],
            },
        },
    },
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        typeOptions: {
            minValue: 0,
        },
        default: 0,
        description: 'Pagination offset for trending results',
        displayOptions: {
            show: {
                operation: ['getTrendingStocks'],
            },
        },
    },
    {
        displayName: 'Asset Type',
        name: 'assetType',
        type: 'options',
        default: 'all',
        options: [
            { name: 'All', value: 'all' },
            { name: 'Stock', value: 'stock' },
            { name: 'ETF', value: 'etf' },
        ],
        description: 'Filter the trending universe by asset type',
        displayOptions: {
            show: {
                operation: ['getTrendingStocks'],
            },
        },
    },
    {
        displayName: 'Ticker Field',
        name: 'tickerField',
        type: 'string',
        default: 'symbol',
        required: true,
        description: 'Input JSON field that contains the stock ticker',
        displayOptions: {
            show: {
                operation: ['enrichIncomingItems'],
            },
        },
    },
    {
        displayName: 'Target Field',
        name: 'targetField',
        type: 'string',
        default: 'marketSentiment',
        required: true,
        description: 'Field name used to store the combined sentiment snapshot on each item',
        displayOptions: {
            show: {
                operation: ['enrichIncomingItems'],
            },
        },
    },
    {
        displayName: 'Include Per-Source Breakdown',
        name: 'includeSources',
        type: 'boolean',
        default: true,
        description: 'Whether to include nested per-source details under the target field',
        displayOptions: {
            show: {
                operation: ['enrichIncomingItems'],
            },
        },
    },
];
class MarketSentiment {
    constructor() {
        this.description = {
            displayName: 'Market Sentiment',
            name: 'marketSentiment',
            icon: 'file:marketSentiment.svg',
            group: ['transform'],
            version: 1,
            description: 'Get stock snapshots, trending tickers, or enrich incoming items with Adanos market sentiment data',
            defaults: {
                name: 'Market Sentiment',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'adanosApi',
                    required: true,
                },
            ],
            properties,
        };
    }
    async execute() {
        const operation = this.getNodeParameter('operation', 0);
        if (operation === 'getStockSnapshot') {
            return [await executeGetSnapshot(this)];
        }
        if (operation === 'getTrendingStocks') {
            return [await executeGetTrending(this)];
        }
        if (operation === 'enrichIncomingItems') {
            return [await executeEnrichItems(this)];
        }
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {
            message: `Unsupported operation: ${operation}`,
        });
    }
}
exports.MarketSentiment = MarketSentiment;
async function executeGetSnapshot(context) {
    const tickers = (0, helpers_1.parseTickerList)(context.getNodeParameter('tickers', 0));
    const sources = context.getNodeParameter('sources', 0);
    const days = context.getNodeParameter('days', 0);
    const outputMode = context.getNodeParameter('outputMode', 0);
    const rawResults = {};
    await Promise.all(sources.map(async (source) => {
        rawResults[source] = await (0, GenericFunctions_1.getSourceCompareRows)(context, 0, source, tickers, days);
    }));
    const results = (0, helpers_1.buildSnapshotResult)(rawResults, outputMode);
    return context.helpers.returnJsonArray(results);
}
async function executeGetTrending(context) {
    const source = context.getNodeParameter('source', 0);
    const days = context.getNodeParameter('trendingDays', 0);
    const limit = context.getNodeParameter('limit', 0);
    const offset = context.getNodeParameter('offset', 0);
    const assetType = context.getNodeParameter('assetType', 0);
    const rows = await (0, GenericFunctions_1.getTrendingRows)(context, 0, source, days, limit, offset, assetType);
    const normalized = (0, helpers_1.normalizeCompareRows)(source, rows).map((row) => ({
        ...row,
        periodDays: days,
        source,
    }));
    return context.helpers.returnJsonArray(normalized);
}
async function executeEnrichItems(context) {
    const items = context.getInputData();
    const tickerField = context.getNodeParameter('tickerField', 0);
    const targetField = context.getNodeParameter('targetField', 0);
    const sources = context.getNodeParameter('sources', 0);
    const days = context.getNodeParameter('days', 0);
    const includeSources = context.getNodeParameter('includeSources', 0);
    const tickerMap = new Map();
    const uniqueTickers = new Set();
    for (let index = 0; index < items.length; index += 1) {
        const rawValue = items[index].json[tickerField];
        if (typeof rawValue !== 'string' || rawValue.trim() === '') {
            continue;
        }
        const ticker = rawValue.trim().toUpperCase();
        tickerMap.set(index, ticker);
        uniqueTickers.add(ticker);
    }
    if (uniqueTickers.size === 0) {
        throw new n8n_workflow_1.NodeApiError(context.getNode(), {
            message: `No usable ticker values found in field "${tickerField}"`,
        });
    }
    const rawResults = {};
    await Promise.all(sources.map(async (source) => {
        rawResults[source] = await (0, GenericFunctions_1.getSourceCompareRows)(context, 0, source, Array.from(uniqueTickers), days);
    }));
    const combined = (0, helpers_1.combineSnapshotsByTicker)(Object.entries(rawResults).flatMap(([source, rows]) => (0, helpers_1.normalizeCompareRows)(source, rows ?? [])));
    const byTicker = new Map(combined.map((row) => [row.ticker, row]));
    return items.map((item, index) => {
        const ticker = tickerMap.get(index);
        const snapshot = ticker ? byTicker.get(ticker) ?? null : null;
        const payload = snapshot && !includeSources
            ? {
                ...snapshot,
                sources: undefined,
            }
            : snapshot;
        return {
            json: {
                ...item.json,
                [targetField]: payload,
            },
            pairedItem: item.pairedItem,
        };
    });
}
