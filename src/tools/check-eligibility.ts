import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface EligibilityArgs {
  land_type: string;
  zone?: string;
  farm_type?: string;
  jurisdiction?: string;
}

export function handleCheckEligibility(db: Database, args: EligibilityArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const zone = args.zone ?? 'talzone';
  const landType = args.land_type.toLowerCase();

  // Find schemes that apply to this land type
  const allSchemes = db.all<{
    id: string; name: string; scheme_type: string; category: string;
    description: string; requirements: string;
  }>(
    'SELECT id, name, scheme_type, category, description, requirements FROM schemes WHERE jurisdiction = ? ORDER BY category, name',
    [jv.jurisdiction]
  );

  // Filter schemes by relevance to land type and farm type
  const eligible: { scheme_id: string; scheme_name: string; category: string; applicable_rates: unknown[]; requirements: string }[] = [];

  for (const scheme of allSchemes) {
    // Check if scheme is relevant to the land type
    const desc = (scheme.description ?? '').toLowerCase();
    const name = scheme.name.toLowerCase();
    const cat = scheme.category.toLowerCase();

    const isRelevant =
      cat === 'oeln' || // OELN applies to all
      desc.includes(landType) ||
      name.includes(landType) ||
      (landType.includes('acker') && (desc.includes('ackerflaeche') || desc.includes('acker'))) ||
      (landType.includes('gruen') && (desc.includes('gruenland') || desc.includes('dauergruenland') || desc.includes('wiese'))) ||
      (landType.includes('wiese') && (desc.includes('wiese') || desc.includes('gruenland'))) ||
      (landType.includes('bio') && (desc.includes('bio') || name.includes('bio'))) ||
      (landType.includes('alp') && (desc.includes('alp') || desc.includes('soemmer'))) ||
      (args.farm_type && desc.includes(args.farm_type.toLowerCase())) ||
      cat === 'kulturlandschaft' || cat === 'versorgungssicherheit'; // broadly applicable

    if (!isRelevant) continue;

    // Get rates for this zone
    const rates = db.all<{
      sub_type: string; zone: string; rate_chf: number; unit: string; conditions: string;
    }>(
      'SELECT sub_type, zone, rate_chf, unit, conditions FROM payment_rates WHERE scheme_id = ? AND (LOWER(zone) = LOWER(?) OR zone = ?) AND jurisdiction = ?',
      [scheme.id, zone, 'alle', jv.jurisdiction]
    );

    eligible.push({
      scheme_id: scheme.id,
      scheme_name: scheme.name,
      category: scheme.category,
      applicable_rates: rates,
      requirements: scheme.requirements ?? '',
    });
  }

  // Get OELN requirements (prerequisite for all direct payments)
  const oelnCount = db.get<{ cnt: number }>(
    'SELECT COUNT(*) as cnt FROM oeln_requirements WHERE jurisdiction = ?',
    [jv.jurisdiction]
  );

  return {
    land_type: args.land_type,
    zone,
    farm_type: args.farm_type ?? 'nicht angegeben',
    jurisdiction: jv.jurisdiction,
    oeln_prerequisite: `Alle Direktzahlungen setzen die Einhaltung des OELN voraus (${oelnCount?.cnt ?? 12} Anforderungen). Verwenden Sie get_oeln_requirements fuer Details.`,
    eligible_schemes_count: eligible.length,
    eligible_schemes: eligible,
    _meta: buildMeta(),
  };
}
