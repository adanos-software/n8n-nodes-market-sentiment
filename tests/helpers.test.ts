import { describe, expect, it } from 'vitest';

import {
	ADANOS_API_BASE_URL,
	buildSnapshotResult,
	combineSnapshotsByTicker,
	extractStockRows,
	normalizeCompareRows,
	parseTickerList,
} from '../nodes/MarketSentiment/helpers';

describe('Market Sentiment helpers', () => {
	it('uses the fixed Adanos API base url', () => {
		expect(ADANOS_API_BASE_URL).toBe('https://api.adanos.org');
	});

	it('parses unique uppercase tickers', () => {
		expect(parseTickerList('aapl, msft, AAPL')).toEqual(['AAPL', 'MSFT']);
	});

	it('extracts rows from stocks and data wrappers', () => {
		expect(extractStockRows([{ ticker: 'TSLA' }])).toHaveLength(1);
		expect(extractStockRows({ stocks: [{ ticker: 'AAPL' }] })).toHaveLength(1);
		expect(extractStockRows({ data: [{ ticker: 'MSFT' }] })).toHaveLength(1);
		expect(extractStockRows({})).toHaveLength(0);
	});

	it('combines multi-source snapshots into one ticker row', () => {
		const redditRows = normalizeCompareRows('reddit', [
			{ ticker: 'AAPL', company_name: 'Apple', buzz_score: 64.2, bullish_pct: 62, mentions: 120, trend: 'rising' },
		]);
		const xRows = normalizeCompareRows('x', [
			{ ticker: 'AAPL', buzz_score: 68.1, bullish_pct: 65, mentions: 90, unique_tweets: 40, trend: 'rising' },
		]);

		const combined = combineSnapshotsByTicker([...redditRows, ...xRows]);

		expect(combined).toHaveLength(1);
		expect(combined[0].ticker).toBe('AAPL');
		expect(combined[0].coverage).toBe(2);
		expect(combined[0].averageBuzz).toBe(66.15);
		expect(combined[0].sourceAlignment).toBe('aligned_bullish');
		expect(combined[0].sources.reddit?.activityLabel).toBe('mentions');
	});

	it('marks mixed consensus as divergent when bullish spread is wide', () => {
		const redditRows = normalizeCompareRows('reddit', [{ ticker: 'TSLA', buzz_score: 80, bullish_pct: 72, mentions: 200 }]);
		const xRows = normalizeCompareRows('x', [{ ticker: 'TSLA', buzz_score: 79, bullish_pct: 38, mentions: 150 }]);

		const combined = combineSnapshotsByTicker([...redditRows, ...xRows]);

		expect(combined[0].sourceAlignment).toBe('divergent');
	});

	it('builds raw and per-source result modes', () => {
		const raw = buildSnapshotResult(
			{
				news: [{ ticker: 'NVDA', buzz_score: 75.2, bullish_pct: 58, mentions: 44 }],
			},
			'raw',
		);
		expect(raw).toHaveLength(1);
		expect((raw[0] as { results: Record<string, unknown> }).results.news).toHaveLength(1);

		const perSource = buildSnapshotResult(
			{
				news: [{ ticker: 'NVDA', buzz_score: 75.2, bullish_pct: 58, mentions: 44 }],
			},
			'perSource',
		);
		expect(perSource).toHaveLength(1);
		expect((perSource[0] as { source: string }).source).toBe('news');
	});

	it('maps polymarket activity to trades instead of mentions', () => {
		const rows = normalizeCompareRows('polymarket', [
			{ ticker: 'MSFT', buzz_score: 61.4, bullish_pct: 54, trade_count: 312, market_count: 14 },
		]);

		expect(rows[0].activityLabel).toBe('trades');
		expect(rows[0].activity).toBe(312);
		expect(rows[0].metadata.marketCount).toBe(14);
	});
});
