import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'Direktzahlungsverordnung (DZV, SR 910.13)',
      authority: 'Bundesamt fuer Landwirtschaft (BLW)',
      official_url: 'https://www.fedlex.admin.ch/eli/cc/2013/765/de',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual (with AP 22+ updates)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'All direct payment types, rates, OELN requirements, zone differentiation',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'BLW Weisungen und Erlaeuterungen zur DZV',
      authority: 'Bundesamt fuer Landwirtschaft (BLW)',
      official_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Detailed implementation guidance, OELN verification, BFF specifications',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Agrarbericht',
      authority: 'Bundesamt fuer Landwirtschaft (BLW)',
      official_url: 'https://www.agrarbericht.ch/',
      retrieval_method: 'HTML_EXTRACT',
      update_frequency: 'annual',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Payment statistics, participation rates, policy evaluation',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Agate-Portal Anmeldeinformationen',
      authority: 'BLW / Kantonale Landwirtschaftsaemter',
      official_url: 'https://www.agate.ch/',
      retrieval_method: 'HTML_EXTRACT',
      update_frequency: 'annual (application cycle)',
      license: 'Public administration information',
      coverage: 'Application deadlines, forms, filing guidance, common errors',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta(),
  };
}
