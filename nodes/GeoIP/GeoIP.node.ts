import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { GeoIPV1 } from './v1/GeoIPV1.node';
import { GeoIPV2 } from './v2/GeoIPV2.node';

export class GeoIP extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'GeoIP',
			// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
			name: 'geoIP', // Keep for backwards compatibility with npm v0.0.2
			icon: 'file:../../icons/geoip.svg',
			group: ['transform'],
			description: 'Lookup location or ASN information from an IP address',
			defaultVersion: 2,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new GeoIPV1(baseDescription),
			2: new GeoIPV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
