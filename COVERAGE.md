# Coverage -- ch-farm-subsidies-mcp

**Jurisdiction:** Switzerland (CH)
**Last updated:** 2026-04-05
**Schema version:** 1.0

## Data Summary

| Dataset | Count | Description |
|---------|-------|-------------|
| Schemes | 20 | Direct payment schemes across 7 categories |
| Payment rates | 80 | Zone-differentiated rates in CHF (per ha, GVE, or NST) |
| OELN requirements | 12 | Ecological proof of performance requirements |
| Application guidance | 8 | Agate portal filing guidance entries |
| Tools | 10 | 7 domain tools + 3 mandatory meta-tools |

## Payment Categories Covered

| Category | German Name | Included |
|----------|-------------|----------|
| Kulturlandschaft | Kulturlandschaftsbeitraege | Yes |
| Versorgungssicherheit | Versorgungssicherheitsbeitraege | Yes |
| Biodiversitaet | Biodiversitaetsbeitraege | Yes |
| Landschaftsqualitaet | Landschaftsqualitaetsbeitraege | Yes |
| Produktionssystem | Produktionssystembeitraege | Yes |
| Ressourceneffizienz | Ressourceneffizienzbeitraege | Yes |
| Uebergang | Uebergangsbeitraege | Yes |

## Altitude Zones

Rates are differentiated across these zones where applicable:

- Talzone (lowland)
- Huegelzone (hill)
- Bergzone I-IV (mountain zones)
- Soemmerungsgebiet (summering area)

## Sources

| Source | Authority | Coverage |
|--------|-----------|----------|
| DZV (SR 910.13) | BLW | All payment types, rates, OELN, zone differentiation |
| BLW Weisungen | BLW | Implementation guidance, OELN verification, BFF specs |
| Agrarbericht | BLW | Payment statistics, participation rates, policy evaluation |
| Agate-Portal | BLW / Kantone | Application deadlines, forms, filing guidance |

## What Is NOT Covered

| Gap | Reason |
|-----|--------|
| Cantonal supplementary payments | Cantonal programmes vary by canton; no consolidated federal dataset |
| Landschaftsqualitaet project-specific rates | LQ payments are project-based (cantonal/regional); only framework rates included |
| Historical payment rates (pre-2023) | Only current (AP 22+) rates are ingested |
| Individual farm payment calculations | Farm-specific calculations require Agate portal or cantonal office |
| Soemmerungsbeitraege detailed NST tables | Summering payments depend on stocking density (Normalstoss), only base rates included |
| French/Italian language guidance | Application guidance is primarily in German; search supports multilingual queries but source text is DE |
| Alpine economy (Alpwirtschaft) structural payments | Structural improvement subsidies are separate from Direktzahlungen |
| Einzelkulturbeitraege detail | Individual crop payments (sugar beet, rapeseed, etc.) are listed but not broken down by sub-variant |

## Limitations

- **Not legally binding.** This server provides informational data only. The authoritative sources are the DZV (SR 910.13), BLW Weisungen, and cantonal regulations. Always verify with the cantonal agricultural office (kantonales Landwirtschaftsamt) or Agate portal.
- **Annual update cycle.** Swiss direct payment rates change with each Agrarpolitik revision. Data may lag behind recent parliamentary decisions.
- **Eligibility checks are approximate.** The `check_eligibility` tool uses keyword matching against scheme descriptions. It is not a substitute for the official Agate portal calculation.
- **OELN requirements are federal-level.** Some cantons impose additional ecological requirements beyond the federal OELN baseline.
