import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface OelnArgs {
  requirement_id?: string;
  jurisdiction?: string;
}

export function handleGetOelnRequirements(db: Database, args: OelnArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  if (args.requirement_id) {
    const num = parseInt(args.requirement_id, 10);
    const req = db.get<{
      id: number; requirement_number: number; title: string; description: string;
      verification: string; sanctions: string; legal_reference: string;
    }>(
      'SELECT * FROM oeln_requirements WHERE (requirement_number = ? OR id = ?) AND jurisdiction = ?',
      [isNaN(num) ? -1 : num, args.requirement_id, jv.jurisdiction]
    );

    if (!req) {
      return {
        error: 'not_found',
        message: `OELN requirement '${args.requirement_id}' not found. Use get_oeln_requirements without requirement_id to list all.`,
      };
    }

    return {
      ...req,
      jurisdiction: jv.jurisdiction,
      _meta: buildMeta({ source_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/oekologischer-leistungsnachweis.html' }),
    };
  }

  const requirements = db.all<{
    requirement_number: number; title: string; description: string;
    verification: string; sanctions: string; legal_reference: string;
  }>(
    'SELECT requirement_number, title, description, verification, sanctions, legal_reference FROM oeln_requirements WHERE jurisdiction = ? ORDER BY requirement_number',
    [jv.jurisdiction]
  );

  return {
    jurisdiction: jv.jurisdiction,
    total_requirements: requirements.length,
    note: 'Alle Direktzahlungen setzen die vollstaendige Einhaltung des Oekologischen Leistungsnachweises (OELN) voraus.',
    requirements,
    _meta: buildMeta({ source_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/oekologischer-leistungsnachweis.html' }),
  };
}
