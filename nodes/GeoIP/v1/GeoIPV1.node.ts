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
export class GeoIPV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			usableAsTool: true,
			defaults: {
				name: 'GeoIP',
			},
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			properties: [
				{
					displayName: 'Lookup Type',
					name: 'lookupType',
					type: 'options',
					default: 'City',
					options: [
						{
							name: 'Location',
							value: 'City',
						},
						{
							name: 'ASN',
							value: 'ASN',
						},
					],
					description: 'The type of lookup to perform',
				},
				{
					displayName: 'IP',
					name: 'ip',
					type: 'string',
					default: '',
					placeholder: '1.1.1.1',
					description: 'The IP to lookup',
				},
				{
					displayName: 'Simplify',
					name: 'simplifyOutput',
					type: 'boolean',
					default: true,
					description:
						'Whether to return a simplified version of the response instead of the raw data',
					displayOptions: {
						hide: {
							lookupType: ['ASN'],
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
		const lookupType = this.getNodeParameter('lookupType', 0, 'City') as 'City' | 'ASN';
		const simplifyOutput = this.getNodeParameter('simplifyOutput', 0, true) as boolean;
		const outputField = this.getNodeParameter('options.outputField', 0, '') as string;
		const language = this.getNodeParameter('options.language', 0, 'en') as string;

		return executeLookup(this, lookupType, simplifyOutput, outputField, language);
	}
}
