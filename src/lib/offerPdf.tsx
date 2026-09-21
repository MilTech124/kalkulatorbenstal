// Oferta PDF BEN-STAL generowana serwerowo (@react-pdf/renderer, bez przegladarki).
import fs from 'node:fs';
import path from 'node:path';
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { COMPANY, offerSummary } from '@/lib/offer';
import { formatAddress } from '@/lib/customer';
import { convertFromPln, formatMoney } from '@/lib/currency';
import type { CustomerInfo, PriceList, QuoteInput } from '@/lib/pricing/types';

const ASSETS = path.join(process.cwd(), 'src', 'assets');

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: path.join(ASSETS, 'fonts', 'Roboto-Regular.ttf'), fontWeight: 400 },
      { src: path.join(ASSETS, 'fonts', 'Roboto-Bold.ttf'), fontWeight: 700 },
    ],
  });
  // Bez dzielenia wyrazow - polskie slowa lamalyby sie w przypadkowych miejscach.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const DARK = '#1f2328';
const ACCENT = '#e8772e';
const MUTED = '#5b6472';

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 8.5, color: '#1c2430', paddingTop: 0, paddingBottom: 56, paddingHorizontal: 0 },
  header: { backgroundColor: DARK, paddingVertical: 10, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 128 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { color: '#aab3bf', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' },
  headerValue: { color: '#ffffff', fontSize: 10, fontWeight: 700, marginTop: 1 },
  body: { paddingHorizontal: 32, paddingTop: 13 },
  kicker: { color: ACCENT, fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  h1: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  p: { fontSize: 8.5, lineHeight: 1.35, color: '#3a4350', marginBottom: 4 },
  cols: { flexDirection: 'row', gap: 10, marginTop: 5, marginBottom: 10 },
  box: { flex: 1, borderWidth: 1, borderColor: '#e3e7ec', borderRadius: 5, paddingVertical: 6, paddingHorizontal: 8 },
  boxTitle: { fontSize: 7, color: MUTED, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 2 },
  boxLine: { fontSize: 8, lineHeight: 1.28 },
  columns: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  column: { flex: 1 },
  sectionTitle: { fontSize: 9, fontWeight: 700, marginBottom: 5 },
  table: { borderWidth: 1, borderColor: '#e3e7ec', borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eceff3' },
  trLast: { borderBottomWidth: 0 },
  th: { width: '40%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 8, lineHeight: 1.25, color: MUTED, backgroundColor: '#f7f8fa' },
  td: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, fontSize: 8.1, lineHeight: 1.25, fontWeight: 700 },
  priceBox: { marginTop: 9, backgroundColor: DARK, borderRadius: 7, padding: 10 },
  priceLabel: { color: '#aab3bf', fontSize: 7.5, letterSpacing: 0.7, textTransform: 'uppercase' },
  priceHint: { color: '#aab3bf', fontSize: 7.2, marginTop: 3 },
  price: { color: '#ffffff', fontSize: 19, fontWeight: 700, marginTop: 4 },
  note: { marginTop: 7, padding: 7, backgroundColor: '#fff7ef', borderLeftWidth: 3, borderLeftColor: ACCENT, fontSize: 8.1, lineHeight: 1.3, color: '#3a4350' },
  disclaimer: { marginTop: 7, fontSize: 7.7, lineHeight: 1.32, color: '#657080' },
  infoLine: { fontSize: 8.5, lineHeight: 1.32, color: '#3a4350', marginBottom: 7 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#f7f8fa', borderTopWidth: 1, borderTopColor: '#e3e7ec', paddingVertical: 7, paddingHorizontal: 32, flexDirection: 'row', justifyContent: 'space-between' },
  footerName: { fontSize: 7.8, fontWeight: 700 },
  footerText: { fontSize: 7.2, color: MUTED, lineHeight: 1.3 },
});

export interface OfferPdfData {
  number: number;
  createdAt: Date;
  customer: CustomerInfo;
  input: QuoteInput;
  priceList: PriceList;
  effectiveHeight: number;
  total: number;
  note?: string;
  validDays?: number;
  /** Waluta prezentacji (kurs: ile PLN za 1 jednostke). */
  currency?: { code: string; rate: number; label?: string };
}

const fmt = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
const pln = (n: number) => `${n.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`;

function OfferDocument({ d, logo, pageSize }: { d: OfferPdfData; logo: Buffer; pageSize: 'A4' | 'A3' | 'A2' }) {
  const rows = offerSummary(d.input, d.priceList, d.effectiveHeight);
  const date = d.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = `${d.customer.firstName} ${d.customer.lastName}`.trim();
  const validDays = d.validDays ?? 2;
  const foreign = d.currency && d.currency.code !== 'PLN' && d.currency.rate > 0 ? d.currency : null;

  return (
    <Document title={`Oferta BEN-STAL nr ${d.number}`} author={COMPANY.short} subject={`Wycena garażu ${fmt(d.input.width)} × ${fmt(d.input.length)} m`}>
      <Page size={pageSize} style={s.page}>
        <View style={s.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image nie ma prop alt */}
          <Image src={logo} style={s.logo} />
          <View style={s.headerRight}>
            <Text style={s.headerLabel}>Oferta nr</Text>
            <Text style={s.headerValue}>{d.number}</Text>
            <Text style={[s.headerLabel, { marginTop: 6 }]}>Data</Text>
            <Text style={s.headerValue}>{date}</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.kicker}>Wycena garażu blaszanego</Text>
          <Text style={s.h1}>
            Garaż {fmt(d.input.width)} × {fmt(d.input.length)} m
          </Text>
          <Text style={s.p}>Dzień dobry,</Text>
          <Text style={s.p}>w odpowiedzi na Państwa zapytanie przedstawiamy ofertę na wykonanie konstrukcji stalowej o poniższej specyfikacji:</Text>

          <View style={s.cols}>
            <View style={s.box}>
              <Text style={s.boxTitle}>Zamawiający</Text>
              <Text style={s.boxLine}>{name || '—'}</Text>
              {d.customer.phone ? <Text style={s.boxLine}>tel. {d.customer.phone}</Text> : null}
              {d.customer.email ? <Text style={s.boxLine}>{d.customer.email}</Text> : null}
            </View>
            <View style={s.box}>
              <Text style={s.boxTitle}>Miejsce montażu</Text>
              <Text style={s.boxLine}>{formatAddress(d.customer) || '—'}</Text>
            </View>
          </View>

          <View style={s.columns}>
            <View style={s.column}>
              <Text style={s.sectionTitle}>Specyfikacja konstrukcji</Text>
              <View style={s.table}>
                {rows.map((r, i) => (
                  <View key={r.label} style={i === rows.length - 1 ? [s.tr, s.trLast] : s.tr} wrap={false}>
                    <Text style={s.th}>{r.label}</Text>
                    <Text style={s.td}>{r.value}</Text>
                  </View>
                ))}
              </View>
              <View style={s.priceBox} wrap={false}>
                <Text style={s.priceLabel}>Łącznie brutto</Text>
                <Text style={s.price}>{foreign ? formatMoney(convertFromPln(d.total, foreign), foreign.code) : pln(d.total)}</Text>
                <Text style={s.priceHint}>Transport i montaż GRATIS · oferta ważna {validDays} dni</Text>
                {foreign ? <Text style={s.priceHint}>{pln(d.total)} wg kursu 1 {foreign.code} = {fmt(foreign.rate)} zł{foreign.label ? ` (${foreign.label})` : ''}</Text> : null}
              </View>
            </View>

            <View style={s.column}>
              <Text style={s.sectionTitle}>Informacje dotyczące realizacji</Text>
              <Text style={s.infoLine}>{d.input.extras.anchoring ? 'Kotwiczenie do podłoża jest uwzględnione w cenie.' : 'Kotwiczenie do podłoża nie jest wliczone w cenę.'}</Text>
              <Text style={s.infoLine}>Poniższa specyfikacja jest naszą propozycją. Umiejscowienie poszczególnych elementów ustalimy podczas składania zamówienia.</Text>
              <Text style={s.infoLine}>Termin realizacji zamówienia wynosi od 2 do około 10 tygodni.</Text>
              <Text style={s.infoLine}>Firma „BEN-STAL” nie sporządza dokumentacji technicznej do wykonanej konstrukcji stalowej.</Text>
              <Text style={s.infoLine}>Wizualizację garażu można wykonać samodzielnie na stronie www.benstal.pl.</Text>
              <Text style={s.infoLine}>Dostawa i montaż odbywają się w dni robocze w sposób „wiązany”. Montażyści dostarczają garaże punkt po punkcie, dlatego nie ma możliwości wybrania dnia i godziny dostawy.</Text>
              <Text style={s.infoLine}>Montujemy na terenie przygotowanym przez Zamawiającego. Wskazówki dotyczące przygotowania podłoża znajdą Państwo na stronie www.benstal.pl.</Text>
              <Text style={s.infoLine}>W przypadku zamówienia usługi kotwiczenia podłoże musi być stałe: wylewka, punktowe stopy betonowe lub fundament. Nie kotwiczymy konstrukcji do kostki brukowej ani płyt chodnikowych.</Text>
              <Text style={s.infoLine}>W razie pytań zapraszamy do kontaktu: +48 602 348 266.</Text>
              {d.note ? <Text style={s.note}>{d.note}</Text> : null}
              <Text style={s.disclaimer}>Przedstawiona oferta cenowa ma charakter informacyjny i nie stanowi oferty handlowej w rozumieniu art. 66 § 1 Kodeksu cywilnego. Oferta cenowa jest ważna {validDays} dni.</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <View>
            <Text style={s.footerName}>{COMPANY.name}</Text>
            <Text style={s.footerText}>{COMPANY.tagline}</Text>
            <Text style={s.footerText}>{COMPANY.address}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.footerText}>tel. {COMPANY.phones.join(', ')}</Text>
            <Text style={s.footerText}>{COMPANY.email}</Text>
            <Text style={s.footerText}>benstal.pl</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderOfferPdf(d: OfferPdfData): Promise<Buffer> {
  registerFonts();
  const logo = fs.readFileSync(path.join(ASSETS, 'benstal-logo.png'));
  // Większy arkusz jest potrzebny wyłącznie przy rozbudowanej specyfikacji lub długiej notatce.
  for (const pageSize of ['A4', 'A3', 'A2'] as const) {
    const pdf = await renderToBuffer(<OfferDocument d={d} logo={logo} pageSize={pageSize} />);
    if ((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length === 1) return pdf;
  }
  throw new Error('Oferta nie mieści się na jednej stronie PDF.');
}

export function offerPdfFilename(number: number): string {
  return `Oferta-BENSTAL-${number}.pdf`;
}
