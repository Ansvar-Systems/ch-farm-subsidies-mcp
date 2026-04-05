import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface ListSchemeOptionsArgs {
  scheme_id?: string;
  jurisdiction?: string;
}

export function handleListSchemeOptions(db: Database, args: ListSchemeOptionsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  if (args.scheme_id) {
    const scheme = db.get<{ id: string; name: string; scheme_type: string; category: string }>(
      'SELECT id, name, scheme_type, category FROM schemes WHERE (id = ? OR LOWER(name) = LOWER(?)) AND jurisdiction = ?',
      [args.scheme_id, args.scheme_id, jv.jurisdiction]
    );

    if (!scheme) {
      return {
        error: 'not_found',
        message: `Scheme '${args.scheme_id}' not found. Use list_scheme_options without scheme_id to see all categories.`,
      };
    }

    // Get all sub-types within this scheme
    const options = db.all<{
      sub_type: string; zone: string; rate_chf: number; unit: string; conditions: string;
    }>(
      'SELECT DISTINCT sub_type, zone, rate_chf, unit, conditions FROM payment_rates WHERE scheme_id = ? AND jurisdiction = ? ORDER BY sub_type, zone',
      [scheme.id, jv.jurisdiction]
    );

    return {
      scheme_id: scheme.id,
      scheme_name: scheme.name,
      category: scheme.category,
      jurisdiction: jv.jurisdiction,
      options_count: options.length,
      options,
      _meta: buildMeta(),
    };
  }

  // List all schemes grouped by category
  const schemes = db.all<{
    id: string; name: string; scheme_type: string; category: string; description: string;
  }>(
    'SELECT id, name, scheme_type, category, description FROM schemes WHERE jurisdiction = ? ORDER BY category, name',
    [jv.jurisdiction]
  );

  // Group by category
  const grouped: Record<string, { id: string; name: string; scheme_type: string; description: string }[]> = {};
  for (const s of schemes) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push({ id: s.id, name: s.name, scheme_type: s.scheme_type, description: s.description });
  }

  return {
    jurisdiction: jv.jurisdiction,
    total_schemes: schemes.length,
    categories: grouped,
    _meta: buildMeta(),
  };
}
