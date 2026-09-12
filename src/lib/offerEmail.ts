// Szablon e-maila ofertowego BEN-STAL: podsumowanie konfiguracji (bez rozbicia cen) + cena koncowa.
import { GATE_LABELS, normalizeInput } from '@/lib/pricing/engine';
import type { CustomerInfo, PriceList, QuoteInput } from '@/lib/pricing/types';

export const COMPANY = {
  name: 'F.P.H.U. „BEN-STAL” Galica Beniamin',
  short: 'BEN-STAL',
  tagline: 'Producent garaży blaszanych, hal, wiat i carportów',
  address: 'Przenosza 102, 34-625 Skrzydlna',
  phones: ['602 348 266', '533 615 010'],
  email: 'biuro@benstal.pl',
  www: 'https://benstal.pl',
  facebook: 'https://www.facebook.com/102612067971157',
};

export interface OfferEmailData {
  number: number;
  customer: Pick<CustomerInfo, 'firstName' | 'lastName' | 'street' | 'postalCode' | 'city' | 'address'>;
  input: QuoteInput;
  priceList: PriceList;
  effectiveHeight: number;
  total: number;
  /** Bazowy URL aplikacji (do logo), np. https://kalkulator.benstal.pl */
  appOrigin: string;
  validDays?: number;
  note?: string;
}

