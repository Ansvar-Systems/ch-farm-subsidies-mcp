import { createDatabase, type Database } from '../../src/db.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * Creates a temporary seeded database for testing.
 * Includes 2 schemes, 2 payment_rates, 2 oeln_requirements, 2 FTS entries.
 * All data uses jurisdiction = 'CH'.
 */
export function seedTestDatabase(): Database {
  const dbPath = join(tmpdir(), `ch-farm-subsidies-test-${randomUUID()}.db`);
  const db = createDatabase(dbPath);

  // Insert 2 schemes
  db.run(
    `INSERT INTO schemes (id, name, scheme_type, category, description, legal_basis, requirements, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'kulturlandschaft-hangbeitrag',
      'Hangbeitrag',
      'kulturlandschaft',
      'kulturlandschaft',
      'Beitraege fuer Flaechen mit Hangneigung ueber 18 Prozent. Gilt fuer Dauergruenland und offene Ackerflaeche.',
      'DZV Art. 43',
      'Hangneigung mindestens 18%, landwirtschaftliche Nutzflaeche',
      'Abgestuft nach Neigungskategorie und Zone',
      'DE',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO schemes (id, name, scheme_type, category, description, legal_basis, requirements, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'versorgung-basis-acker',
      'Basisbeitrag offene Ackerflaeche',
      'versorgungssicherheit',
      'versorgungssicherheit',
      'Basisbeitrag fuer offene Ackerflaeche zur Sicherung der Versorgung.',
      'DZV Art. 52',
      'Offene Ackerflaeche, OELN-Einhaltung',
      'Zonendifferenzierte Ansaetze',
      'DE',
      'CH',
    ]
  );

  // Insert 2 payment rates
  db.run(
    `INSERT INTO payment_rates (scheme_id, sub_type, zone, rate_chf, unit, conditions, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'kulturlandschaft-hangbeitrag',
      '18-35%',
      'talzone',
      410,
      'CHF/ha',
      'Hangneigung 18-35%',
      'Grundbeitrag Talzone',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO payment_rates (scheme_id, sub_type, zone, rate_chf, unit, conditions, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'versorgung-basis-acker',
      'basis',
      'talzone',
      900,
      'CHF/ha',
      'Offene Ackerflaeche',
      'Basisbeitrag',
      'CH',
    ]
  );

  // Insert 2 OELN requirements
  db.run(
    `INSERT INTO oeln_requirements (requirement_number, title, description, verification, sanctions, legal_reference, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      1,
      'Tiergerechte Haltung',
      'Einhaltung der Tierschutzgesetzgebung fuer alle Nutztiere auf dem Betrieb.',
      'Kontrolle durch kantonalen Veterinaeerdienst',
      'Kuerzung oder Verweigerung der Direktzahlungen',
      'DZV Art. 12 Abs. 1',
      'DE',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO oeln_requirements (requirement_number, title, description, verification, sanctions, legal_reference, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      2,
      'Ausgeglichene Duengebilanz',
      'Die Naehrstoffbilanz (Stickstoff und Phosphor) darf die Toleranzgrenzen nicht ueberschreiten.',
      'Suisse-Bilanz oder vergleichbare Methode',
      'Kuerzung oder Verweigerung der Direktzahlungen',
      'DZV Art. 12 Abs. 2',
      'DE',
      'CH',
    ]
  );

  // Insert 2 FTS entries
  db.run(
    `INSERT INTO search_index (title, body, scheme_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Hangbeitrag',
      'Beitraege fuer Flaechen mit Hangneigung ueber 18 Prozent. Gilt fuer Dauergruenland und offene Ackerflaeche.',
      'kulturlandschaft',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO search_index (title, body, scheme_type, jurisdiction) VALUES (?, ?, ?, ?)`,
    [
      'Basisbeitrag offene Ackerflaeche',
      'Basisbeitrag fuer offene Ackerflaeche zur Sicherung der Versorgung.',
      'versorgungssicherheit',
      'CH',
    ]
  );

  // Insert db_metadata for freshness
  db.run(
    `INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)`,
    ['last_ingest', '2026-04-05']
  );

  db.run(
    `INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)`,
    ['build_date', '2026-04-05']
  );

  // Insert application_guidance for search tests
  db.run(
    `INSERT INTO application_guidance (topic, title, body, deadline, portal, legal_reference, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Anmeldefristen',
      'Fruehjahrsanmeldung Direktzahlungen',
      'Die Anmeldung fuer Direktzahlungen erfolgt jaehrlich bis Ende Februar ueber das Agate-Portal.',
      'Ende Februar',
      'agate.ch',
      'DZV Art. 97',
      'DE',
      'CH',
    ]
  );

  return db;
}
