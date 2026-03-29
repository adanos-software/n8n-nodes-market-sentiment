import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
	readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as {
	name: string;
	n8n: { credentials: string[]; nodes: string[] };
	scripts: Record<string, string>;
};

describe('package metadata', () => {
	it('uses the expected community node package name', () => {
		expect(packageJson.name).toBe('n8n-nodes-market-sentiment');
	});

	it('exposes one credential and one node entry point', () => {
		expect(packageJson.n8n.credentials).toHaveLength(1);
		expect(packageJson.n8n.nodes).toHaveLength(1);
	});

	it('defines build and test scripts', () => {
		expect(packageJson.scripts.build).toBeTruthy();
		expect(packageJson.scripts.test).toBeTruthy();
	});

	it('uses dist/index.js as package entry point', () => {
		expect(packageJson.main).toBe('dist/index.js');
	});
});
