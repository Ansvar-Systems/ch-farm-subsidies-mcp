import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface SchemeDetailsArgs {
  scheme_id: string;
  jurisdiction?: string;
}

export function handleGetSchemeDetails(db: Database, args: SchemeDetailsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const scheme = db.get<{
    id: string; name: string; scheme_type: string; category: string;
    description: string; legal_basis: string; requirements: string; notes: string;
    language: string; jurisdiction: string;
  }>(
    'SELECT * FROM schemes WHERE (id = ? OR LOWER(name) = LOWER(?)) AND jurisdiction = ?',
    [args.scheme_id, args.scheme_id, jv.jurisdiction]
  );

  if (!scheme) {
    return {
      error: 'not_found',
      message: `Scheme '${args.scheme_id}' not found. Use search_schemes or list_scheme_options to find available schemes.`,
    };
  }

  const rates = db.all<{
    sub_type: string; zone: string; rate_chf: number; unit: string;
    conditions: string; notes: string;
  }>(
    'SELECT sub_type, zone, rate_chf, unit, conditions, notes FROM payment_rates WHERE scheme_id = ? AND jurisdiction = ? ORDER BY zone, sub_type',
    [scheme.id, jv.jurisdiction]
  );

  return {
    ...scheme,
    payment_rates: rates,
    _citation: buildCitation(
      `CH Scheme: ${scheme.name}`,
      scheme.name,
      'get_scheme_details',
      { scheme_id: args.scheme_id },
    ),
    _meta: buildMeta({ source_url: 'https://www.fedlex.admin.ch/eli/cc/2013/765/de' }),
  };
}
