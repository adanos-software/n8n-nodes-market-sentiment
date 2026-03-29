import type { ICredentialType, INodeProperties } from 'n8n-workflow';

const ADANOS_API_BASE_URL = 'https://api.adanos.org';

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
			baseURL: ADANOS_API_BASE_URL,
			url: '/reddit/stocks/v1/health',
			method: 'GET' as const,
		},
	};
}
