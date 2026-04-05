import { describe, it, expect, afterEach } from 'vitest';
import { seedTestDatabase } from '../helpers/seed-db.js';
import { handleCheckFreshness } from '../../src/tools/check-freshness.js';
import type { Database } from '../../src/db.js';

describe('check_data_freshness tool', () => {
  let db: Database;

  afterEach(() => {
    db?.close();
  });

  it('returns a freshness status', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result.status).toMatch(/^(fresh|stale|unknown)$/);
  });

  it('returns fresh for recently seeded data', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result.status).toBe('fresh');
    expect(result.last_ingest).toBe('2026-04-05');
  });

  it('includes staleness threshold', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result.staleness_threshold_days).toBe(90);
  });

  it('includes refresh command', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result.refresh_command).toContain('gh workflow run');
    expect(result.refresh_command).toContain('ch-farm-subsidies-mcp');
  });

  it('includes _meta with disclaimer', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result._meta).toBeDefined();
    expect(result._meta.disclaimer).toBeTruthy();
  });

  it('reports days since ingest', () => {
    db = seedTestDatabase();
    const result = handleCheckFreshness(db);

    expect(result.days_since_ingest).toBeTypeOf('number');
    expect(result.days_since_ingest).toBeGreaterThanOrEqual(0);
  });
});
