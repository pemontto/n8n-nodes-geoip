import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import maxmind, { AsnResponse, CityResponse } from 'maxmind';

export function getLanguage(lookupObject: IDataObject, language: string): string {
	if (!lookupObject) {
		return '';
	}
	const languages = (lookupObject.names || {}) as IDataObject;
	return (languages[language] || languages['en']) as string;
}

export async function executeLookup(
	context: IExecuteFunctions,
	lookupType: 'City' | 'ASN' | 'All',
	simplifyOutput: boolean,
	outputField: string,
	language: string,
	simplifyAsn: boolean = false,
): Promise<INodeExecutionData[][]> {
	const items = context.getInputData();
	let item: INodeExecutionData;
	let ip: string;

	const { open, GeoIpDbName } = await import('geolite2-redist');

	// Open readers based on lookup type
	const cityReader =
		lookupType === 'City' || lookupType === 'All'
			? await open(GeoIpDbName.City, (path) => maxmind.open<CityResponse>(path))
			: null;

	const asnReader =
		lookupType === 'ASN' || lookupType === 'All'
			? await open(GeoIpDbName.ASN, (path) => maxmind.open<AsnResponse>(path))
			: null;

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			ip = context.getNodeParameter('ip', itemIndex, '') as string;
			item = items[itemIndex];

			let output: IDataObject = {};

			// City/Location lookup
			if (cityReader) {
				const cityRes = cityReader.get(ip) as IDataObject;
				if (cityRes) {
					if (simplifyOutput) {
						output.city = getLanguage(cityRes.city as IDataObject, language);
						output.country = getLanguage(cityRes.country as IDataObject, language);
						output.location = getLanguage(cityRes.location as IDataObject, language);
						output.continent = getLanguage(cityRes.continent as IDataObject, language);
						output.postal = ((cityRes.postal as IDataObject) || {}).code;
						output.registered_country = getLanguage(
							cityRes.registered_country as IDataObject,
							language,
						);
						const latitude = ((cityRes.location as IDataObject) || {}).latitude;
						const longitude = ((cityRes.location as IDataObject) || {}).longitude;
						if (latitude && longitude) {
							output.coordinates = `${latitude},${longitude}`;
						}
						output.subdivisions = ((cityRes.subdivisions as IDataObject[]) || []).map((x) =>
							getLanguage(x as IDataObject, language),
						);
					} else {
						output = { ...output, ...cityRes };
					}
				}
			}

			// ASN lookup
			if (asnReader) {
				const asnRes = asnReader.get(ip);
				if (asnRes) {
					if (simplifyAsn) {
						output.asn = asnRes.autonomous_system_number;
						output.asn_org = asnRes.autonomous_system_organization;
					} else {
						output = { ...output, ...(asnRes as unknown as IDataObject) };
					}
				}
			}

			if (Object.keys(output).length === 0) {
				continue;
			}

			if (outputField) {
				item.json[outputField] = output;
			} else {
				item.json = { ...item.json, ...output };
			}
		} catch (error) {
			if (context.continueOnFail()) {
				items.push({
					json: context.getInputData(itemIndex)[0].json,
					error,
					pairedItem: itemIndex,
				});
			} else {
				if (error.context) {
					error.context.itemIndex = itemIndex;
					throw error;
				}
				throw new NodeOperationError(context.getNode(), error, {
					itemIndex,
				});
			}
		}
	}

	return context.prepareOutputData(items);
}
