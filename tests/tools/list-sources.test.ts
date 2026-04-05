import { describe, it, expect, afterEach } from 'vitest';
import { seedTestDatabase } from '../helpers/seed-db.js';
import { handleListSources } from '../../src/tools/list-sources.js';
import type { Database } from '../../src/db.js';

describe('list_sources tool', () => {
  let db: Database;

  afterEach(() => {
    db?.close();
  });

  it('returns a sources array', () => {
    db = seedTestDatabase();
    const result = handleListSources(db);

    expect(result.sources).toBeInstanceOf(Array);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it('each source has required fields', () => {
    db = seedTestDatabase();
    const result = handleListSources(db);

    for (const source of result.sources) {
      expect(source.name).toBeTruthy();
      expect(source.authority).toBeTruthy();
      expect(source.official_url).toMatch(/^https?:\/\//);
      expect(source.license).toBeTruthy();
    }
  });

  it('includes DZV as a source', () => {
    db = seedTestDatabase();
    const result = handleListSources(db);

    const dzv = result.sources.find((s) => s.name.includes('DZV'));
    expect(dzv).toBeDefined();
    expect(dzv?.official_url).toContain('fedlex.admin.ch');
  });

  it('includes Agate portal as a source', () => {
    db = seedTestDatabase();
    const result = handleListSources(db);

    const agate = result.sources.find((s) => s.name.includes('Agate'));
    expect(agate).toBeDefined();
    expect(agate?.official_url).toContain('agate.ch');
  });

  it('includes _meta with disclaimer', () => {
    db = seedTestDatabase();
    const result = handleListSources(db);

    expect(result._meta).toBeDefined();
    expect(result._meta.disclaimer).toBeTruthy();
  });
});
