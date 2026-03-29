"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceCompareRows = getSourceCompareRows;
exports.getTrendingRows = getTrendingRows;
const helpers_1 = require("./helpers");
async function getSourceCompareRows(context, itemIndex, source, tickers, days) {
    const response = await adanosGet(context, itemIndex, `/${source}/stocks/v1/compare`, {
        tickers: tickers.join(','),
        days,
    });
    return (0, helpers_1.extractStockRows)(response);
}
async function getTrendingRows(context, itemIndex, source, days, limit, offset, assetType) {
    const response = await adanosGet(context, itemIndex, `/${source}/stocks/v1/trending`, {
        days,
        limit,
        offset,
        type: assetType,
    });
    return (0, helpers_1.extractStockRows)(response);
}
async function adanosGet(context, itemIndex, path, qs) {
    const credentials = await context.getCredentials('adanosApi', itemIndex);
    const baseUrl = (0, helpers_1.normalizeBaseUrl)(credentials.baseUrl);
    return context.helpers.httpRequestWithAuthentication.call(context, 'adanosApi', {
        method: 'GET',
        url: `${baseUrl}${path}`,
        qs,
        json: true,
    });
}
