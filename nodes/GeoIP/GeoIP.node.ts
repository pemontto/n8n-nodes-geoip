import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import geolite2, { GeoIpDbName } from 'geolite2-redist';
// import * as geolite2 from 'geolite2-redist';
// const geolite2 = require('geolite2-redist');
import maxmind, { AsnResponse, CityResponse } from 'maxmind';

export class GeoIPNode implements INodeType {
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let ip: string;

		const lookupType = this.getNodeParameter('lookupType', 0, 'City') as 'City' | 'ASN';

		const reader = await geolite2.open(
			geolite2.GeoIpDbName[lookupType], // Use the enum instead of a string!
			(path) => maxmind.open<CityResponse|AsnResponse>(path),
		);

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				ip = this.getNodeParameter('ip', itemIndex, '') as string;
				item = items[itemIndex];
				console.log(JSON.stringify(item, null, 2));
				item.json.lookup = reader.get(ip);
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
