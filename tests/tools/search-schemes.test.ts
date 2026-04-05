import { describe, it, expect, afterEach } from 'vitest';
import { seedTestDatabase } from '../helpers/seed-db.js';
import { handleSearchSchemes } from '../../src/tools/search-schemes.js';
import type { Database } from '../../src/db.js';

describe('search_schemes tool', () => {
  let db: Database;

  afterEach(() => {
    db?.close();
  });

  it('returns results for a valid query', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'Hangbeitrag' });

    expect(result).toHaveProperty('results');
    expect(result).toHaveProperty('results_count');
    // @ts-expect-error -- result shape varies
    expect(result.results_count).toBeGreaterThan(0);
  });

  it('includes jurisdiction in response', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'Ackerflaeche' });

    // @ts-expect-error -- result shape varies
    expect(result.jurisdiction).toBe('CH');
  });

  it('rejects unsupported jurisdiction', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'test', jurisdiction: 'FR' });

    expect(result).toHaveProperty('error');
    // @ts-expect-error -- error shape
    expect(result.error).toBe('jurisdiction_not_supported');
  });

  it('respects limit parameter', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'Beitrag', limit: 1 });

    // @ts-expect-error -- result shape varies
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it('returns _meta with disclaimer', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'Hangbeitrag' });

    // @ts-expect-error -- result shape varies
    expect(result._meta).toBeDefined();
    // @ts-expect-error -- result shape varies
    expect(result._meta.disclaimer).toBeTruthy();
  });

  it('handles empty query gracefully', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: '' });

    expect(result).toBeDefined();
    // @ts-expect-error -- result shape varies
    expect(result.results_count).toBe(0);
  });

  it('filters by scheme_type', () => {
    db = seedTestDatabase();
    const result = handleSearchSchemes(db, { query: 'Beitrag', scheme_type: 'versorgungssicherheit' });

    // @ts-expect-error -- result shape varies
    if (result.results_count > 0) {
      // @ts-expect-error -- result shape varies
      for (const r of result.results) {
        expect(r.scheme_type.toLowerCase()).toBe('versorgungssicherheit');
      }
    }
  });
});
