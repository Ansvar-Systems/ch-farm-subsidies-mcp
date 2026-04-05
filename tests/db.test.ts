import { describe, it, expect, afterEach } from 'vitest';
import { seedTestDatabase } from './helpers/seed-db.js';
import type { Database } from '../src/db.js';

describe('database', () => {
  let db: Database;

  afterEach(() => {
    db?.close();
  });

  it('creates all required tables', () => {
    db = seedTestDatabase();
    const tables = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    );
    const names = tables.map((t) => t.name);

    expect(names).toContain('schemes');
    expect(names).toContain('payment_rates');
    expect(names).toContain('oeln_requirements');
    expect(names).toContain('application_guidance');
    expect(names).toContain('db_metadata');
    expect(names).toContain('search_index');
  });

  it('has FTS5 virtual table for search_index', () => {
    db = seedTestDatabase();
    const tables = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND sql LIKE '%fts5%'"
    );
    const names = tables.map((t) => t.name);

    expect(names).toContain('search_index');
  });

  it('uses DELETE journal mode (not WAL)', () => {
    db = seedTestDatabase();
    const result = db.get<{ journal_mode: string }>('PRAGMA journal_mode');

    expect(result?.journal_mode).toBe('delete');
  });

  it('has foreign keys enabled', () => {
    db = seedTestDatabase();
    const result = db.get<{ foreign_keys: number }>('PRAGMA foreign_keys');

    expect(result?.foreign_keys).toBe(1);
  });

  it('stores seeded data correctly', () => {
    db = seedTestDatabase();

    const schemes = db.all<{ id: string }>('SELECT id FROM schemes');
    expect(schemes).toHaveLength(2);

    const rates = db.all<{ id: number }>('SELECT id FROM payment_rates');
    expect(rates).toHaveLength(2);

    const oeln = db.all<{ id: number }>('SELECT id FROM oeln_requirements');
    expect(oeln).toHaveLength(2);
  });
});
