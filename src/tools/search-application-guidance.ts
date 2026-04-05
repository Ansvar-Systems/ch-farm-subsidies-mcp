import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface GuidanceArgs {
  query: string;
  jurisdiction?: string;
}

export function handleSearchApplicationGuidance(db: Database, args: GuidanceArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const queryLower = args.query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 1);

  // Search application_guidance by topic and body using LIKE
  const likeConditions = words.map(() =>
    '(LOWER(topic) LIKE ? OR LOWER(title) LIKE ? OR LOWER(body) LIKE ?)'
  ).join(' AND ');
  const likeParams = words.flatMap(w => [`%${w}%`, `%${w}%`, `%${w}%`]);

  let results: { topic: string; title: string; body: string; deadline: string; portal: string; legal_reference: string }[] = [];

  if (words.length > 0) {
    try {
      results = db.all<{
        topic: string; title: string; body: string; deadline: string;
        portal: string; legal_reference: string;
      }>(
        `SELECT topic, title, body, deadline, portal, legal_reference FROM application_guidance WHERE ${likeConditions} AND jurisdiction = ? ORDER BY topic LIMIT 20`,
        [...likeParams, jv.jurisdiction]
      );
    } catch {
      // fallback: return all
    }
  }

  // If no results from text search, return all guidance
  if (results.length === 0) {
    results = db.all<{
      topic: string; title: string; body: string; deadline: string;
      portal: string; legal_reference: string;
    }>(
      'SELECT topic, title, body, deadline, portal, legal_reference FROM application_guidance WHERE jurisdiction = ? ORDER BY topic LIMIT 20',
      [jv.jurisdiction]
    );
  }

  return {
    query: args.query,
    jurisdiction: jv.jurisdiction,
    results_count: results.length,
    results,
    _meta: buildMeta({ source_url: 'https://www.agate.ch/' }),
  };
}
