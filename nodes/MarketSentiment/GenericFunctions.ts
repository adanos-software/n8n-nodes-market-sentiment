import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { ADANOS_API_BASE_URL, extractStockRows, type AdanosSource, type SourceRow } from './helpers';

export async function getSourceCompareRows(
	context: IExecuteFunctions,
	itemIndex: number,
	source: AdanosSource,
	tickers: string[],
	days: number,
): Promise<SourceRow[]> {
	const response = await adanosGet(context, itemIndex, `/${source}/stocks/v1/compare`, {
		tickers: tickers.join(','),
		days,
	});

	return extractStockRows(response);
}

export async function getTrendingRows(
	context: IExecuteFunctions,
	itemIndex: number,
	source: AdanosSource,
	days: number,
	limit: number,
	offset: number,
	assetType: 'all' | 'stock' | 'etf',
): Promise<SourceRow[]> {
	const response = await adanosGet(context, itemIndex, `/${source}/stocks/v1/trending`, {
		days,
		limit,
		offset,
		type: assetType,
	});

	return extractStockRows(response);
}

async function adanosGet(
	context: IExecuteFunctions,
	itemIndex: number,
	path: string,
	qs: IDataObject,
): Promise<unknown> {
	await context.getCredentials('adanosApi', itemIndex);

	return context.helpers.httpRequestWithAuthentication.call(
		context,
		'adanosApi',
		{
			method: 'GET',
			url: `${ADANOS_API_BASE_URL}${path}`,
			qs,
			json: true,
		},
	);
}
