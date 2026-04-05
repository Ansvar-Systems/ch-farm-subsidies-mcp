export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'Diese Daten dienen ausschliesslich der Information und stellen keine rechtsverbindliche Auskunft ueber ' +
  'Direktzahlungsansprueche dar. Massgebend sind die Direktzahlungsverordnung (DZV, SR 910.13), die ' +
  'Weisungen des Bundesamtes fuer Landwirtschaft (BLW) und die kantonalen Vollzugsbestimmungen. ' +
  'Betriebsspezifische Berechnungen sind ueber das Agate-Portal oder die kantonale Landwirtschafts' +
  'verwaltung vorzunehmen. Beitragsaenderungen durch AP 22+ oder parlamentarische Initiativen sind ' +
  'eigenstaendig zu pruefen. / ' +
  'This data is provided for informational purposes only and does not constitute legally binding guidance ' +
  'on direct payment entitlements. The authoritative sources are the Swiss Direct Payments Ordinance ' +
  '(DZV, SR 910.13) and BLW directives. Always verify with the cantonal agricultural office or Agate portal.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen.html',
    copyright: 'Data: BLW, DZV (SR 910.13), Agrarbericht — used under public-sector information principles. Server: Apache-2.0 Ansvar Systems.',
    server: 'ch-farm-subsidies-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
