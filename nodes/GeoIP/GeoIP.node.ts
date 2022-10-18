import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import maxmind, { AsnResponse, CityResponse } from 'maxmind';

export function getLanguage(
	lookupObject: IDataObject,
	language: string,

): string {
	if (!lookupObject) {
		return '';
	}
	const languages = (lookupObject.names || {}) as IDataObject;
	return (languages[language] || languages['en']) as string;
}

export class GeoIP implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GeoIP Node',
		name: 'geoIPNode',
		group: ['transform'],
		version: 1,
		description: 'GeoIP node to lookup location or ASN information from an IP',
		defaults: {
			name: 'GeoIP',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Lookup Type',
				name: 'lookupType',
				type: 'options',
				default: 'City',
				options: [
					{
						name: "Location",
						value: "City",
					},
					{
						name: "ASN",
						value: "ASN",
					},
				],
				description: 'The IP to Lookup',
			},
			{
				displayName: 'IP',
				name: 'ip',
				type: 'string',
				default: '',
				placeholder: '1.1.1.1',
				description: 'The IP to Lookup',
			},
			{
				displayName: 'Simplify',
				name: 'simplifyOutput',
				type: 'boolean',
				default: true,
				description: 'Whether to return a simplified version of the response instead of the raw data',
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
								'/simplifyOutput': [ true ],
							},
						},
						options: [
							{ name: 'Chinese', value: 'zh-CN' },
							{ name: 'English', value: 'en' },
							{ name: 'French', value: 'fr' },
							{ name: 'German', value: 'de' },
							{ name: 'Japansese', value: 'ja' },
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let ip: string;

		const lookupType = this.getNodeParameter('lookupType', 0, 'City') as 'City' | 'ASN';
		const simplifyOutput = this.getNodeParameter('simplifyOutput', 0, true) as boolean;
		const outputField = this.getNodeParameter('options.outputField', 0, '') as string;
		const language = this.getNodeParameter('options.language', 0, 'en') as string;

		const { open, GeoIpDbName } = await import("geolite2-redist");
		const reader = await open(
			GeoIpDbName[lookupType],
			(path) => maxmind.open<CityResponse|AsnResponse>(path),
		);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				ip = this.getNodeParameter('ip', itemIndex, '') as string;
				item = items[itemIndex];

				let output: IDataObject = {};
				const res = reader.get(ip) as IDataObject;

				if (!res) {
					continue;
				}

				if (simplifyOutput && lookupType === "City") {
					output.city = getLanguage(res.city as IDataObject, language);
					output.country = getLanguage(res.country as IDataObject, language);
					output.location = getLanguage(res.location as IDataObject, language);
					output.continent = getLanguage(res.continent as IDataObject, language);
					output.postal = (res.postal as IDataObject || {} ).code;
					output.registered_country = getLanguage(res.registered_country as IDataObject, language);
					const latitude = (res.location as IDataObject || {} ).latitude;
					const longitude = (res.location as IDataObject || {} ).longitude;
					if (latitude && longitude) {
						output.coordinates = `${latitude},${longitude}`;
					}
					output.subdivisions = (res.subdivisions as IDataObject[] || []).map(
						x => getLanguage(x as IDataObject, language),
					);
				} else {
					output = res;
				}

				if (outputField) {
					item.json[outputField] = output;
				} else {
					item.json = { ...item.json, ...output};
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
