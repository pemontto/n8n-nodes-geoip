import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { executeLookup } from '../utils';

// eslint-disable-next-line @n8n/community-nodes/icon-validation
export class GeoIPV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 2,
			usableAsTool: true,
			defaults: {
				name: 'GeoIP',
			},
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			properties: [
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					default: 'ip',
					options: [
						{
							name: 'IP Address',
							value: 'ip',
						},
					],
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					default: 'all',
					displayOptions: {
						show: {
							resource: ['ip'],
						},
					},
					options: [
						{
							name: 'Lookup All',
							value: 'all',
							description: 'Get both location and ASN information for an IP address',
							action: 'Lookup all information for an IP address',
						},
						{
							name: 'Lookup ASN',
							value: 'asn',
							description: 'Get ASN (Autonomous System Number) information for an IP address',
							action: 'Lookup ASN for an IP address',
						},
						{
							name: 'Lookup Location',
							value: 'location',
							description: 'Get geographic location information for an IP address',
							action: 'Lookup location for an IP address',
						},
					],
				},
				{
					displayName: 'IP',
					name: 'ip',
					type: 'string',
					default: '',
					required: true,
					placeholder: '1.1.1.1',
					description: 'The IP address to lookup',
				},
				{
					displayName: 'Simplify',
					name: 'simplifyOutput',
					type: 'boolean',
					default: true,
					description:
						'Whether to return a simplified version of the response instead of the raw data',
					displayOptions: {
						show: {
							operation: ['location', 'all'],
						},
					},
				},
				{
					displayName: 'Options',
					name: 'options',
					type: 'collection',
					placeholder: 'Add Option',
					default: {},
					options: [
						{
							displayName: 'Put Output In Field',
							name: 'outputField',
							type: 'string',
							default: '',
							placeholder: 'geo',
							description: 'The name of the output field to put the lookup data in',
						},
						{
							displayName: 'Language',
							name: 'language',
							type: 'options',
							displayOptions: {
								show: {
									'/simplifyOutput': [true],
									'/operation': ['location', 'all'],
								},
							},
							options: [
								{ name: 'Chinese', value: 'zh-CN' },
								{ name: 'English', value: 'en' },
								{ name: 'French', value: 'fr' },
								{ name: 'German', value: 'de' },
								{ name: 'Japanese', value: 'ja' },
								{ name: 'Portuguese', value: 'pt-BR' },
								{ name: 'Russian', value: 'ru' },
								{ name: 'Spanish', value: 'es' },
							],
							default: 'en',
							description: 'Language to display location names in',
						},
					],
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const lookupType = operation === 'asn' ? 'ASN' : operation === 'all' ? 'All' : 'City';
		const simplifyOutput = this.getNodeParameter('simplifyOutput', 0, true) as boolean;
		const outputField = this.getNodeParameter('options.outputField', 0, '') as string;
		const language = this.getNodeParameter('options.language', 0, 'en') as string;

		return executeLookup(this, lookupType, simplifyOutput, outputField, language, true);
	}
}
