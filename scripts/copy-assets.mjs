import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sourceIcon = resolve('nodes/MarketSentiment/marketSentiment.svg');
const targetIcon = resolve('dist/nodes/MarketSentiment/marketSentiment.svg');

mkdirSync(dirname(targetIcon), { recursive: true });
cpSync(sourceIcon, targetIcon);
