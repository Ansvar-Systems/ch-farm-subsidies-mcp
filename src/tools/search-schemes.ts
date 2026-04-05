import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import { ftsSearch, type Database } from '../db.js';

interface SearchArgs {
  query: string;
  scheme_type?: string;
  jurisdiction?: string;
  limit?: number;
}

export function handleSearchSchemes(db: Database, args: SearchArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const limit = Math.min(args.limit ?? 20, 50);
  let results = ftsSearch(db, args.query, limit);

  if (args.scheme_type) {
    results = results.filter(r => r.scheme_type.toLowerCase() === args.scheme_type!.toLowerCase());
  }

  return {
    query: args.query,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    results: results.map(r => ({
      title: r.title,
      body: r.body,
      scheme_type: r.scheme_type,
      relevance_rank: r.rank,
    })),
    _meta: buildMeta(),
  };
}
