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
  page: { fontFamily: 'Roboto', fontSize: 10.5, color: '#1c2430', paddingTop: 0, paddingBottom: 76, paddingHorizontal: 0 },
  header: { backgroundColor: DARK, paddingVertical: 16, paddingHorizontal: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 150 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { color: '#aab3bf', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' },
  headerValue: { color: '#ffffff', fontSize: 12, fontWeight: 700, marginTop: 2 },
  body: { paddingHorizontal: 40, paddingTop: 20 },
  kicker: { color: ACCENT, fontSize: 8.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontSize: 19, fontWeight: 700, marginBottom: 10 },
  p: { fontSize: 10.5, lineHeight: 1.5, color: '#3a4350', marginBottom: 6 },
  cols: { flexDirection: 'row', gap: 16, marginTop: 6, marginBottom: 12 },
  box: { flex: 1, borderWidth: 1, borderColor: '#e3e7ec', borderRadius: 6, padding: 10 },
  boxTitle: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  boxLine: { fontSize: 10, lineHeight: 1.45 },
  table: { borderWidth: 1, borderColor: '#e3e7ec', borderRadius: 6, overflow: 'hidden' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eceff3' },
  trLast: { borderBottomWidth: 0 },
  th: { width: '34%', paddingVertical: 5.5, paddingHorizontal: 10, color: MUTED, backgroundColor: '#f7f8fa' },
  td: { flex: 1, paddingVertical: 5.5, paddingHorizontal: 10, fontWeight: 700 },
  priceBox: { marginTop: 14, backgroundColor: DARK, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { color: '#aab3bf', fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase' },
  priceHint: { color: '#aab3bf', fontSize: 9, marginTop: 4 },
  price: { color: '#ffffff', fontSize: 26, fontWeight: 700 },
  note: { marginTop: 10, padding: 10, backgroundColor: '#fff7ef', borderLeftWidth: 3, borderLeftColor: ACCENT, fontSize: 10, lineHeight: 1.5, color: '#3a4350' },
  disclaimer: { marginTop: 10, fontSize: 8, lineHeight: 1.45, color: '#8a93a0' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#f7f8fa', borderTopWidth: 1, borderTopColor: '#e3e7ec', paddingVertical: 11, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerName: { fontSize: 9, fontWeight: 700 },
  footerText: { fontSize: 8.5, color: MUTED, lineHeight: 1.45 },
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
  currency?: { code: string; rate: number };
}

const fmt = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
const pln = (n: number) => `${n.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`;

function OfferDocument({ d, logo }: { d: OfferPdfData; logo: Buffer }) {
  const rows = offerSummary(d.input, d.priceList, d.effectiveHeight);
  const date = d.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = `${d.customer.firstName} ${d.customer.lastName}`.trim();
  const validDays = d.validDays ?? 14;
  const foreign = d.currency && d.currency.code !== 'PLN' && d.currency.rate > 0 ? d.currency : null;

  return (
    <Document title={`Oferta BEN-STAL nr ${d.number}`} author={COMPANY.short} subject={`Wycena garażu ${fmt(d.input.width)} × ${fmt(d.input.length)} m`}>
      <Page size="A4" style={s.page}>
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
          <Text style={s.p}>Dzień dobry{name ? ` ${name}` : ''},</Text>
          <Text style={s.p}>dziękujemy za zainteresowanie naszą ofertą. Poniżej przedstawiamy podsumowanie wybranej konfiguracji garażu oraz cenę.</Text>

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

          <View style={s.table}>
            {rows.map((r, i) => (
              <View key={r.label} style={i === rows.length - 1 ? [s.tr, s.trLast] : s.tr} wrap={false}>
                <Text style={s.th}>{r.label}</Text>
                <Text style={s.td}>{r.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.priceBox} wrap={false}>
            <View>
              <Text style={s.priceLabel}>Cena całkowita brutto</Text>
              <Text style={s.priceHint}>z montażem · oferta ważna {validDays} dni</Text>
              {foreign ? <Text style={s.priceHint}>{pln(d.total)} wg kursu 1 {foreign.code} = {fmt(foreign.rate)} zł</Text> : null}
            </View>
            <Text style={s.price}>{foreign ? formatMoney(convertFromPln(d.total, foreign), foreign.code) : pln(d.total)}</Text>
          </View>

          {d.note ? <Text style={s.note}>{d.note}</Text> : null}

          <Text style={[s.p, { marginTop: 10 }]}>Chętnie odpowiemy na pytania i ustalimy termin montażu – prosimy o kontakt telefoniczny lub mailowy.</Text>
          <Text style={s.disclaimer}>
            Wycena została przygotowana na podstawie konfiguracji z kalkulatora i ma charakter orientacyjny – ostateczna cena zostanie potwierdzona przez naszego przedstawiciela. Dokument nie stanowi
            oferty handlowej w rozumieniu art. 66 Kodeksu cywilnego.
          </Text>
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
  return renderToBuffer(<OfferDocument d={d} logo={logo} />);
}

export function offerPdfFilename(number: number): string {
  return `Oferta-BENSTAL-${number}.pdf`;
}
