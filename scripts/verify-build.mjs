import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredFiles = [
	resolve('dist/index.js'),
	resolve('dist/credentials/AdanosApi.credentials.js'),
	resolve('dist/nodes/MarketSentiment/MarketSentiment.node.js'),
	resolve('dist/nodes/MarketSentiment/marketSentiment.svg'),
];

const missing = requiredFiles.filter((filePath) => !existsSync(filePath));

if (missing.length > 0) {
	console.error('Missing build artifacts:');
	for (const filePath of missing) {
		console.error(`- ${filePath}`);
	}
	process.exit(1);
}
