# Tools Reference -- ch-farm-subsidies-mcp

10 tools covering Swiss direct payments (Direktzahlungen), OELN requirements, payment rates, eligibility checks, and application guidance.

---

## about

Server metadata including name, version, jurisdiction, data sources, tool count, and links.

**Parameters:** None

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Server display name |
| `description` | string | Full description of coverage |
| `version` | string | Server version |
| `jurisdiction` | string[] | Supported jurisdictions (`["CH"]`) |
| `data_sources` | string[] | Data source names |
| `tools_count` | number | Total tool count |
| `links` | object | Homepage, repository, MCP network URLs |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
{
  "name": "Switzerland Farm Subsidies MCP",
  "version": "0.1.0",
  "jurisdiction": ["CH"],
  "tools_count": 10
}
```

---

## list_sources

All data sources with authority, official URL, retrieval method, update frequency, license, and last-retrieved date.

**Parameters:** None

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `sources` | Source[] | Array of source objects |
| `_meta` | object | Disclaimer, copyright, data age |

Each source has: `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

**Example:**

```json
{
  "sources": [
    {
      "name": "Direktzahlungsverordnung (DZV, SR 910.13)",
      "authority": "Bundesamt fuer Landwirtschaft (BLW)",
      "official_url": "https://www.fedlex.admin.ch/eli/cc/2013/765/de",
      "license": "Swiss Federal Administration — free reuse"
    }
  ]
}
```

---

## check_data_freshness

Reports staleness status, last ingest date, schema version, days since ingest, and the command to trigger a manual refresh.

**Parameters:** None

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"fresh"` \| `"stale"` \| `"unknown"` | Staleness status (threshold: 90 days) |
| `last_ingest` | string \| null | ISO date of last ingestion |
| `build_date` | string \| null | ISO date of DB build |
| `schema_version` | string \| null | Database schema version |
| `days_since_ingest` | number \| null | Days since last ingest |
| `staleness_threshold_days` | number | Staleness threshold (90) |
| `refresh_command` | string | GitHub CLI command to trigger ingestion |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
{
  "status": "fresh",
  "last_ingest": "2026-04-05",
  "days_since_ingest": 0,
  "staleness_threshold_days": 90,
  "refresh_command": "gh workflow run ingest.yml -R ansvar-systems/ch-farm-subsidies-mcp"
}
```

---

## search_schemes

Full-text search across all Swiss direct payment schemes. Uses FTS5 with tiered fallback: exact phrase, AND, prefix, stemmed prefix, OR, LIKE.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | -- | Free-text search (German, French, or English) |
| `scheme_type` | string | No | -- | Filter by type: `kulturlandschaft`, `versorgungssicherheit`, `biodiversitaet`, `landschaftsqualitaet`, `produktionssystem`, `ressourceneffizienz`, `tierwohl` |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |
| `limit` | number | No | 20 | Max results (capped at 50) |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Original search query |
| `jurisdiction` | string | Resolved jurisdiction |
| `results_count` | number | Number of results |
| `results` | object[] | Each with `title`, `body`, `scheme_type`, `relevance_rank` |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
// search_schemes({ "query": "Hangbeitrag" })
{
  "query": "Hangbeitrag",
  "jurisdiction": "CH",
  "results_count": 2,
  "results": [
    {
      "title": "Hangbeitrag",
      "body": "Beitraege fuer Flaechen mit Hangneigung...",
      "scheme_type": "kulturlandschaft",
      "relevance_rank": -8.2
    }
  ]
}
```

**Jurisdiction validation:** Passing a non-CH jurisdiction returns an error with supported jurisdictions.

---

## get_scheme_details

Full details for a specific direct payment scheme, including description, legal basis, requirements, notes, and all zone-differentiated payment rates.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scheme_id` | string | Yes | -- | Scheme ID (e.g. `kulturlandschaft-hangbeitrag`) or scheme name |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Scheme ID |
| `name` | string | Scheme name |
| `scheme_type` | string | Payment category |
| `category` | string | Category grouping |
| `description` | string | Full description |
| `legal_basis` | string | Legal reference (DZV article) |
| `requirements` | string | Eligibility requirements |
| `notes` | string | Additional notes |
| `payment_rates` | object[] | All rates with `sub_type`, `zone`, `rate_chf`, `unit`, `conditions`, `notes` |
| `_meta` | object | Disclaimer, copyright, source URL (fedlex.admin.ch) |

**Example:**

```json
// get_scheme_details({ "scheme_id": "versorgung-basis-acker" })
{
  "id": "versorgung-basis-acker",
  "name": "Basisbeitrag offene Ackerflaeche",
  "scheme_type": "versorgungssicherheit",
  "legal_basis": "DZV Art. 52",
  "payment_rates": [
    { "sub_type": "basis", "zone": "talzone", "rate_chf": 900, "unit": "CHF/ha" }
  ]
}
```

Returns `error: "not_found"` if the scheme does not exist.

---

## get_payment_rates

Payment rates for a scheme in CHF per unit (ha, GVE, NST), optionally filtered by altitude zone.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scheme_id` | string | Yes | -- | Scheme ID or scheme name |
| `zone` | string | No | all zones | Altitude zone: `talzone`, `huegelzone`, `bergzone_i`, `bergzone_ii`, `bergzone_iii`, `bergzone_iv`, `soemmerungsgebiet` |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `scheme_id` | string | Resolved scheme ID |
| `scheme_name` | string | Display name |
| `scheme_type` | string | Payment category |
| `zone_filter` | string | Applied zone filter or `alle` |
| `jurisdiction` | string | Resolved jurisdiction |
| `results_count` | number | Number of rate entries |
| `rates` | object[] | Each with `sub_type`, `zone`, `rate_chf`, `unit`, `conditions`, `notes` |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
// get_payment_rates({ "scheme_id": "kulturlandschaft-hangbeitrag", "zone": "bergzone_ii" })
{
  "scheme_id": "kulturlandschaft-hangbeitrag",
  "zone_filter": "bergzone_ii",
  "rates": [
    { "sub_type": "18-35%", "zone": "bergzone_ii", "rate_chf": 410, "unit": "CHF/ha" }
  ]
}
```

