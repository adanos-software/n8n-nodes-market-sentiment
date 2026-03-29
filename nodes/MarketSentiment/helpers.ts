export const SUPPORTED_SOURCES = ['reddit', 'x', 'news', 'polymarket'] as const;

export type AdanosSource = (typeof SUPPORTED_SOURCES)[number];

export type SourceRow = {
	ticker: string;
	company_name?: string | null;
	buzz_score?: number | null;
	bullish_pct?: number | null;
	bearish_pct?: number | null;
	sentiment_score?: number | null;
	trend?: string | null;
	mentions?: number | null;
	unique_posts?: number | null;
	subreddit_count?: number | null;
	total_upvotes?: number | null;
	source_count?: number | null;
	unique_tweets?: number | null;
	trade_count?: number | null;
	market_count?: number | null;
	unique_traders?: number | null;
	total_liquidity?: number | null;
	trend_history?: number[];
};

export type NormalizedSourceSnapshot = {
	source: AdanosSource;
	sourceLabel: string;
	ticker: string;
	companyName: string | null;
	buzzScore: number | null;
	bullishPct: number | null;
	bearishPct: number | null;
	sentimentScore: number | null;
	trend: string | null;
	activity: number | null;
	activityLabel: 'mentions' | 'trades';
	metadata: Record<string, number | null>;
	trendHistory: number[];
	raw: SourceRow;
};

export type CombinedTickerSnapshot = {
	ticker: string;
	companyName: string | null;
	averageBuzz: number | null;
	averageBullishPct: number | null;
	averageBearishPct: number | null;
	averageSentimentScore: number | null;
	coverage: number;
	sourceAlignment: 'single_source' | 'aligned_bullish' | 'aligned_bearish' | 'mixed' | 'divergent' | 'no_data';
	sources: Partial<Record<AdanosSource, NormalizedSourceSnapshot>>;
};

type CompareResponse = {
	period_days?: number;
	stocks?: SourceRow[];
	data?: SourceRow[];
};

const SOURCE_LABELS: Record<AdanosSource, string> = {
	reddit: 'Reddit',
	x: 'X.com',
	news: 'Finance News',
	polymarket: 'Polymarket',
};

export function normalizeBaseUrl(baseUrl?: string): string {
	const normalized = (baseUrl || 'https://api.adanos.org').trim();
	return normalized.replace(/\/+$/, '');
}

export function parseTickerList(rawTickers: string): string[] {
	const seen = new Set<string>();
	const tickers = rawTickers
		.split(',')
		.map((value) => value.trim().toUpperCase())
		.filter(Boolean)
		.filter((ticker) => {
			if (seen.has(ticker)) {
				return false;
			}
			seen.add(ticker);
			return true;
		});

	if (tickers.length === 0) {
		throw new Error('At least one ticker is required.');
	}

	return tickers;
}

export function extractStockRows(payload: unknown): SourceRow[] {
	if (!payload || typeof payload !== 'object') {
		return [];
	}

	const response = payload as CompareResponse;
	if (Array.isArray(response.stocks)) {
		return response.stocks;
	}

	if (Array.isArray(response.data)) {
		return response.data;
	}

	return [];
}

export function normalizeCompareRows(source: AdanosSource, rows: SourceRow[]): NormalizedSourceSnapshot[] {
	return rows.map((row) => {
		const activityLabel = source === 'polymarket' ? 'trades' : 'mentions';
		const activity = source === 'polymarket' ? safeNumber(row.trade_count) : safeNumber(row.mentions);
		const metadata = getSourceMetadata(source, row);

		return {
			source,
			sourceLabel: SOURCE_LABELS[source],
			ticker: (row.ticker || '').toUpperCase(),
			companyName: row.company_name ?? null,
			buzzScore: safeNumber(row.buzz_score),
			bullishPct: safeNumber(row.bullish_pct),
			bearishPct: safeNumber(row.bearish_pct),
			sentimentScore: safeNumber(row.sentiment_score),
			trend: row.trend ?? null,
			activity,
			activityLabel,
			metadata,
			trendHistory: Array.isArray(row.trend_history) ? row.trend_history.filter((value) => typeof value === 'number') : [],
			raw: row,
		};
	});
}

