// Dane firmy i podsumowanie konfiguracji do oferty (PDF): bez rozbicia cen, tylko cena koncowa.
import { GATE_LABELS, normalizeInput, sandwichPanel, SHEET_LAYOUT_LABELS, sheetLayout } from '@/lib/pricing/engine';
import type { PriceList, QuoteInput } from '@/lib/pricing/types';
import { sheetColorLabel } from '@/lib/sheetColors';

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

const fmt = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });

/** Lista pozycji podsumowania (etykieta -> wartosc) bez cen. */
export function offerSummary(raw: QuoteInput, pl: PriceList, effectiveHeight: number): { label: string; value: string }[] {
  const input = normalizeInput(raw);
  const rows: { label: string; value: string }[] = [
    { label: 'Rodzaj', value: input.productType === 'sandwich' ? `Garaż warstwowy${sandwichPanel(pl, input.sandwichPanel) ? ` – ${sandwichPanel(pl, input.sandwichPanel)!.label.toLowerCase()}` : ''}` : 'Garaż blaszany' },
    { label: 'Szerokość (ściana przednia i tylna)', value: `${fmt(input.width)} m` },
    { label: 'Długość (ściany boczne)', value: `${fmt(input.length)} m` },
    { label: 'Wysokość w najwyższym punkcie', value: `${fmt(effectiveHeight)} m` },
  ];
  const sandwich = input.productType === 'sandwich';
  if (!sandwich) {
    rows.push({ label: 'Rodzaj spadu dachu', value: pl.roofTypes[input.roofType]?.label ?? input.roofType });
    rows.push({ label: 'Poszycie ścian', value: `blacha trapezowa, ${SHEET_LAYOUT_LABELS[sheetLayout(input)].toLowerCase()}, kolor: ${sheetColorLabel(input.sheet, input.sheetColor)}` });
    rows.push({ label: 'Poszycie dachu', value: input.tile ? `blachodachówka, kolor: ${sheetColorLabel(input.sheet, input.sheetColor)}` : `blacha trapezowa, kolor: ${sheetColorLabel(input.sheet, input.sheetColor)}` });
    const structure = input.structure ? pl.structures?.find((o) => o.key === input.structure) : undefined;
    rows.push({ label: 'Konstrukcja', value: structure?.label ?? 'kątownik' });
  }
  if (input.gates.length) {
    rows.push({
      label: input.gates.length > 1 ? 'Bramy' : 'Brama',
      value: input.gates
        .map((g) => `${GATE_LABELS[g.type]} ${fmt(g.width)} × ${fmt(g.height)} m${g.automat && g.type !== 'sectional' ? ' z automatem' : ''}${g.winchester ? ', winchester' : ''}${g.doorInGate ? ', drzwi w bramie' : ''}${g.lockKowal ? ', zamek kowal' : ''}`)
        .join('; '),
    });
    if (!sandwich) rows.push({ label: 'Poszycie bramy', value: `blacha trapezowa, kolor: ${sheetColorLabel(input.sheet, input.sheetColor)}` });
  } else {
    rows.push({ label: 'Brama', value: 'bez bramy' });
  }
  const roofOpts = [(input.flashings ?? true) && 'okucia', input.gutters && 'rynny', input.felt && 'filc antykondensacyjny', input.tile && 'blachodachówka'].filter(Boolean) as string[];
  if (!sandwich && roofOpts.length) rows.push({ label: 'Wyposażenie dachu', value: roofOpts.join(', ') });
  const openings: string[] = input.windows.filter((w) => w.qty > 0).map((w) => `${pl.windows[w.type]?.label ?? w.type} × ${w.qty}`);
  if (input.doors > 0) openings.push(`drzwi wejściowe × ${input.doors}${input.doorLocks ? ` (zamek kowal × ${Math.min(input.doorLocks, input.doors)})` : ''}${!sandwich ? `, poszycie: ${sheetColorLabel(input.sheet, input.sheetColor)}` : ''}`);
  if (openings.length) rows.push({ label: 'Okna i drzwi', value: openings.join(', ') });
  const extras = [
    input.extras.lockKowal && 'zamek kowal',
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
