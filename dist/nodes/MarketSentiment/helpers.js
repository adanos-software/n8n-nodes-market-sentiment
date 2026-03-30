"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADANOS_API_BASE_URL = exports.SUPPORTED_SOURCES = void 0;
exports.parseTickerList = parseTickerList;
exports.extractStockRows = extractStockRows;
exports.normalizeCompareRows = normalizeCompareRows;
exports.combineSnapshotsByTicker = combineSnapshotsByTicker;
exports.buildSnapshotResult = buildSnapshotResult;
exports.SUPPORTED_SOURCES = ['reddit', 'x', 'news', 'polymarket'];
exports.ADANOS_API_BASE_URL = 'https://api.adanos.org';
const SOURCE_LABELS = {
    reddit: 'Reddit',
    x: 'X.com',
    news: 'Finance News',
    polymarket: 'Polymarket',
};
function parseTickerList(rawTickers) {
    const seen = new Set();
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
function extractStockRows(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!payload || typeof payload !== 'object') {
        return [];
    }
    const response = payload;
    if (Array.isArray(response.stocks)) {
        return response.stocks;
    }
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return [];
}
function normalizeCompareRows(source, rows) {
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
function combineSnapshotsByTicker(rows) {
    const combined = new Map();
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
            sourceAlignment: 'no_data',
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
function buildSnapshotResult(rawResults, outputMode) {
    if (outputMode === 'raw') {
        return [
            {
                results: rawResults,
            },
        ];
    }
    const normalizedRows = Object.entries(rawResults).flatMap(([source, rows]) => normalizeCompareRows(source, rows ?? []));
    if (outputMode === 'perSource') {
        return normalizedRows.sort(sortByBuzzDesc);
    }
    return combineSnapshotsByTicker(normalizedRows);
}
function getSourceMetadata(source, row) {
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
function average(values) {
    const numericValues = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (numericValues.length === 0) {
        return null;
    }
    const total = numericValues.reduce((sum, value) => sum + value, 0);
    return round(total / numericValues.length);
}
function calculateAlignment(rows) {
    const bullishValues = rows
        .map((row) => row.bullishPct)
        .filter((value) => typeof value === 'number' && Number.isFinite(value));
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
function safeNumber(value) {
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
function sortByBuzzDesc(left, right) {
    const leftBuzz = typeof left.buzzScore === 'number' ? left.buzzScore : left.averageBuzz ?? -1;
    const rightBuzz = typeof right.buzzScore === 'number' ? right.buzzScore : right.averageBuzz ?? -1;
    return rightBuzz - leftBuzz;
}
function round(value) {
    return Math.round(value * 100) / 100;
}
