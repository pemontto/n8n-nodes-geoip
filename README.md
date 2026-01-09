<img src="https://raw.githubusercontent.com/pemontto/n8n-nodes-geoip/master/icons/geoip.svg" width="120" alt="GeoIP Logo" />

# n8n-nodes-geoip

This is an n8n community node for looking up geo info for an IP address.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Operations

The GeoIP node supports the following operations:

- **Lookup All** - Get both location and ASN information in a single lookup (default)
- **Lookup ASN** - Get Autonomous System Number information only
- **Lookup Location** - Get geographic location information only (city, country, coordinates, etc.)

## Features

- Combined lookup mode for location + ASN data in one request
- Simplified output mode with localized location names
- Support for 8 languages (English, Chinese, French, German, Japanese, Portuguese, Russian, Spanish)
- Optional field mapping to customize output structure

## Installation

Install via **Settings > Community Nodes** in n8n and search for `n8n-nodes-geoip`.

See the [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/installation/) for more details.

## Example Workflow

Create your own personal GeoIP API

<img src="./images/workflow.png" width=480 />

```json
$ curl -s "http://localhost:5678/webhook/geo?ip=17.17.1.0" | jq
{
  "ip": "17.17.1.0",
  "city": "Durham",
  "country": "United States",
  "continent": "North America",
  "postal": "27722",
  "registered_country": "United States",
  "coordinates": "35.9935,-78.9032",
  "subdivisions": [
    "North Carolina"
  ],
  "asn": 714,
  "asn_org": "APPLE-ENGINEERING"
}
```

<details>
<summary><b>View workflow JSON</b></summary>

```json
{
  "nodes": [
    {
      "parameters": {
        "path": "geo",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        360,
        240
      ],
      "webhookId": ""
    },
    {
      "parameters": {
        "ip": "={{ $json.query.ip }}",
        "options": {}
      },
      "name": "GeoIP",
      "type": "n8n-nodes-geoip.geoIP",
      "typeVersion": 2,
      "position": [
        560,
        240
      ]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "GeoIP",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

</details>

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](https://github.com/pemontto/n8n-nodes-geoip/blob/master/LICENSE.md)