Returns `error: "not_found"` if scheme or zone combination has no rates.

---

## check_eligibility

Determines which direct payment schemes a farm is eligible for based on land type, altitude zone, and farm type. Always notes the OELN prerequisite.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `land_type` | string | Yes | -- | Land type: `offene Ackerflaeche`, `Dauergruenland`, `BFF`, `Alpweide`, `Rebflaeche` |
| `zone` | string | No | `talzone` | Altitude zone |
| `farm_type` | string | No | `nicht angegeben` | Farm type: `Bio`, `Extenso`, `konventionell`, `Milchwirtschaft`, `Mutterkuh` |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `land_type` | string | Input land type |
| `zone` | string | Resolved zone |
| `farm_type` | string | Resolved farm type |
| `jurisdiction` | string | Resolved jurisdiction |
| `oeln_prerequisite` | string | OELN requirement note (always present) |
| `eligible_schemes_count` | number | Number of eligible schemes |
| `eligible_schemes` | object[] | Each with `scheme_id`, `scheme_name`, `category`, `applicable_rates`, `requirements` |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
// check_eligibility({ "land_type": "offene Ackerflaeche", "zone": "talzone", "farm_type": "Bio" })
{
  "land_type": "offene Ackerflaeche",
  "zone": "talzone",
  "farm_type": "Bio",
  "oeln_prerequisite": "Alle Direktzahlungen setzen die Einhaltung des OELN voraus...",
  "eligible_schemes_count": 8,
  "eligible_schemes": [...]
}
```

---

## list_scheme_options

Lists all options within a specific payment category (if `scheme_id` given), or lists all categories and their schemes (if omitted). Use this to discover available scheme IDs.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `scheme_id` | string | No | -- | Scheme ID to get sub-options. Omit to list all categories |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns (with scheme_id):**

| Field | Type | Description |
|-------|------|-------------|
| `scheme_id` | string | Resolved scheme ID |
| `scheme_name` | string | Display name |
| `category` | string | Category |
| `jurisdiction` | string | Resolved jurisdiction |
| `options_count` | number | Number of options |
| `options` | object[] | Each with `sub_type`, `zone`, `rate_chf`, `unit`, `conditions` |
| `_meta` | object | Disclaimer, copyright, data age |

**Returns (without scheme_id):**

| Field | Type | Description |
|-------|------|-------------|
| `jurisdiction` | string | Resolved jurisdiction |
| `total_schemes` | number | Total scheme count |
| `categories` | object | Keyed by category, each an array of `{ id, name, scheme_type, description }` |
| `_meta` | object | Disclaimer, copyright, data age |

**Example:**

```json
// list_scheme_options({})
{
  "jurisdiction": "CH",
  "total_schemes": 20,
  "categories": {
    "kulturlandschaft": [
      { "id": "kulturlandschaft-hangbeitrag", "name": "Hangbeitrag", "scheme_type": "kulturlandschaft" }
    ]
  }
}
```

---

## get_oeln_requirements

OELN (Oekologischer Leistungsnachweis) requirements -- the mandatory ecological proof of performance that is a prerequisite for receiving any Swiss direct payment.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `requirement_id` | string | No | -- | Requirement number (1-12) or ID. Omit to list all |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns (all requirements):**

| Field | Type | Description |
|-------|------|-------------|
| `jurisdiction` | string | Resolved jurisdiction |
| `total_requirements` | number | Count (12) |
| `note` | string | OELN prerequisite note |
| `requirements` | object[] | Each with `requirement_number`, `title`, `description`, `verification`, `sanctions`, `legal_reference` |
| `_meta` | object | Disclaimer, copyright, source URL |

**Returns (single requirement):**

All fields of the requirement plus `jurisdiction` and `_meta`.

**Example:**

```json
// get_oeln_requirements({ "requirement_id": "3" })
{
  "requirement_number": 3,
  "title": "Geregelte Fruchtfolge",
  "description": "Mindestens 4 verschiedene Kulturen...",
  "verification": "Betriebsspezifische Fruchtfolge-Dokumentation",
  "sanctions": "Kuerzung oder Verweigerung der Direktzahlungen"
}
```

Returns `error: "not_found"` if the requirement number does not exist.

---

## search_application_guidance

Searches Agate portal filing guidance: deadlines, application process, required documents, and common mistakes. Uses LIKE-based text matching across topic, title, and body fields. Returns all guidance if no results match.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | -- | Free-text search about application process |
| `jurisdiction` | string | No | `CH` | ISO 3166-1 alpha-2 code |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Original search query |
| `jurisdiction` | string | Resolved jurisdiction |
| `results_count` | number | Number of results |
| `results` | object[] | Each with `topic`, `title`, `body`, `deadline`, `portal`, `legal_reference` |
| `_meta` | object | Disclaimer, copyright, source URL (agate.ch) |

**Example:**

```json
// search_application_guidance({ "query": "Anmeldefrist Fruehjahr" })
{
  "query": "Anmeldefrist Fruehjahr",
  "jurisdiction": "CH",
  "results_count": 1,
  "results": [
    {
      "topic": "Anmeldefristen",
      "title": "Fruehjahrsanmeldung Direktzahlungen",
      "body": "Die Anmeldung erfolgt jaehrlich...",
      "deadline": "Ende Februar",
      "portal": "agate.ch"
    }
  ]
}
```
