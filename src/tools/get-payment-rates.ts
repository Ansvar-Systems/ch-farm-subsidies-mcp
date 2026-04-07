import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface PaymentRatesArgs {
  scheme_id: string;
  zone?: string;
  jurisdiction?: string;
}

export function handleGetPaymentRates(db: Database, args: PaymentRatesArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  // Verify scheme exists
  const scheme = db.get<{ id: string; name: string; scheme_type: string }>(
    'SELECT id, name, scheme_type FROM schemes WHERE (id = ? OR LOWER(name) = LOWER(?)) AND jurisdiction = ?',
    [args.scheme_id, args.scheme_id, jv.jurisdiction]
  );

  if (!scheme) {
    return {
      error: 'not_found',
      message: `Scheme '${args.scheme_id}' not found. Use search_schemes or list_scheme_options to find available schemes.`,
    };
  }

  let sql = 'SELECT sub_type, zone, rate_chf, unit, conditions, notes FROM payment_rates WHERE scheme_id = ? AND jurisdiction = ?';
  const params: unknown[] = [scheme.id, jv.jurisdiction];

  if (args.zone) {
    sql += ' AND (LOWER(zone) = LOWER(?) OR zone = ?)';
    params.push(args.zone, 'alle');
  }

  sql += ' ORDER BY zone, sub_type';

  const rates = db.all<{
    sub_type: string; zone: string; rate_chf: number; unit: string;
    conditions: string; notes: string;
  }>(sql, params);

  if (rates.length === 0) {
    return {
      error: 'not_found',
      message: `No payment rates found for scheme '${scheme.name}'` +
        (args.zone ? ` in zone '${args.zone}'` : '') + '.',
    };
  }

  return {
    scheme_id: scheme.id,
    scheme_name: scheme.name,
    scheme_type: scheme.scheme_type,
    zone_filter: args.zone ?? 'alle',
    jurisdiction: jv.jurisdiction,
    results_count: rates.length,
    rates,
    _citation: buildCitation(
      `CH Subsidy Rates: ${scheme.name}`,
      `Beitragssätze ${scheme.name}`,
      'get_payment_rates',
      { scheme_id: args.scheme_id },
    ),
    _meta: buildMeta(),
  };
}
