import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Switzerland Farm Subsidies MCP',
    description:
      'Swiss direct payment system (Direktzahlungen) based on the DZV (SR 910.13) and BLW directives. ' +
      'Covers all 7 payment categories: Kulturlandschaftsbeitraege, Versorgungssicherheitsbeitraege, ' +
      'Biodiversitaetsbeitraege, Landschaftsqualitaetsbeitraege, Produktionssystembeitraege, ' +
      'Ressourceneffizienzbeitraege, and Uebergangsbeitraege. Includes OELN requirements, ' +
      'zone-differentiated rates, and Agate application guidance.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'Direktzahlungsverordnung DZV (SR 910.13)',
      'Bundesamt fuer Landwirtschaft (BLW) Weisungen',
      'Agrarbericht (BLW)',
      'Agate-Portal Anmeldeformulare',
    ],
    tools_count: 10,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/ch-farm-subsidies-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
