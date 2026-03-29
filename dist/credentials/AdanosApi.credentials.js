"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdanosApi = void 0;
const ADANOS_API_BASE_URL = 'https://api.adanos.org';
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
                baseURL: ADANOS_API_BASE_URL,
                url: '/reddit/stocks/v1/health',
                method: 'GET',
            },
        };
    }
}
exports.AdanosApi = AdanosApi;
