import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AdanosApi implements ICredentialType {
	name = 'adanosApi';

	displayName = 'Adanos API';

	documentationUrl = 'https://api.adanos.org/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API key for Adanos market sentiment endpoints',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.adanos.org',
			required: true,
			description: 'Override only for self-hosted or local API environments',
		},
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/reddit/stocks/v1/health',
			method: 'GET' as const,
		},
	};
}
