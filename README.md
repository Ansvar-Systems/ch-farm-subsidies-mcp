# Switzerland Farm Subsidies MCP

[![CI](https://github.com/ansvar-systems/ch-farm-subsidies-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ansvar-systems/ch-farm-subsidies-mcp/actions/workflows/ci.yml)
[![Build and Push to GHCR](https://github.com/ansvar-systems/ch-farm-subsidies-mcp/actions/workflows/ghcr-build.yml/badge.svg)](https://github.com/ansvar-systems/ch-farm-subsidies-mcp/actions/workflows/ghcr-build.yml)
[![npm](https://img.shields.io/npm/v/@ansvar/ch-farm-subsidies-mcp)](https://www.npmjs.com/package/@ansvar/ch-farm-subsidies-mcp)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Swiss direct payment system (Direktzahlungen) based on the Direct Payments Ordinance (DZV, SR 910.13) and Federal Office for Agriculture (BLW) directives. Covers all 7 payment categories, OELN ecological proof of performance, zone-differentiated payment rates, and Agate portal application guidance.

**Jurisdiction:** Switzerland (CH)

## Payment Categories

| Category | German Name | Description |
|----------|-------------|-------------|
| Kulturlandschaft | Kulturlandschaftsbeitraege | Upland, slope, and alpine grazing payments |
| Versorgungssicherheit | Versorgungssicherheitsbeitraege | Food supply security (arable, grassland, base payments) |
| Biodiversitaet | Biodiversitaetsbeitraege | Biodiversity promotion areas (BFF), quality levels I/II |
| Landschaftsqualitaet | Landschaftsqualitaetsbeitraege | Landscape quality projects (cantonal programmes) |
| Produktionssystem | Produktionssystembeitraege | Organic, extenso, GMO-free, animal welfare |
| Ressourceneffizienz | Ressourceneffizienzbeitraege | Resource efficiency (precision farming, soil protection) |
| Uebergang | Uebergangsbeitraege | Transitional payments (AP 14-17 to AP 22+) |

## Quick Start

### npx (stdio)

```bash
npx -y @ansvar/ch-farm-subsidies-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ch-farm-subsidies": {
      "command": "npx",
      "args": ["-y", "@ansvar/ch-farm-subsidies-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add ch-farm-subsidies -- npx -y @ansvar/ch-farm-subsidies-mcp
```

### Streamable HTTP (remote)

```
https://mcp.ansvar.eu/ch-farm-subsidies/mcp
```

No authentication required.

### Docker

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/ch-farm-subsidies-mcp:latest
```

The HTTP server exposes `/mcp` (Streamable HTTP) and `/health` (health check).

## Tools

| Tool | Description |
|------|-------------|
| `about` | Server metadata: name, version, coverage, data sources, links |
| `list_sources` | All data sources with authority, URL, license, freshness |
| `check_data_freshness` | Staleness status, last ingest date, refresh command |
| `search_schemes` | FTS5 search across all direct payment schemes |
| `get_scheme_details` | Full details for a specific scheme: requirements, rates, legal basis |
| `get_payment_rates` | CHF rates per unit (ha, GVE, NST), filterable by altitude zone |
| `check_eligibility` | Eligible schemes for a farm based on land type, zone, farm type |
| `list_scheme_options` | All options within a payment category, or all categories |
| `get_oeln_requirements` | OELN ecological requirements (all 12 or a specific one) |
| `search_application_guidance` | Agate portal guidance: deadlines, process, documents, common mistakes |

See [TOOLS.md](TOOLS.md) for full parameter documentation and examples.

## Data

- **20** direct payment schemes across 7 categories
- **80** zone-differentiated payment rates
- **12** OELN ecological requirements
- **8** application guidance entries
- **FTS5** full-text search with tiered fallback (phrase, AND, prefix, stemmed, OR, LIKE)

See [COVERAGE.md](COVERAGE.md) for full coverage details and known gaps.

## Sources

| Source | Authority | URL |
|--------|-----------|-----|
| Direktzahlungsverordnung (DZV, SR 910.13) | BLW | [fedlex.admin.ch](https://www.fedlex.admin.ch/eli/cc/2013/765/de) |
| BLW Weisungen und Erlaeuterungen | BLW | [blw.admin.ch](https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen.html) |
| Agrarbericht | BLW | [agrarbericht.ch](https://www.agrarbericht.ch/) |
| Agate-Portal | BLW / Kantone | [agate.ch](https://www.agate.ch/) |

All sources are official Swiss federal publications, freely reusable.

## Legal

- **Disclaimer:** [DISCLAIMER.md](DISCLAIMER.md) -- not legal advice, verify with cantonal authorities
- **Privacy:** [PRIVACY.md](PRIVACY.md) -- no personal data collected
- **Security:** [SECURITY.md](SECURITY.md) -- responsible disclosure

## Development

```bash
npm ci
npm run build
npm test
npm run lint
npm run dev          # stdio watch mode
npm run start:http   # HTTP server on port 3000
```

## License

Apache-2.0 -- see [LICENSE](LICENSE).

Copyright 2026 [Ansvar Systems](https://ansvar.eu)

Part of the [Ansvar MCP Network](https://ansvar.ai/mcp).