const fmt = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
const pln = (n: number) => `${n.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Lista pozycji podsumowania (etykieta -> wartosc) bez cen. */
export function offerSummary(raw: QuoteInput, pl: PriceList, effectiveHeight: number): { label: string; value: string }[] {
  const input = normalizeInput(raw);
  const rows: { label: string; value: string }[] = [
    { label: 'Wymiary', value: `${fmt(input.width)} × ${fmt(input.length)} m, wysokość ${fmt(effectiveHeight)} m` },
    { label: 'Dach', value: pl.roofTypes[input.roofType]?.label ?? input.roofType },
    { label: 'Blacha', value: `${pl.sheetLabels[input.sheet]}${input.horizontalPanel ? ', poziomy panel' : ''}` },
  ];
  if (input.gates.length) {
    rows.push({
      label: input.gates.length > 1 ? 'Bramy' : 'Brama',
      value: input.gates
        .map((g) => `${GATE_LABELS[g.type]} ${fmt(g.width)} × ${fmt(g.height)} m${g.automat && g.type !== 'sectional' ? ' z automatem' : ''}${g.winchester ? ', winchester' : ''}${g.doorInGate ? ', drzwi w bramie' : ''}`)
        .join('; '),
    });
  } else {
    rows.push({ label: 'Brama', value: 'bez bramy' });
  }
  const roofOpts = [input.gutters && 'rynny', input.felt && 'filc antykondensacyjny', input.tile && 'blachodachówka'].filter(Boolean) as string[];
  if (roofOpts.length) rows.push({ label: 'Wyposażenie dachu', value: roofOpts.join(', ') });
  const openings: string[] = input.windows.filter((w) => w.qty > 0).map((w) => `${pl.windows[w.type]?.label ?? w.type} × ${w.qty}`);
  if (input.doors > 0) openings.push(`drzwi × ${input.doors}`);
  if (openings.length) rows.push({ label: 'Okna i drzwi', value: openings.join(', ') });
  const extras = [
    input.extras.lockKowal && 'zamek kowalski',
    input.extras.padlockHolder && 'uchwyt na kłódkę',
    input.extras.anchoring && 'kotwiczenie',
    input.extras.ventGrilleQty > 0 && `kratka wentylacyjna × ${input.extras.ventGrilleQty}`,
  ].filter(Boolean) as string[];
  if (extras.length) rows.push({ label: 'Dodatki', value: extras.join(', ') });
  if (input.carport.enabled) rows.push({ label: 'Wiata', value: `${fmt(input.carport.width)} × ${fmt(input.carport.length)} m` });
  if (input.partitionWalls.length) {
    rows.push({ label: 'Ściany działowe', value: input.partitionWalls.map((w) => `${fmt(w.width)} × ${fmt(w.height)} m`).join(', ') });
  }
  if (input.openwork.mode === 'wall') rows.push({ label: 'Ażury', value: `ściana ${fmt(input.openwork.width)} × ${fmt(input.openwork.height)} m` });
  if (input.openwork.mode === 'whole') rows.push({ label: 'Ażury', value: 'cały garaż' });
  return rows;
}

export function renderOfferEmail(d: OfferEmailData): { subject: string; html: string; text: string } {
  const rows = offerSummary(d.input, d.priceList, d.effectiveHeight);
  const validDays = d.validDays ?? 14;
  const name = `${d.customer.firstName} ${d.customer.lastName}`.trim();
  const address = d.customer.street ? `${d.customer.street}, ${d.customer.postalCode} ${d.customer.city}` : (d.customer.address ?? '');
  const logo = `${d.appOrigin.replace(/\/+$/, '')}/email/benstal-logo.png`;
  const date = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  const subject = `Oferta BEN-STAL nr ${d.number} – garaż ${fmt(d.input.width)} × ${fmt(d.input.length)} m`;

  const rowsHtml = rows
    .map(
      (r, i) => `
        <tr style="background:${i % 2 ? '#f7f8fa' : '#ffffff'};">
          <td style="padding:10px 14px;font-size:14px;color:#5b6472;width:38%;border-bottom:1px solid #eceff3;">${esc(r.label)}</td>
          <td style="padding:10px 14px;font-size:14px;color:#1c2430;font-weight:600;border-bottom:1px solid #eceff3;">${esc(r.value)}</td>
        </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef0f3;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
  <tr>
    <td style="background:#1f2328;padding:28px 32px;text-align:center;">
      <img src="${logo}" alt="BEN-STAL – producent garaży blaszanych" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;">
    </td>
  </tr>
  <tr>
    <td style="padding:32px 32px 8px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#e8772e;font-weight:700;">Oferta nr ${d.number} · ${esc(date)}</p>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1c2430;">Wycena garażu blaszanego ${fmt(d.input.width)} × ${fmt(d.input.length)} m</h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#3a4350;">Dzień dobry${name ? ` ${esc(name)}` : ''},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#3a4350;">dziękujemy za zainteresowanie naszą ofertą. Poniżej przesyłamy podsumowanie wybranej konfiguracji garażu${address ? ` (montaż: ${esc(address)})` : ''}.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eceff3;border-radius:10px;overflow:hidden;border-collapse:separate;">
        ${rowsHtml}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1f2328;border-radius:10px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#aab3bf;">Cena całkowita brutto</p>
            <p style="margin:4px 0 0;font-size:32px;font-weight:800;color:#ffffff;line-height:1.1;">${pln(d.total)}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#aab3bf;">z montażem na terenie całej Polski · oferta ważna ${validDays} dni</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${d.note ? `<tr><td style="padding:8px 32px 0;"><p style="margin:0;font-size:14px;line-height:1.55;color:#3a4350;white-space:pre-line;">${esc(d.note)}</p></td></tr>` : ''}
  <tr>
    <td style="padding:20px 32px 28px;">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3a4350;">Chętnie odpowiemy na pytania i ustalimy termin montażu – wystarczy odpisać na tę wiadomość lub zadzwonić.</p>
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="background:#e8772e;border-radius:8px;">
          <a href="tel:${COMPANY.phones[0].replace(/\s/g, '')}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Zadzwoń: ${COMPANY.phones[0]}</a>
        </td>
      </tr></table>
      <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#8a93a0;">Wycena została przygotowana na podstawie konfiguracji z kalkulatora i ma charakter orientacyjny – ostateczna cena zostanie potwierdzona przez naszego przedstawiciela. Nie stanowi oferty handlowej w rozumieniu art. 66 KC.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#f7f8fa;padding:20px 32px;border-top:1px solid #eceff3;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1c2430;">${esc(COMPANY.name)}</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#5b6472;">${esc(COMPANY.tagline)}<br>${esc(COMPANY.address)}<br>tel. ${COMPANY.phones.join(', ')} · <a href="mailto:${COMPANY.email}" style="color:#1f5fa8;text-decoration:none;">${COMPANY.email}</a> · <a href="${COMPANY.www}" style="color:#1f5fa8;text-decoration:none;">benstal.pl</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `${COMPANY.short} – oferta nr ${d.number} (${date})`,
    `Wycena garażu blaszanego ${fmt(d.input.width)} × ${fmt(d.input.length)} m`,
    '',
    `Dzień dobry${name ? ` ${name}` : ''},`,
    'dziękujemy za zainteresowanie naszą ofertą. Podsumowanie konfiguracji:',
    '',
    ...rows.map((r) => `- ${r.label}: ${r.value}`),
    '',
    `CENA CAŁKOWITA BRUTTO: ${pln(d.total)} (z montażem, oferta ważna ${validDays} dni)`,
    d.note ? `\n${d.note}` : '',
    '',
    `Kontakt: tel. ${COMPANY.phones.join(', ')}, ${COMPANY.email}, ${COMPANY.www}`,
    COMPANY.name,
    COMPANY.address,
    '',
    'Wycena ma charakter orientacyjny i nie stanowi oferty handlowej w rozumieniu art. 66 KC.',
  ].join('\n');

  return { subject, html, text };
}
