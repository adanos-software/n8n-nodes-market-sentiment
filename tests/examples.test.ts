import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const EXAMPLES_DIR = join(__dirname, '..', 'examples');
const exampleFiles = readdirSync(EXAMPLES_DIR).filter((name) => name.endsWith('.json')).sort();

const VALID_OPERATIONS = new Set(['getStockSnapshot', 'getTrendingStocks', 'enrichIncomingItems']);

type WorkflowNode = {
	name: string;
	type: string;
	parameters?: Record<string, unknown>;
};

type WorkflowFile = {
	name: string;
	nodes: WorkflowNode[];
};

function readWorkflow(name: string): WorkflowFile {
	return JSON.parse(readFileSync(join(EXAMPLES_DIR, name), 'utf8')) as WorkflowFile;
}

describe('example workflows', () => {
	it('ships importable workflow examples', () => {
		expect(exampleFiles.length).toBeGreaterThanOrEqual(5);
	});

	it('keeps workflow names unique', () => {
		const names = exampleFiles.map((name) => readWorkflow(name).name);
		expect(new Set(names).size).toBe(names.length);
	});

	it('uses the market sentiment node with supported operations', () => {
		for (const file of exampleFiles) {
			const workflow = readWorkflow(file);
			const marketSentimentNodes = workflow.nodes.filter(
				(node) => node.type === 'n8n-nodes-market-sentiment.marketSentiment',
			);

			expect(marketSentimentNodes.length, `${file} should include the market sentiment node`).toBeGreaterThan(0);
			for (const node of marketSentimentNodes) {
				const operation = node.parameters?.operation;
				expect(VALID_OPERATIONS.has(String(operation)), `${file} uses an unsupported operation`).toBe(true);
			}
		}
	});

	it('includes manual smoke tests for snapshot and enrichment flows', () => {
		const manualSnapshot = readWorkflow('manual-snapshot-validation.workflow.json');
		const manualEnrichment = readWorkflow('manual-enrichment-validation.workflow.json');

		expect(manualSnapshot.nodes.some((node) => node.type === 'n8n-nodes-base.manualTrigger')).toBe(true);
		expect(manualEnrichment.nodes.some((node) => node.type === 'n8n-nodes-base.manualTrigger')).toBe(true);
		expect(manualEnrichment.nodes.some((node) => node.type === 'n8n-nodes-base.code')).toBe(true);
	});
});
