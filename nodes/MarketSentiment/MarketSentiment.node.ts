import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { getSourceCompareRows, getTrendingRows } from './GenericFunctions';
import {
	buildSnapshotResult,
	combineSnapshotsByTicker,
	normalizeCompareRows,
	parseTickerList,
	type AdanosSource,
	type SourceRow,
} from './helpers';

const sourceOptions = [
	{ name: 'Reddit', value: 'reddit' },
	{ name: 'X.com', value: 'x' },
	{ name: 'Finance News', value: 'news' },
	{ name: 'Polymarket', value: 'polymarket' },
];

const properties: INodeProperties[] = [
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

export class MarketSentiment implements INodeType {
	description: INodeTypeDescription = {
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'getStockSnapshot') {
			return [await executeGetSnapshot(this)];
		}

		if (operation === 'getTrendingStocks') {
			return [await executeGetTrending(this)];
		}

		if (operation === 'enrichIncomingItems') {
			return [await executeEnrichItems(this)];
		}

		throw new NodeApiError(this.getNode(), {
			message: `Unsupported operation: ${operation}`,
		});
	}
}

async function executeGetSnapshot(context: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const tickers = parseTickerList(context.getNodeParameter('tickers', 0) as string);
	const sources = context.getNodeParameter('sources', 0) as AdanosSource[];
	const days = context.getNodeParameter('days', 0) as number;
	const outputMode = context.getNodeParameter('outputMode', 0) as 'combined' | 'perSource' | 'raw';
	const rawResults: Partial<Record<AdanosSource, SourceRow[]>> = {};

	await Promise.all(
		sources.map(async (source) => {
			rawResults[source] = await getSourceCompareRows(context, 0, source, tickers, days);
		}),
	);

	const results = buildSnapshotResult(rawResults, outputMode);
	return context.helpers.returnJsonArray(results as IDataObject[]);
}

async function executeGetTrending(context: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const source = context.getNodeParameter('source', 0) as AdanosSource;
	const days = context.getNodeParameter('trendingDays', 0) as number;
	const limit = context.getNodeParameter('limit', 0) as number;
	const offset = context.getNodeParameter('offset', 0) as number;
	const assetType = context.getNodeParameter('assetType', 0) as 'all' | 'stock' | 'etf';

	const rows = await getTrendingRows(context, 0, source, days, limit, offset, assetType);
	const normalized = normalizeCompareRows(source, rows).map((row) => ({
		...row,
		periodDays: days,
		source,
	}));

	return context.helpers.returnJsonArray(normalized as IDataObject[]);
}

async function executeEnrichItems(context: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const items = context.getInputData();
	const tickerField = context.getNodeParameter('tickerField', 0) as string;
	const targetField = context.getNodeParameter('targetField', 0) as string;
	const sources = context.getNodeParameter('sources', 0) as AdanosSource[];
	const days = context.getNodeParameter('days', 0) as number;
	const includeSources = context.getNodeParameter('includeSources', 0) as boolean;
	const tickerMap = new Map<number, string>();
	const uniqueTickers = new Set<string>();

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
		throw new NodeApiError(context.getNode(), {
			message: `No usable ticker values found in field "${tickerField}"`,
		});
	}

	const rawResults: Partial<Record<AdanosSource, SourceRow[]>> = {};
	await Promise.all(
		sources.map(async (source) => {
			rawResults[source] = await getSourceCompareRows(context, 0, source, Array.from(uniqueTickers), days);
		}),
	);

	const combined = combineSnapshotsByTicker(
		Object.entries(rawResults).flatMap(([source, rows]) =>
			normalizeCompareRows(source as AdanosSource, rows ?? []),
		),
	);
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
