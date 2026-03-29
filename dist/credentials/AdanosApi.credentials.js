"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdanosApi = void 0;
class AdanosApi {
    constructor() {
        this.name = 'adanosApi';
        this.displayName = 'Adanos API';
        this.documentationUrl = 'https://api.adanos.org/docs';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'X-API-Key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/reddit/stocks/v1/health',
                method: 'GET',
            },
        };
    }
}
exports.AdanosApi = AdanosApi;