export function combineSnapshotsByTicker(rows: NormalizedSourceSnapshot[]): CombinedTickerSnapshot[] {
	const combined = new Map<string, CombinedTickerSnapshot>();

	for (const row of rows) {
		const ticker = row.ticker;
		if (!ticker) {
			continue;
		}

		const current = combined.get(ticker) || {
			ticker,
			companyName: row.companyName,
			averageBuzz: null,
			averageBullishPct: null,
			averageBearishPct: null,
			averageSentimentScore: null,
			coverage: 0,
			sourceAlignment: 'no_data' as const,
			sources: {},
		};

		current.sources[row.source] = row;
		if (!current.companyName && row.companyName) {
			current.companyName = row.companyName;
		}

		combined.set(ticker, current);
	}

	for (const snapshot of combined.values()) {
		const perSource = Object.values(snapshot.sources);
		snapshot.coverage = perSource.length;
		snapshot.averageBuzz = average(perSource.map((item) => item?.buzzScore));
		snapshot.averageBullishPct = average(perSource.map((item) => item?.bullishPct));
		snapshot.averageBearishPct = average(perSource.map((item) => item?.bearishPct));
		snapshot.averageSentimentScore = average(perSource.map((item) => item?.sentimentScore));
		snapshot.sourceAlignment = calculateAlignment(perSource);
	}

	return Array.from(combined.values()).sort(sortByBuzzDesc);
}

export function buildSnapshotResult(
	rawResults: Partial<Record<AdanosSource, SourceRow[]>>,
	outputMode: 'combined' | 'perSource' | 'raw',
) {
	if (outputMode === 'raw') {
		return [
			{
				results: rawResults,
			},
		];
	}

	const normalizedRows = Object.entries(rawResults).flatMap(([source, rows]) =>
		normalizeCompareRows(source as AdanosSource, rows ?? []),
	);

	if (outputMode === 'perSource') {
		return normalizedRows.sort(sortByBuzzDesc);
	}

	return combineSnapshotsByTicker(normalizedRows);
}

function getSourceMetadata(source: AdanosSource, row: SourceRow): Record<string, number | null> {
	if (source === 'reddit') {
		return {
			uniquePosts: safeNumber(row.unique_posts),
			subredditCount: safeNumber(row.subreddit_count),
			totalUpvotes: safeNumber(row.total_upvotes),
		};
	}

	if (source === 'x') {
		return {
			uniqueTweets: safeNumber(row.unique_tweets),
			totalUpvotes: safeNumber(row.total_upvotes),
		};
	}

	if (source === 'news') {
		return {
			sourceCount: safeNumber(row.source_count),
		};
	}

	return {
		marketCount: safeNumber(row.market_count),
		uniqueTraders: safeNumber(row.unique_traders),
		totalLiquidity: safeNumber(row.total_liquidity),
	};
}

function average(values: Array<number | null | undefined>): number | null {
	const numericValues = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
	if (numericValues.length === 0) {
		return null;
	}
	const total = numericValues.reduce((sum, value) => sum + value, 0);
	return round(total / numericValues.length);
}

function calculateAlignment(rows: NormalizedSourceSnapshot[]): CombinedTickerSnapshot['sourceAlignment'] {
	const bullishValues = rows
		.map((row) => row.bullishPct)
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

	if (bullishValues.length === 0) {
		return 'no_data';
	}

	if (bullishValues.length === 1) {
		return 'single_source';
	}

	const minValue = Math.min(...bullishValues);
	const maxValue = Math.max(...bullishValues);

	if (minValue >= 60) {
		return 'aligned_bullish';
	}

	if (maxValue <= 40) {
		return 'aligned_bearish';
	}

	if (maxValue - minValue >= 25) {
		return 'divergent';
	}

	return 'mixed';
}

function safeNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return null;
}

function sortByBuzzDesc<T extends { buzzScore?: number | null; averageBuzz?: number | null }>(left: T, right: T): number {
	const leftBuzz = typeof left.buzzScore === 'number' ? left.buzzScore : left.averageBuzz ?? -1;
	const rightBuzz = typeof right.buzzScore === 'number' ? right.buzzScore : right.averageBuzz ?? -1;
	return rightBuzz - leftBuzz;
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}
