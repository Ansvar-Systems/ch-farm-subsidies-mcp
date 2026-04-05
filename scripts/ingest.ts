/**
 * Switzerland Farm Subsidies MCP — Data Ingestion Script
 *
 * Populates the database with Swiss direct payment data from:
 * - Direktzahlungsverordnung (DZV, SR 910.13)
 * - BLW Weisungen und Erlaeuterungen
 * - Agrarbericht (BLW)
 * - Agate-Portal Anmeldeinformationen
 *
 * Covers all 7 payment categories:
 * 1. Kulturlandschaftsbeitraege
 * 2. Versorgungssicherheitsbeitraege
 * 3. Biodiversitaetsbeitraege
 * 4. Landschaftsqualitaetsbeitraege
 * 5. Produktionssystembeitraege
 * 6. Ressourceneffizienzbeitraege
 * 7. Tierwohlbeitraege (RAUS/BTS)
 * Plus: OELN requirements and Agate application guidance
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Helper: batch insert
// ---------------------------------------------------------------------------
function insertScheme(s: {
  id: string; name: string; scheme_type: string; category: string;
  description: string; legal_basis: string; requirements: string; notes: string;
}) {
  db.run(
    `INSERT OR REPLACE INTO schemes (id, name, scheme_type, category, description, legal_basis, requirements, notes, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DE', 'CH')`,
    [s.id, s.name, s.scheme_type, s.category, s.description, s.legal_basis, s.requirements, s.notes]
  );
}

function insertRate(r: {
  scheme_id: string; sub_type: string; zone: string; rate_chf: number;
  unit: string; conditions: string; notes: string;
}) {
  db.run(
    `INSERT INTO payment_rates (scheme_id, sub_type, zone, rate_chf, unit, conditions, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'CH')`,
    [r.scheme_id, r.sub_type, r.zone, r.rate_chf, r.unit, r.conditions, r.notes]
  );
}

function insertOeln(o: {
  requirement_number: number; title: string; description: string;
  verification: string; sanctions: string; legal_reference: string;
}) {
  db.run(
    `INSERT INTO oeln_requirements (requirement_number, title, description, verification, sanctions, legal_reference, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, 'DE', 'CH')`,
    [o.requirement_number, o.title, o.description, o.verification, o.sanctions, o.legal_reference]
  );
}

function insertGuidance(g: {
  topic: string; title: string; body: string; deadline: string;
  portal: string; legal_reference: string;
}) {
  db.run(
    `INSERT INTO application_guidance (topic, title, body, deadline, portal, legal_reference, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, 'DE', 'CH')`,
    [g.topic, g.title, g.body, g.deadline, g.portal, g.legal_reference]
  );
}

// ---------------------------------------------------------------------------
// 1. OELN — Oekologischer Leistungsnachweis (12 Anforderungen)
//    Source: DZV Art. 11-25, BLW Weisungen OELN
// ---------------------------------------------------------------------------

const oelnRequirements = [
  {
    requirement_number: 1,
    title: 'Ausgeglichene Duengerbilanz (Suisse-Bilanz)',
    description: 'Die Naehrstoffbilanz (Stickstoff und Phosphor) muss auf Betriebsebene ausgeglichen sein. Toleranzbereich: max. 110% N-Effizienz, max. 100% P-Effizienz. Berechnung nach Suisse-Bilanz-Methode (BLW Wegleitung). Ab 2024 verschaerfte Grenzwerte gemaess Pa.Iv. 19.475.',
    verification: 'Jaehrliche Suisse-Bilanz-Berechnung, Einreichung ueber Agate-Portal. Stichprobenkontrollen durch kantonale Vollzugsstelle.',
    sanctions: 'Bei Ueberschreitung: Kuerzung Direktzahlungen (10-50% je nach Ueberschreitungsgrad). Wiederholte Verstoesse fuehren zu Beitragsausschluss.',
    legal_reference: 'DZV Art. 13, LwG Art. 70',
  },
  {
    requirement_number: 2,
    title: 'Angemessener Bodenschutz',
    description: 'Bodenbedeckung in erosionsgefaehrdeten Perioden sicherstellen. Offene Ackerflaeche: mind. 60% der Ackerflaeche muss zwischen Ernte und 15. November bedeckt sein (Zwischenfrucht, Stoppeln, Untersaat). Erosionsschutzkonzept bei hoher Erosionsgefaehrdung.',
    verification: 'Feldbegehung waehrend Herbst/Winter. Kontrolle Bodenbedeckungsgrad, Erosionsrinnen.',
    sanctions: 'Kuerzung Direktzahlungen bei unzureichender Bodenbedeckung.',
    legal_reference: 'DZV Art. 14',
  },
  {
    requirement_number: 3,
    title: 'Geregelte Fruchtfolge',
    description: 'Mindestens 4 verschiedene Kulturen pro Betrieb bei >3 ha offener Ackerflaeche. Maximalanteil einer Kultur: 50% der offenen Ackerflaeche. Ausnahme: Betriebe mit <3 ha offener Ackerflaeche. Mais: max. 40% der offenen Ackerflaeche (kantonal strenger moeglich).',
    verification: 'Kulturplan und Parzellenliste ueber Agate-Portal. Kontrolle der Vielfalt und Anteile.',
    sanctions: 'Kuerzung bei Nichteinhaltung der Mindestanforderungen.',
    legal_reference: 'DZV Art. 16',
  },
  {
    requirement_number: 4,
    title: 'Geeignete Massnahmen zum Schutz natuerlicher Lebensraeume',
    description: 'Pufferstreifen entlang von Gewaessern: 6 Meter ungeduengt und unbehandelt. Pufferstreifen entlang von Hecken und Feldgehoelzen: 3 Meter. Pufferstreifen zu Nachbarflaechen: 50 cm. Kein Einsatz von Pflanzenschutzmitteln in Pufferstreifen.',
    verification: 'Kontrolle der Streifenbreite, Duengung und PSM-Anwendung in Pufferstreifen.',
    sanctions: 'Kuerzung Direktzahlungen, bei schweren Verstoessen Strafanzeige (Gewaesserschutzgesetz).',
    legal_reference: 'DZV Art. 17, GSchG Art. 27',
  },
  {
    requirement_number: 5,
    title: 'Biodiversitaetsfoerderflaechen (BFF) — Mindestanteil 7%',
    description: 'Mindestens 7% der landwirtschaftlichen Nutzflaeche (LN) als Biodiversitaetsfoerderflaechen (BFF). Ab 2024: zusaetzlich mind. 3.5% BFF auf der offenen Ackerflaeche. BFF-Typen: extensiv genutzte Wiesen, wenig intensiv genutzte Wiesen, Streuflaechen, Hecken, Buntbrachen, Rotationsbrachen, Saum auf Ackerflaeche, Nuetzlingsstreifen, Bluehstreifen.',
    verification: 'BFF-Anmeldung ueber Agate-Portal mit Parzellenzuordnung. GIS-Kontrolle und Feldbegehung.',
    sanctions: 'Kuerzung Biodiversitaetsbeitraege und allgemeine Direktzahlungen bei Unterschreitung.',
    legal_reference: 'DZV Art. 18, Pa.Iv. 19.475',
  },
  {
    requirement_number: 6,
    title: 'Vorschriftsgemaeesse Bewirtschaftung von Objekten in Bundesinventaren',
    description: 'Flaechen in Bundesinventaren (Trockenwiesen und -weiden TWW, Flachmoore, Hochmoore, Auengebiete) muessen gemaess den spezifischen Bewirtschaftungsvorschriften gepflegt werden. Kein Umbruch, keine Duengung auf Hochmooren und Streuflaechen.',
    verification: 'Kantonale Kontrolle der Bewirtschaftungsauflagen in Inventargebieten.',
    sanctions: 'Kuerzung oder Verweigerung der Direktzahlungen fuer betroffene Flaechen.',
    legal_reference: 'DZV Art. 19',
  },
  {
    requirement_number: 7,
    title: 'Pflanzenschutz nach Grundsaetzen des integrierten Pflanzenschutzes',
    description: 'Schadschwellenprinzip: Pflanzenschutzmittel (PSM) duerfen erst eingesetzt werden, wenn die Schadorganismen eine wirtschaftlich relevante Schadschwelle ueberschreiten. Vorrang nichtchemischer Massnahmen (Sortenwahl, Fruchtfolge, biologische Bekaempfung). Fuehrung eines Feldkalenders (Spritzbuch).',
    verification: 'Feldkalender mit Datum, Kultur, PSM-Produkt, Dosis, Aufwandmenge. Stichprobenkontrollen.',
    sanctions: 'Kuerzung Direktzahlungen bei fehlendem Feldkalender oder systematischem Verstoss gegen Schadschwellenprinzip.',
    legal_reference: 'DZV Art. 20',
  },
  {
    requirement_number: 8,
    title: 'Saatgut und Pflanzenmaterial',
    description: 'Verwendung von zertifiziertem Saatgut und gesundem Pflanzenmaterial. Verbot gentechnisch veraenderter Organismen (GVO) in der Landwirtschaft (Moratorium bis 2025, verlaengert). Sortenlisten beachten (swissgranum, Agroscope empfohlene Sorten).',
    verification: 'Saatgutetiketten und Rechnungen aufbewahren. GVO-Kontrollen (Stichproben).',
    sanctions: 'Kuerzung bei Verstoss gegen GVO-Moratorium.',
    legal_reference: 'DZV Art. 21',
  },
  {
    requirement_number: 9,
    title: 'Tierschutzgesetzgebung einhalten',
    description: 'Einhaltung der Tierschutzverordnung (TSchV): Mindestanforderungen an Haltung, Fuetterung, Pflege. Sachkundenachweis fuer Tierhaltende. Meldung an TVD (Tierverkehrsdatenbank) innerhalb von 3 Arbeitstagen bei Tierverkehr.',
    verification: 'Kontrollen durch kantonalen Veterinaerdienst. TVD-Meldepflicht wird elektronisch ueberprueft.',
    sanctions: 'Kuerzung Direktzahlungen (25-100% je nach Schwere). Strafanzeige bei schweren Tierschutzverstoessen.',
    legal_reference: 'DZV Art. 22, TSchG, TSchV',
  },
  {
    requirement_number: 10,
    title: 'Soziale Anforderungen (Arbeitnehmerschutz)',
    description: 'Einhaltung der Arbeitsgesetzgebung fuer landwirtschaftliche Angestellte. Gesamtarbeitsvertrag (GAV) oder kantonale Normalarbeitsvertraege (NAV) beachten. Mindestlohn, Arbeitszeiten, Unfallversicherung.',
    verification: 'Stichprobenkontrollen durch kantonale Arbeitsinspektion.',
    sanctions: 'Kuerzung Direktzahlungen bei nachgewiesenen Verstoessen.',
    legal_reference: 'DZV Art. 23, ArG',
  },
  {
    requirement_number: 11,
    title: 'Gewaesserschutzgesetzgebung einhalten',
    description: 'Einhaltung aller Auflagen des Gewaesserschutzgesetzes (GSchG). Grundwasserschutzzonen S1/S2/S3: Bewirtschaftungseinschraenkungen beachten. Lagerkapazitaet Hofdung: mind. 5 Monate (3 Monate im Soemmerungsgebiet). Kein Abfluss von Duenger oder PSM in Gewaesser.',
    verification: 'Kontrolle Lagerkapazitaet, Pufferstreifen, Grundwasserschutzzonen. Kantonale Gewaesserschutzfachstelle.',
    sanctions: 'Kuerzung Direktzahlungen, Strafanzeige bei Gewaesserverschmutzung.',
    legal_reference: 'DZV Art. 24, GSchG, GSchV',
  },
  {
    requirement_number: 12,
    title: 'Anforderungen an Ausbringung von fluessigen Hofdungern',
    description: 'Schleppschlauch oder gleichwertige emissionsarme Ausbringtechnik obligatorisch ab 2024 (LRV). Ausbringverbot: November bis Mitte Februar (regional unterschiedlich). Kein Ausbringen auf gesaettigten, gefrorenen, schneebedeckten oder durchnaessten Boden. Abstand zu Gewaessern einhalten.',
    verification: 'Guellenjournal, Kontrolle Ausbringtechnik, saisonale Feldkontrollen.',
    sanctions: 'Kuerzung Direktzahlungen, Gewaesserschutz-Strafanzeige bei Gewaesserkontamination.',
    legal_reference: 'DZV Art. 25, LRV, ChemRRV',
  },
];

for (const o of oelnRequirements) {
  insertOeln(o);
}
console.log(`Inserted ${oelnRequirements.length} OELN requirements`);

// ---------------------------------------------------------------------------
// 2. Kulturlandschaftsbeitraege
//    Source: DZV Art. 42-52
// ---------------------------------------------------------------------------

insertScheme({
  id: 'kulturlandschaft-offenhaltung',
  name: 'Offenhaltungsbeitrag',
  scheme_type: 'kulturlandschaft',
  category: 'kulturlandschaft',
  description: 'Beitrag fuer die Offenhaltung der Kulturlandschaft. Gilt fuer Dauergruenland und Ackerflaeche in allen Zonen. Sichert die Bewirtschaftung von Flaechen, die ohne Beitraege aufgegeben wuerden.',
  legal_basis: 'DZV Art. 42',
  requirements: 'OELN-Einhaltung. Flaeche muss bewirtschaftet und offen gehalten werden. Keine Verbuschung.',
  notes: 'Basisbeitrag fuer alle Zonen. Hoeherer Beitrag im Berggebiet, da dort die Offenhaltung aufwendiger ist.',
});
for (const z of [
  { zone: 'talzone', rate: 0 },
  { zone: 'huegelzone', rate: 100 },
  { zone: 'bergzone_i', rate: 230 },
  { zone: 'bergzone_ii', rate: 320 },
  { zone: 'bergzone_iii', rate: 380 },
  { zone: 'bergzone_iv', rate: 400 },
]) {
  insertRate({
    scheme_id: 'kulturlandschaft-offenhaltung', sub_type: 'Offenhaltungsbeitrag',
    zone: z.zone, rate_chf: z.rate, unit: 'CHF/ha',
    conditions: 'OELN, Flaeche offen gehalten', notes: `Offenhaltung ${z.zone}`,
  });
}

insertScheme({
  id: 'kulturlandschaft-hangbeitrag',
  name: 'Hangbeitrag',
  scheme_type: 'kulturlandschaft',
  category: 'kulturlandschaft',
  description: 'Beitrag fuer die Bewirtschaftung von Hanglagen. Differenziert nach Hangneigung: 18-35%, 35-50%, ueber 50%. Kompensiert den Mehraufwand der Hangbewirtschaftung (eingeschraenkter Maschineneinsatz, hoehere Unfallgefahr).',
  legal_basis: 'DZV Art. 43',
  requirements: 'OELN-Einhaltung. Hangneigung gemaess digitaler Bodenneigungskarte (ARE). Mindestflaeche 10 Aren.',
  notes: 'Hangneigung wird per GIS aus dem digitalen Hoehenmodell abgeleitet. Betrifft vor allem Voralpen- und Berggebiet.',
});
insertRate({ scheme_id: 'kulturlandschaft-hangbeitrag', sub_type: 'Hangbeitrag 18-35%', zone: 'alle', rate_chf: 410, unit: 'CHF/ha', conditions: 'Hangneigung 18-35%', notes: 'Maessige Steilheit, eingeschraenkter Maschineneinsatz' });
insertRate({ scheme_id: 'kulturlandschaft-hangbeitrag', sub_type: 'Hangbeitrag 35-50%', zone: 'alle', rate_chf: 700, unit: 'CHF/ha', conditions: 'Hangneigung 35-50%', notes: 'Steile Lagen, Motormaeher oder Handarbeit noetig' });
insertRate({ scheme_id: 'kulturlandschaft-hangbeitrag', sub_type: 'Hangbeitrag >50%', zone: 'alle', rate_chf: 1000, unit: 'CHF/ha', conditions: 'Hangneigung ueber 50%', notes: 'Sehr steile Lagen, ueberwiegend Handarbeit' });

insertScheme({
  id: 'kulturlandschaft-steillagen',
  name: 'Steillagenbeitrag Reben und Obstanlagen',
  scheme_type: 'kulturlandschaft',
  category: 'kulturlandschaft',
  description: 'Beitrag fuer die Bewirtschaftung von Reben und Obstanlagen in Steillagen (Hangneigung >30%). Zusaetzlich zum allgemeinen Hangbeitrag. Sichert den Terrassenweinbau und traditionelle Obstgaerten.',
  legal_basis: 'DZV Art. 44',
  requirements: 'OELN-Einhaltung. Reben oder Obstanlagen in Steillagen >30%. Professionelle Bewirtschaftung.',
  notes: 'Relevant im Wallis (Visperterminen, Fully), Lavaux (UNESCO), Tessin, Buendner Herrschaft.',
});
insertRate({ scheme_id: 'kulturlandschaft-steillagen', sub_type: 'Steillagen Reben 30-50%', zone: 'alle', rate_chf: 1500, unit: 'CHF/ha', conditions: 'Rebflaeche Hangneigung 30-50%', notes: 'Terrassenweinbau' });
insertRate({ scheme_id: 'kulturlandschaft-steillagen', sub_type: 'Steillagen Reben >50%', zone: 'alle', rate_chf: 3000, unit: 'CHF/ha', conditions: 'Rebflaeche Hangneigung >50%', notes: 'Extremsteillagen (z.B. Visperterminen)' });
insertRate({ scheme_id: 'kulturlandschaft-steillagen', sub_type: 'Steillagen Obstanlagen 30-50%', zone: 'alle', rate_chf: 1500, unit: 'CHF/ha', conditions: 'Obstanlagen Hangneigung 30-50%', notes: 'Traditionelle Hochstamm-Obstgaerten in Steillagen' });

insertScheme({
  id: 'kulturlandschaft-alpung',
  name: 'Alpungsbeitrag',
  scheme_type: 'kulturlandschaft',
  category: 'kulturlandschaft',
  description: 'Beitrag fuer die Soemmering von Nutztieren auf Alpen. Wird pro Normalstoss (NST) bezahlt. Foerdert die Alpwirtschaft und die Offenhaltung der alpinen Kulturlandschaft. Alpzeit mind. 56-100 Tage je nach Kanton.',
  legal_basis: 'DZV Art. 45',
  requirements: 'OELN-Einhaltung. Normalbesatz einhalten (GVE/ha). Alpzeit mind. 56 Tage. Meldung ueber Agate.',
  notes: '1 NST = 1 GVE waehrend 100 Tagen auf der Alp. Bei kuerzerer Alpzeit anteilig.',
});
insertRate({ scheme_id: 'kulturlandschaft-alpung', sub_type: 'Alpungsbeitrag', zone: 'soemmerungsgebiet', rate_chf: 370, unit: 'CHF/NST', conditions: 'Mind. 56 Alptage, Normalbesatz', notes: '1 NST = 1 GVE x 100 Alptage' });

insertScheme({
  id: 'kulturlandschaft-soemmerung',
  name: 'Soemmerungsbeitrag',
  scheme_type: 'kulturlandschaft',
  category: 'kulturlandschaft',
  description: 'Beitrag fuer die Bewirtschaftung von Soemmerungsflaechen. Ergaenzt den Alpungsbeitrag. Sichert die Pflege von Alpweiden und die Offenhaltung des Soemmerungsgebietes.',
  legal_basis: 'DZV Art. 46',
  requirements: 'OELN-Einhaltung (angepasste Anforderungen fuer Soemmerungsgebiet). Beweidung gemaess Nutzungsplan.',
  notes: 'Beitrag auf Basis Normalstoss. Ueberbesatz fuehrt zu Kuerzungen.',
});
insertRate({ scheme_id: 'kulturlandschaft-soemmerung', sub_type: 'Soemmerungsbeitrag', zone: 'soemmerungsgebiet', rate_chf: 400, unit: 'CHF/NST', conditions: 'Kein Ueberbesatz', notes: 'Komplementaer zum Alpungsbeitrag' });

console.log('Inserted Kulturlandschaftsbeitraege');

// ---------------------------------------------------------------------------
// 3. Versorgungssicherheitsbeitraege
//    Source: DZV Art. 53-59
// ---------------------------------------------------------------------------

insertScheme({
  id: 'versorgung-basis-acker',
  name: 'Basisbeitrag offene Ackerflaeche',
  scheme_type: 'versorgungssicherheit',
  category: 'versorgungssicherheit',
  description: 'Basisbeitrag fuer die offene Ackerflaeche (Getreide, Oelsaaten, Hackfruechte, Gemuese, Freilandgemuese). Sichert die inlaendische Nahrungsmittelproduktion und die Versorgungssicherheit.',
  legal_basis: 'DZV Art. 53',
  requirements: 'OELN-Einhaltung. Offene Ackerflaeche gemaess LBG-Definition (keine Kunstwiese, kein Dauergruenland).',
  notes: 'Hoechster Basisbeitrag unter den Versorgungssicherheitsbeitraegen, da Ackerbau fuer die Kalorienversorgung zentral ist.',
});
insertRate({ scheme_id: 'versorgung-basis-acker', sub_type: 'Basisbeitrag Ackerflaeche', zone: 'alle', rate_chf: 900, unit: 'CHF/ha', conditions: 'Offene Ackerflaeche', notes: 'Beitragsberechtigt: Getreide, Oelsaaten, Hackfruechte, Gemuese' });

insertScheme({
  id: 'versorgung-basis-gruenland',
  name: 'Basisbeitrag Dauergruenland',
  scheme_type: 'versorgungssicherheit',
  category: 'versorgungssicherheit',
  description: 'Basisbeitrag fuer Dauergruenland (Natur- und Kunstwiesen, Weiden). Foerdert die raufutterbasierte Tierhaltung und die Nutzung des Gruenlandpotenzials der Schweiz.',
  legal_basis: 'DZV Art. 53',
  requirements: 'OELN-Einhaltung. Dauergruenland gemaess Definition (mind. 6 Jahre nicht umgebrochen).',
  notes: 'Niedrigerer Beitrag als Ackerflaeche, da Gruenland weniger zur direkten Kalorienversorgung beitraegt.',
});
insertRate({ scheme_id: 'versorgung-basis-gruenland', sub_type: 'Basisbeitrag Dauergruenland', zone: 'alle', rate_chf: 450, unit: 'CHF/ha', conditions: 'Dauergruenland', notes: 'Natur- und Kunstwiesen, Weiden' });

insertScheme({
  id: 'versorgung-produktionserschwernis',
  name: 'Produktionserschwernisbeitrag',
  scheme_type: 'versorgungssicherheit',
  category: 'versorgungssicherheit',
  description: 'Beitrag zur Kompensation erschwerter Produktionsbedingungen im Huegelgebiet und Berggebiet. Steigt mit zunehmender Erschwernisstufe (Huegelzone bis Bergzone IV). Sichert die Bewirtschaftung in peripheren Gebieten.',
  legal_basis: 'DZV Art. 55',
  requirements: 'OELN-Einhaltung. Betrieb in der entsprechenden Zone gemaess landwirtschaftlicher Zoneneinteilung.',
  notes: 'Zoneneinteilung basiert auf Hoehenlagen, Hangneigung und klimatischen Bedingungen. Bundesamt fuer Landwirtschaft fuehrt die offizielle Zonenkarte.',
});
for (const z of [
  { zone: 'huegelzone', rate: 240 },
  { zone: 'bergzone_i', rate: 300 },
  { zone: 'bergzone_ii', rate: 340 },
  { zone: 'bergzone_iii', rate: 400 },
  { zone: 'bergzone_iv', rate: 420 },
]) {
  insertRate({
    scheme_id: 'versorgung-produktionserschwernis', sub_type: 'Produktionserschwernis',
    zone: z.zone, rate_chf: z.rate, unit: 'CHF/ha',
    conditions: `Betrieb in ${z.zone}`, notes: `Kompensation Produktionserschwernis ${z.zone}`,
  });
}

console.log('Inserted Versorgungssicherheitsbeitraege');

// ---------------------------------------------------------------------------
// 4. Biodiversitaetsbeitraege
//    Source: DZV Art. 55-62
// ---------------------------------------------------------------------------

insertScheme({
  id: 'biodiv-bff-qi',
  name: 'Biodiversitaetsbeitraege Qualitaetsstufe I (BFF QI)',
  scheme_type: 'biodiversitaet',
  category: 'biodiversitaet',
  description: 'Beitraege fuer Biodiversitaetsfoerderflaechen (BFF) Qualitaetsstufe I. Grundanforderungen an die Bewirtschaftung (Schnittzeitpunkt, Duengungseinschraenkung). Verschiedene Typen: extensiv genutzte Wiese, wenig intensiv genutzte Wiese, Buntbrache, Rotationsbrache, Hecke, Streuflaeche, Saum auf Ackerflaeche, Nuetzlingsstreifen, Bluehstreifen fuer Bestaeubende.',
  legal_basis: 'DZV Art. 55-57',
  requirements: 'OELN-Einhaltung. BFF-Typ gemaess DZV-Anforderungen bewirtschaften. Anmeldung ueber Agate.',
  notes: 'BFF QI ist die Grundstufe. Hoehere Beitraege mit QII (botanische Qualitaet) und Vernetzung moeglich.',
});
// BFF QI rates by type and zone (Talzone/Huegelzone, Bergzone differentiated)
const bffQiRates = [
  { sub: 'Extensiv genutzte Wiese', zone: 'talzone', rate: 450 },
  { sub: 'Extensiv genutzte Wiese', zone: 'huegelzone', rate: 450 },
  { sub: 'Extensiv genutzte Wiese', zone: 'bergzone_i', rate: 300 },
  { sub: 'Extensiv genutzte Wiese', zone: 'bergzone_ii', rate: 300 },
  { sub: 'Extensiv genutzte Wiese', zone: 'bergzone_iii', rate: 150 },
  { sub: 'Extensiv genutzte Wiese', zone: 'bergzone_iv', rate: 150 },
  { sub: 'Wenig intensiv genutzte Wiese', zone: 'talzone', rate: 300 },
  { sub: 'Wenig intensiv genutzte Wiese', zone: 'huegelzone', rate: 300 },
  { sub: 'Wenig intensiv genutzte Wiese', zone: 'bergzone_i', rate: 200 },
  { sub: 'Wenig intensiv genutzte Wiese', zone: 'bergzone_ii', rate: 200 },
  { sub: 'Streuflaeche', zone: 'alle', rate: 450 },
  { sub: 'Hecke, Feld- und Ufergehoelz', zone: 'alle', rate: 700 },
  { sub: 'Buntbrache', zone: 'alle', rate: 3800 },
  { sub: 'Rotationsbrache', zone: 'alle', rate: 2500 },
  { sub: 'Saum auf Ackerflaeche', zone: 'alle', rate: 3300 },
  { sub: 'Nuetzlingsstreifen', zone: 'alle', rate: 2500 },
  { sub: 'Bluehstreifen fuer Bestaeubende', zone: 'alle', rate: 2500 },
];
for (const r of bffQiRates) {
  insertRate({
    scheme_id: 'biodiv-bff-qi', sub_type: r.sub, zone: r.zone,
    rate_chf: r.rate, unit: 'CHF/ha', conditions: 'BFF QI Bewirtschaftungsanforderungen',
    notes: `BFF QI ${r.sub} in ${r.zone}`,
  });
}

insertScheme({
  id: 'biodiv-bff-qii',
  name: 'Biodiversitaetsbeitraege Qualitaetsstufe II (BFF QII)',
  scheme_type: 'biodiversitaet',
  category: 'biodiversitaet',
  description: 'Zusatzbeitrag fuer BFF mit nachgewiesener botanischer Qualitaet (Qualitaetsstufe II). Voraussetzung: mind. 6 Indikatorpflanzen (je nach Region) oder seltene Lebensraeume. QII-Beitrag kommt zum QI-Beitrag hinzu. Beurteilung durch Fachperson alle 6 Jahre.',
  legal_basis: 'DZV Art. 58-59',
  requirements: 'BFF QI als Voraussetzung. Botanische Qualitaetskontrolle bestanden (mind. 6 Indikatorpflanzen). Fachkontrolle alle 6 Jahre.',
  notes: 'QII-Beitrag ist ein Zuschlag auf QI. Kombination QI + QII + Vernetzung ergibt den Hoechstbeitrag.',
});
const bffQiiRates = [
  { sub: 'Extensiv genutzte Wiese QII', zone: 'talzone', rate: 1070 },
  { sub: 'Extensiv genutzte Wiese QII', zone: 'huegelzone', rate: 1070 },
  { sub: 'Extensiv genutzte Wiese QII', zone: 'bergzone_i', rate: 720 },
  { sub: 'Extensiv genutzte Wiese QII', zone: 'bergzone_ii', rate: 720 },
  { sub: 'Extensiv genutzte Wiese QII', zone: 'bergzone_iii', rate: 300 },
  { sub: 'Extensiv genutzte Wiese QII', zone: 'bergzone_iv', rate: 300 },
  { sub: 'Wenig intensiv genutzte Wiese QII', zone: 'talzone', rate: 420 },
  { sub: 'Wenig intensiv genutzte Wiese QII', zone: 'huegelzone', rate: 420 },
  { sub: 'Streuflaeche QII', zone: 'alle', rate: 600 },
  { sub: 'Hecke QII', zone: 'alle', rate: 500 },
];
for (const r of bffQiiRates) {
  insertRate({
    scheme_id: 'biodiv-bff-qii', sub_type: r.sub, zone: r.zone,
    rate_chf: r.rate, unit: 'CHF/ha', conditions: 'BFF QII botanische Qualitaet nachgewiesen',
    notes: `QII-Zuschlag auf QI-Beitrag: ${r.sub} in ${r.zone}`,
  });
}

insertScheme({
  id: 'biodiv-vernetzung',
  name: 'Vernetzungsbeitrag',
  scheme_type: 'biodiversitaet',
  category: 'biodiversitaet',
  description: 'Beitrag fuer die Teilnahme an einem kantonalen Vernetzungsprojekt. BFF-Flaechen werden in ein Netzwerk eingebunden, das die Ausbreitung von Arten foerdert. Kantonale Vernetzungsprojekte definieren Zielarten und Massnahmen.',
  legal_basis: 'DZV Art. 61',
  requirements: 'BFF QI als Voraussetzung. Teilnahme an einem kantonalen Vernetzungsprojekt. Einhaltung der projektspezifischen Auflagen.',
  notes: 'Vernetzungsbeitrag ist kombinierbar mit QI und QII. Kantonale Projekte unterscheiden sich in Zielarten und Anforderungen.',
});
insertRate({ scheme_id: 'biodiv-vernetzung', sub_type: 'Vernetzungsbeitrag', zone: 'alle', rate_chf: 1000, unit: 'CHF/ha', conditions: 'Kantonales Vernetzungsprojekt', notes: 'Zuschlag auf QI, kombinierbar mit QII' });

console.log('Inserted Biodiversitaetsbeitraege');

// ---------------------------------------------------------------------------
// 5. Landschaftsqualitaetsbeitraege (LQ)
//    Source: DZV Art. 63-65
// ---------------------------------------------------------------------------

insertScheme({
  id: 'landschaftsqualitaet',
  name: 'Landschaftsqualitaetsbeitrag (LQ)',
  scheme_type: 'landschaftsqualitaet',
  category: 'landschaftsqualitaet',
  description: 'Beitrag fuer Massnahmen zur Foerderung der Landschaftsqualitaet. Projektbasiert, kantonal unterschiedlich. Typische Massnahmen: Pflege von Hochstamm-Obstbaeumen (mind. 20 Baeume), Erhalt von Trockensteinmauern, Pflege von Wildhecken, Pflanzung von Einzelbaeumen, traditionelle Zaunarten, Blumenstreifen entlang Wegen.',
  legal_basis: 'DZV Art. 63-65',
  requirements: 'OELN-Einhaltung. Teilnahme an einem kantonalen oder regionalen LQ-Projekt. Umsetzung der vereinbarten Massnahmen.',
  notes: 'Maximal 360 CHF/ha landwirtschaftliche Nutzflaeche. Kantone definieren Massnahmenkatalog und Beitragshoehe pro Massnahme.',
});
insertRate({ scheme_id: 'landschaftsqualitaet', sub_type: 'LQ-Beitrag Maximum', zone: 'alle', rate_chf: 360, unit: 'CHF/ha', conditions: 'Kantonales LQ-Projekt, max. pro ha LN', notes: 'Effektiver Beitrag haengt von umgesetzten Massnahmen ab' });
insertRate({ scheme_id: 'landschaftsqualitaet', sub_type: 'Hochstamm-Obstbaum (Beispiel)', zone: 'alle', rate_chf: 15, unit: 'CHF/Baum', conditions: 'Mind. 20 Baeume, LQ-Projekt', notes: 'Typischer Beitrag pro Baum, kantonal variabel' });

console.log('Inserted Landschaftsqualitaetsbeitraege');

// ---------------------------------------------------------------------------
// 6. Produktionssystembeitraege
//    Source: DZV Art. 66-77
// ---------------------------------------------------------------------------

insertScheme({
  id: 'produktionssystem-bio',
  name: 'Bio-Beitrag',
  scheme_type: 'produktionssystem',
  category: 'produktionssystem',
  description: 'Beitrag fuer die biologische Landwirtschaft gemaess Bio-Verordnung (SR 910.18) oder privaten Bio-Standards (Bio Suisse Knospe). Gesamtbetriebsumstellung obligatorisch (keine Teilumstellung). Hoehere Beitraege fuer Spezialkulturen und Ackerflaeche.',
  legal_basis: 'DZV Art. 66-68',
  requirements: 'OELN-Einhaltung. Bio-Zertifizierung (bio.inspecta, Bio Test Agro). Gesamtbetriebsumstellung. 2 Jahre Umstellungszeit (3 Jahre Dauerkulturen).',
  notes: 'Bio-Beitrag ist mit anderen Produktionssystembeitraegen kombinierbar. Knospe-Betriebe erhalten zusaetzlich Marktpreis-Praemie (nicht Direktzahlung).',
});
insertRate({ scheme_id: 'produktionssystem-bio', sub_type: 'Bio Spezialkulturen', zone: 'alle', rate_chf: 1700, unit: 'CHF/ha', conditions: 'Bio-Zertifizierung, Spezialkulturen (Reben, Obst, Gemuese, Beeren)', notes: 'Hoechster Bio-Beitrag' });
insertRate({ scheme_id: 'produktionssystem-bio', sub_type: 'Bio offene Ackerflaeche', zone: 'alle', rate_chf: 1200, unit: 'CHF/ha', conditions: 'Bio-Zertifizierung, offene Ackerflaeche', notes: 'Getreide, Oelsaaten, Hackfruechte' });
insertRate({ scheme_id: 'produktionssystem-bio', sub_type: 'Bio uebrige LN', zone: 'alle', rate_chf: 200, unit: 'CHF/ha', conditions: 'Bio-Zertifizierung, Dauergruenland und uebrige Flaechen', notes: 'Beitrag fuer Gruenland' });

insertScheme({
  id: 'produktionssystem-extenso',
  name: 'Extenso-Beitrag',
  scheme_type: 'produktionssystem',
  category: 'produktionssystem',
  description: 'Beitrag fuer den Verzicht auf Fungizide, Insektizide und Wachstumsregulatoren bei Getreide, Sonnenblumen, Eiweisserbsen, Ackerbohnen, Raps und Soja. Reduziert den Pflanzenschutzmitteleinsatz. Geringere Ertraege werden durch Beitrag teilweise kompensiert.',
  legal_basis: 'DZV Art. 69',
  requirements: 'OELN-Einhaltung. Kein Einsatz von Fungiziden, Insektiziden und Wachstumsregulatoren auf den angemeldeten Flaechen. Herbizide bleiben erlaubt.',
  notes: 'Extenso und Bio sind kombinierbar. Beliebt bei Dinkel-, Emmer- und Urgetreideproduzenten.',
});
insertRate({ scheme_id: 'produktionssystem-extenso', sub_type: 'Extenso Getreide/Raps/Sonnenblumen', zone: 'alle', rate_chf: 400, unit: 'CHF/ha', conditions: 'Verzicht auf Fungizide, Insektizide, Wachstumsregulatoren', notes: 'Fuer Weizen, Gerste, Hafer, Triticale, Dinkel, Raps, Sonnenblumen' });
insertRate({ scheme_id: 'produktionssystem-extenso', sub_type: 'Extenso Koernerleguminosen', zone: 'alle', rate_chf: 400, unit: 'CHF/ha', conditions: 'Verzicht auf Fungizide, Insektizide, Wachstumsregulatoren', notes: 'Eiweisserbsen, Ackerbohnen, Soja' });

insertScheme({
  id: 'produktionssystem-gmf',
  name: 'GMF — Graslandbasierte Milch- und Fleischproduktion',
  scheme_type: 'produktionssystem',
  category: 'produktionssystem',
  description: 'Beitrag fuer graslandbasierte Milch- und Fleischproduktion (GMF). Mindestens 75% der Tagesration (TS) fuer raufutterverzehrende Tiere muss aus Grundfutter bestehen. Max. 10% Kraftfutter im Jahresdurchschnitt. Foerdert die naturnahe Tierhaltung auf Basis von Gras und Heu.',
  legal_basis: 'DZV Art. 71',
  requirements: 'OELN-Einhaltung. Fuetterungsjournal fuehren. Kraftfutteranteil max. 10% (TS). Mind. 75% Grundfutter.',
  notes: 'Beitrag pro GVE raufutterverzehrender Tiere. Relevant fuer Milchwirtschaft und Mutterkuhhaltung.',
});
insertRate({ scheme_id: 'produktionssystem-gmf', sub_type: 'GMF Beitrag', zone: 'alle', rate_chf: 200, unit: 'CHF/GVE', conditions: 'Max. 10% Kraftfutter, Fuetterungsjournal', notes: 'Pro GVE raufutterverzehrende Tiere' });

console.log('Inserted Produktionssystembeitraege');

// ---------------------------------------------------------------------------
// 7. Tierwohlbeitraege (RAUS / BTS)
//    Source: DZV Art. 74-77
// ---------------------------------------------------------------------------

insertScheme({
  id: 'tierwohl-raus',
  name: 'RAUS — Regelmaessiger Auslauf im Freien',
  scheme_type: 'tierwohl',
  category: 'tierwohl',
  description: 'Beitrag fuer regelmaessigen Auslauf im Freien (RAUS-Programm). Rinder: mind. 26 Tage/Monat Weide im Sommer (Mai-Oktober) und mind. 13 Tage/Monat Auslauf im Winter. Schweine: Auslauf in befestigtem Aussenbereich. Gefluegel: Weideauslauf. Differenzierte Anforderungen je Tierkategorie.',
  legal_basis: 'DZV Art. 74-75',
  requirements: 'OELN-Einhaltung. Einhaltung der RAUS-Anforderungen pro Tierkategorie. Auslaufjournal. Weideflaechennachweise.',
  notes: 'RAUS ist das populaerste Tierwohlprogramm der Schweiz. Kombinierbar mit BTS.',
});
const rausRates = [
  { sub: 'RAUS Rinder (Kuehe, Rinder >160 Tage)', rate: 190 },
  { sub: 'RAUS Rinder (Kaelber, Rinder <160 Tage)', rate: 130 },
  { sub: 'RAUS Pferde/Esel/Maultiere', rate: 190 },
  { sub: 'RAUS Schweine (Mastschweine)', rate: 155 },
  { sub: 'RAUS Schweine (Zuchtsauen)', rate: 280 },
  { sub: 'RAUS Schafe', rate: 190 },
  { sub: 'RAUS Ziegen', rate: 190 },
  { sub: 'RAUS Legehennen', rate: 280 },
  { sub: 'RAUS Mastgefluegel', rate: 280 },
  { sub: 'RAUS Kaninchen', rate: 280 },
];
for (const r of rausRates) {
  insertRate({
    scheme_id: 'tierwohl-raus', sub_type: r.sub, zone: 'alle',
    rate_chf: r.rate, unit: 'CHF/GVE', conditions: 'RAUS-Auslaufanforderungen erfuellt',
    notes: `${r.sub}: ${r.rate} CHF/GVE`,
  });
}

insertScheme({
  id: 'tierwohl-bts',
  name: 'BTS — Besonders tierfreundliche Stallhaltungssysteme',
  scheme_type: 'tierwohl',
  category: 'tierwohl',
  description: 'Beitrag fuer besonders tierfreundliche Stallhaltung (BTS-Programm). Laufstall mit Liegebereich und Einstreu fuer Rinder. Gruppenhaltung mit Auslauf fuer Schweine. Erhoehtee Platzanforderungen gegenueber Tierschutzverordnung.',
  legal_basis: 'DZV Art. 76-77',
  requirements: 'OELN-Einhaltung. BTS-konforme Stalleinrichtung. Kontrolle durch kantonalen Veterinaerdienst.',
  notes: 'BTS und RAUS sind kombinierbar. Kombination ergibt hoechste Tierwohl-Praemie.',
});
const btsRates = [
  { sub: 'BTS Rinder (Kuehe, Rinder >160 Tage)', rate: 90 },
  { sub: 'BTS Rinder (Kaelber, Rinder <160 Tage)', rate: 70 },
  { sub: 'BTS Pferde/Esel/Maultiere', rate: 90 },
  { sub: 'BTS Schweine (Mastschweine)', rate: 155 },
  { sub: 'BTS Schweine (Zuchtsauen)', rate: 155 },
  { sub: 'BTS Legehennen', rate: 155 },
  { sub: 'BTS Mastgefluegel', rate: 155 },
  { sub: 'BTS Kaninchen', rate: 155 },
];
for (const r of btsRates) {
  insertRate({
    scheme_id: 'tierwohl-bts', sub_type: r.sub, zone: 'alle',
    rate_chf: r.rate, unit: 'CHF/GVE', conditions: 'BTS-Stallanforderungen erfuellt',
    notes: `${r.sub}: ${r.rate} CHF/GVE`,
  });
}

console.log('Inserted Tierwohlbeitraege');

// ---------------------------------------------------------------------------
// 8. Ressourceneffizienzbeitraege
//    Source: DZV Art. 78-82
// ---------------------------------------------------------------------------

insertScheme({
  id: 'ressourceneffizienz-bodenbearbeitung',
  name: 'Schonende Bodenbearbeitung',
  scheme_type: 'ressourceneffizienz',
  category: 'ressourceneffizienz',
  description: 'Beitrag fuer schonende Bodenbearbeitung (Direktsaat, Streifenfraesaat, Mulchsaat). Verzicht auf wendende Bodenbearbeitung (Pflug). Foerdert Bodenstruktur, Humusaufbau und Erosionsschutz.',
  legal_basis: 'DZV Art. 79',
  requirements: 'OELN-Einhaltung. Verzicht auf Pflug auf den angemeldeten Flaechen. Dokumentation der Bearbeitungsmethode.',
  notes: 'Kombinierbar mit Extenso und Bio. Flaechennachweis ueber Agate-Portal.',
});
insertRate({ scheme_id: 'ressourceneffizienz-bodenbearbeitung', sub_type: 'Schonende Bodenbearbeitung', zone: 'alle', rate_chf: 250, unit: 'CHF/ha', conditions: 'Verzicht auf Pflug', notes: 'Direktsaat, Mulchsaat, Streifenfraesaat' });

insertScheme({
  id: 'ressourceneffizienz-psm-technik',
  name: 'Praezise Pflanzenschutzmittel-Applikationstechnik',
  scheme_type: 'ressourceneffizienz',
  category: 'ressourceneffizienz',
  description: 'Beitrag fuer den Einsatz praeziser PSM-Applikationstechnik (Bandspritzung, Unterblattspritzung, Sensortechnik, Drohnenapplikation). Reduziert den PSM-Einsatz und die Abdrift.',
  legal_basis: 'DZV Art. 80',
  requirements: 'OELN-Einhaltung. Nachweis der eingesetzten Technik. Reduktion des PSM-Aufwands um mindestens 25%.',
  notes: 'Beitragshöhe haengt von der Technik ab. Kantonal unterschiedliche Zusatzbeitraege moeglich.',
});
insertRate({ scheme_id: 'ressourceneffizienz-psm-technik', sub_type: 'Praezise PSM-Technik Ackerbau', zone: 'alle', rate_chf: 400, unit: 'CHF/ha', conditions: 'PSM-Reduktion mind. 25%', notes: 'Bandspritzung, Sensortechnik' });
insertRate({ scheme_id: 'ressourceneffizienz-psm-technik', sub_type: 'Herbizidverzicht offene Ackerflaeche', zone: 'alle', rate_chf: 250, unit: 'CHF/ha', conditions: 'Vollstaendiger Verzicht auf Herbizide', notes: 'Mechanische Unkrautbekaempfung statt Herbizide' });

insertScheme({
  id: 'ressourceneffizienz-fuetterung',
  name: 'Stickstoffreduzierte Phasenfuetterung',
  scheme_type: 'ressourceneffizienz',
  category: 'ressourceneffizienz',
  description: 'Beitrag fuer stickstoffreduzierte Phasenfuetterung bei Schweinen und Gefluegel. Anpassung der Futterration an den Naehrstoffbedarf der jeweiligen Wachstumsphase. Reduziert N- und P-Ausscheidungen und damit Ammoniakemissionen.',
  legal_basis: 'DZV Art. 81',
  requirements: 'OELN-Einhaltung. Phasenfuetterung mit dokumentierter Rationsberechnung. N-Reduktion mind. 10% gegenueber Standard.',
  notes: 'Relevant fuer Schweinemasst und Gefluegelhaltung. Kombinierbar mit RAUS/BTS.',
});
insertRate({ scheme_id: 'ressourceneffizienz-fuetterung', sub_type: 'N-reduzierte Phasenfuetterung Schweine', zone: 'alle', rate_chf: 90, unit: 'CHF/GVE', conditions: 'Phasenfuetterung mit N-Reduktion >10%', notes: 'Mastschweine, Zuchtsauen' });
insertRate({ scheme_id: 'ressourceneffizienz-fuetterung', sub_type: 'N-reduzierte Fuetterung Gefluegel', zone: 'alle', rate_chf: 90, unit: 'CHF/GVE', conditions: 'Phasenfuetterung mit N-Reduktion >10%', notes: 'Legehennen, Mastgefluegel' });

console.log('Inserted Ressourceneffizienzbeitraege');

// ---------------------------------------------------------------------------
// 9. Application Guidance (Agate-Portal)
// ---------------------------------------------------------------------------

const guidance = [
  {
    topic: 'Anmeldung',
    title: 'Jaehrliche Anmeldung der Direktzahlungen',
    body: 'Die Anmeldung erfolgt jaehrlich ueber das Agate-Portal (www.agate.ch). Landwirte muessen Betriebsdaten, Flaechen (Parzellen mit GIS-Referenz), Tierzahlen und Programm-Teilnahmen erfassen. Die Kantonale Landwirtschaftsverwaltung prueft die Eingaben und erstellt den Beitragsentscheid.',
    deadline: 'Februar bis Ende Maerz (kantonal unterschiedlich)',
    portal: 'https://www.agate.ch',
    legal_reference: 'DZV Art. 95-100',
  },
  {
    topic: 'Fristen',
    title: 'Anmeldefristen und wichtige Termine',
    body: 'Februar-Maerz: Anmeldung Direktzahlungen ueber Agate. Mai: Stichtag Tierzaehlung (15. Mai). August-September: Kontrollen Biodiversitaetsflaechen (Schnittzeitpunkt). November-Dezember: Auszahlung Direktzahlungen. Verpasste Anmeldefristen fuehren zu Beitragsausschluss fuer das laufende Jahr.',
    deadline: 'Kantonal unterschiedlich, meist Ende Maerz',
    portal: 'https://www.agate.ch',
    legal_reference: 'DZV Art. 97',
  },
  {
    topic: 'Auszahlung',
    title: 'Auszahlung der Direktzahlungen',
    body: 'Die Auszahlung erfolgt in der Regel im November/Dezember des Beitragsjahres. Die kantonale Landwirtschaftsverwaltung erstellt eine Beitragsabrechnung. Bei Kuerzungen aufgrund von Verstoessen wird ein Verfuegungsbescheid zugestellt. Einsprache innert 30 Tagen moeglich.',
    deadline: 'November-Dezember',
    portal: 'https://www.agate.ch',
    legal_reference: 'DZV Art. 105',
  },
  {
    topic: 'Kontrollen',
    title: 'Kontrollwesen und Stichproben',
    body: 'Mindestens 30% der Betriebe werden pro Jahr kontrolliert (Grundkontrolle). Zusaetzliche Schwerpunktkontrollen bei Bio, BFF QII, Tierwohl (RAUS/BTS). Kontrollen durch kantonale Vollzugsstelle oder mandatierte Kontrollorganisation. Bei Maengeln: Nachfrist oder sofortige Kuerzung je nach Schwere.',
    deadline: 'Ganzjaehrig, Schwerpunkt Mai-September',
    portal: '',
    legal_reference: 'DZV Art. 101-104',
  },
  {
    topic: 'Haeufige Fehler',
    title: 'Haeufige Fehler bei der Anmeldung',
    body: 'Fehlende BFF-Parzellen (7% nicht erreicht). Falsche Flaechen-Kategorisierung (Kunstwiese vs. Dauergruenland). TVD-Meldungen nicht aktuell (Tiere nicht ab-/angemeldet). Suisse-Bilanz nicht eingereicht oder ueberschritten. Fehlende Feldkalender-Eintraege (PSM-Einsatz). LQ-Massnahmen nicht korrekt dokumentiert.',
    deadline: '',
    portal: 'https://www.agate.ch',
    legal_reference: 'BLW Merkblatt Haeufige Fehler',
  },
  {
    topic: 'Zoneneinteilung',
    title: 'Landwirtschaftliche Zoneneinteilung der Schweiz',
    body: 'Die Schweiz ist in 7 landwirtschaftliche Zonen eingeteilt: Talzone, Huegelzone, Bergzone I, Bergzone II, Bergzone III, Bergzone IV und Soemmerungsgebiet. Die Zoneneinteilung basiert auf Hoehenlage, Hangneigung und klimatischen Bedingungen. Jede Parzelle ist einer Zone zugeordnet (offizielle Zonenkarte BLW). Viele Direktzahlungen sind nach Zone differenziert — hoehere Beitraege in erschwerten Lagen.',
    deadline: '',
    portal: 'https://map.geo.admin.ch (Landwirtschaftliche Zonen)',
    legal_reference: 'Verordnung ueber den landwirtschaftlichen Produktionskataster (SR 912.1)',
  },
  {
    topic: 'Beitragsberechtigte',
    title: 'Wer ist beitragsberechtigt?',
    body: 'Direktzahlungen erhaelt, wer: einen Betrieb mit mindestens 1.0 SAK (Standardarbeitskraft) fuehrt, die OELN-Anforderungen erfuellt, die Alterslimite nicht ueberschritten hat (65 Jahre, Ausnahmen moeglich), und eine landwirtschaftliche Ausbildung nachweist (mind. 3 Jahre Praxis oder EFZ/FZ Landwirtschaft). Sonderfaelle: Generationengemeinschaften, Betriebsgemeinschaften.',
    deadline: '',
    portal: '',
    legal_reference: 'LwG Art. 70, DZV Art. 2-10',
  },
  {
    topic: 'SAK-Berechnung',
    title: 'Standardarbeitskraft (SAK) — Mindestvoraussetzung',
    body: 'Die SAK-Berechnung bestimmt, ob ein Betrieb als landwirtschaftliches Gewerbe gilt und beitragsberechtigt ist. SAK-Faktoren: Winterweizen 0.022/ha, Kartoffeln 0.060/ha, Milchkuh 0.040/Kuh, Mastschwein 0.005/Platz. Mindestens 1.0 SAK erforderlich fuer Direktzahlungen. Online-Berechnung ueber Agate-Portal oder AGRIDEA-Betriebsplanungstool.',
    deadline: '',
    portal: 'https://www.agate.ch',
    legal_reference: 'DZV Anhang',
  },
];

for (const g of guidance) {
  insertGuidance(g);
}
console.log(`Inserted ${guidance.length} application guidance entries`);

// ---------------------------------------------------------------------------
// 10. Build FTS5 search index
// ---------------------------------------------------------------------------

console.log('Building FTS5 search index...');
// Clear existing FTS data
db.run('DELETE FROM search_index');

// Index all schemes
const allSchemes = db.all<{ name: string; description: string; scheme_type: string; jurisdiction: string }>(
  'SELECT name, description, scheme_type, jurisdiction FROM schemes'
);
for (const s of allSchemes) {
  db.run(
    'INSERT INTO search_index (title, body, scheme_type, jurisdiction) VALUES (?, ?, ?, ?)',
    [s.name, s.description, s.scheme_type, s.jurisdiction]
  );
}

// Index OELN requirements
const allOeln = db.all<{ title: string; description: string; jurisdiction: string }>(
  'SELECT title, description, jurisdiction FROM oeln_requirements'
);
for (const o of allOeln) {
  db.run(
    'INSERT INTO search_index (title, body, scheme_type, jurisdiction) VALUES (?, ?, ?, ?)',
    [o.title, o.description, 'oeln', o.jurisdiction]
  );
}

// Index application guidance
const allGuidance = db.all<{ title: string; body: string; jurisdiction: string }>(
  'SELECT title, body, jurisdiction FROM application_guidance'
);
for (const g of allGuidance) {
  db.run(
    'INSERT INTO search_index (title, body, scheme_type, jurisdiction) VALUES (?, ?, ?, ?)',
    [g.title, g.body, 'anleitung', g.jurisdiction]
  );
}

console.log(`FTS5 index built: ${allSchemes.length + allOeln.length + allGuidance.length} entries`);

// ---------------------------------------------------------------------------
// 11. Update metadata
// ---------------------------------------------------------------------------

db.run('INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)', ['last_ingest', now]);
db.run('INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)', ['build_date', now]);

// ---------------------------------------------------------------------------
// 12. Write coverage.json and sources.yml
// ---------------------------------------------------------------------------

const schemeCount = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM schemes')?.cnt ?? 0;
const rateCount = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM payment_rates')?.cnt ?? 0;
const oelnCount = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM oeln_requirements')?.cnt ?? 0;
const guidanceCount = db.get<{ cnt: number }>('SELECT COUNT(*) as cnt FROM application_guidance')?.cnt ?? 0;

const coverage = {
  server: 'ch-farm-subsidies-mcp',
  jurisdiction: 'CH',
  version: '0.1.0',
  last_ingest: now,
  data: {
    schemes: schemeCount,
    payment_rates: rateCount,
    oeln_requirements: oelnCount,
    application_guidance: guidanceCount,
  },
  tools: 10,
  sources: [
    'Direktzahlungsverordnung DZV (SR 910.13)',
    'BLW Weisungen',
    'Agrarbericht (BLW)',
    'Agate-Portal',
  ],
};
writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2) + '\n');
console.log('Written data/coverage.json');

const sourcesYml = `# Data sources for ch-farm-subsidies-mcp
sources:
  - name: Direktzahlungsverordnung (DZV, SR 910.13)
    authority: Bundesamt fuer Landwirtschaft (BLW)
    url: https://www.fedlex.admin.ch/eli/cc/2013/765/de
    license: Swiss Federal Administration — free reuse
    update_frequency: annual (with Agrarpolitik updates)
    last_retrieved: "${now}"

  - name: BLW Weisungen und Erlaeuterungen zur DZV
    authority: Bundesamt fuer Landwirtschaft (BLW)
    url: https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen.html
    license: Swiss Federal Administration — free reuse
    update_frequency: annual
    last_retrieved: "${now}"

  - name: Agrarbericht
    authority: Bundesamt fuer Landwirtschaft (BLW)
    url: https://www.agrarbericht.ch/
    license: Swiss Federal Administration — free reuse
    update_frequency: annual
    last_retrieved: "${now}"

  - name: Agate-Portal Anmeldeinformationen
    authority: BLW / Kantonale Landwirtschaftsaemter
    url: https://www.agate.ch/
    license: Public administration information
    update_frequency: annual (application cycle)
    last_retrieved: "${now}"
`;
writeFileSync('data/sources.yml', sourcesYml);
console.log('Written data/sources.yml');

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

db.close();
console.log(`\nIngestion complete: ${schemeCount} schemes, ${rateCount} payment rates, ${oelnCount} OELN requirements, ${guidanceCount} guidance entries`);
