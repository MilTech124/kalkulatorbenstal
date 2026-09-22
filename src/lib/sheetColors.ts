import type { SheetType } from './pricing/types';

// Kolory według https://zimstalgaraze.pl/dostepna-kolorystyka-garazy/
export const SHEET_COLORS = {
  ral: [
    { key: 'ral-3011', label: 'RAL 3011 czerwony', swatch: '#8d1d2c' },
    { key: 'ral-5010', label: 'RAL 5010 niebieski', swatch: '#005387' },
    { key: 'ral-1002', label: 'RAL 1002 piaskowy', swatch: '#d2a65a' },
    { key: 'ral-3005', label: 'RAL 3005 wiśnia', swatch: '#5e2028' },
    { key: 'ral-9006', label: 'RAL 9006 srebrny', swatch: '#a5a8a6' },
    { key: 'ral-9010', label: 'RAL 9010 biały', swatch: '#f1efdf' },
    { key: 'ral-8017', label: 'RAL 8017 brązowy', swatch: '#49342f' },
  ],
  btx: [
    { key: 'btx-8017', label: 'BTX 8017 brązowy', swatch: '#45302b' },
    { key: 'btx-8004', label: 'BTX 8004 ceglasty', swatch: '#9c4d31' },
    { key: 'btx-6020', label: 'BTX 6020 zielony', swatch: '#354a3e' },
    { key: 'btx-3011', label: 'BTX 3011 czerwony', swatch: '#801f2a' },
    { key: 'btx-9005', label: 'BTX 9005 czarny', swatch: '#202225' },
    { key: 'btx-7016', label: 'BTX 7016 antracyt', swatch: '#383e42' },
  ],
  wood: [
    { key: 'wood-grafit', label: 'BTX drewnopodobny grafit', swatch: 'repeating-linear-gradient(100deg, #33383a 0 3px, #515553 4px 6px, #292f30 7px 10px)' },
    { key: 'wood-orzech', label: 'BTX drewnopodobny orzech', swatch: 'repeating-linear-gradient(100deg, #60402c 0 3px, #845b39 4px 6px, #503522 7px 10px)' },
    { key: 'wood-zloty-dab', label: 'BTX drewnopodobny złoty dąb', swatch: 'repeating-linear-gradient(100deg, #a8773a 0 3px, #c3934e 4px 6px, #8a602d 7px 10px)' },
  ],
} as const;

export type SheetColorFamily = keyof typeof SHEET_COLORS;

export function sheetColorFamily(sheet: SheetType, color?: string): SheetColorFamily | 'ocynk' {
  if (sheet === 'ocynk') return 'ocynk';
  if (sheet === 'wood') return 'wood';
  return color?.startsWith('btx-') ? 'btx' : 'ral';
}

export function normalizedSheetColor(sheet: SheetType, color?: string): string | undefined {
  const family = sheetColorFamily(sheet, color);
  if (family === 'ocynk') return undefined;
  return SHEET_COLORS[family].find((option) => option.key === color)?.key ?? SHEET_COLORS[family][0].key;
}

/**
 * Klucz oznaczajacy "taki jak poszycie garazu". Element bez wlasnego koloru (brama, drzwi, okno, okucia, dach)
 * idzie za kolorem scian; wybor konkretnego koloru przypina go na stale i zmiana koloru scian go nie rusza.
 */
export const INHERIT_COLOR = '';

/** Lista kolorow danej palety z pozycja "jak poszycie garazu" na poczatku. */
export function colorOptionsWithInherit(family: SheetColorFamily, baseColor: string | undefined, inheritLabel = 'Taki jak poszycie garażu') {
  const base = SHEET_COLORS[family].find((option) => option.key === baseColor) ?? SHEET_COLORS[family][0];
  return [{ key: INHERIT_COLOR, label: `${inheritLabel} – ${base.label}`, swatch: base.swatch }, ...SHEET_COLORS[family]];
}

/** Blacha i kolor dachu z uwzglednieniem dziedziczenia po scianach. */
export function resolvedRoof(input: { sheet: SheetType; sheetColor?: string; roofSheet?: SheetType; roofColor?: string }): { sheet: SheetType; color?: string } {
  const sheet = input.roofSheet ?? input.sheet;
  return { sheet, color: input.roofColor ?? (sheet === input.sheet ? input.sheetColor : undefined) };
}

export function sheetColorLabel(sheet: SheetType, color?: string): string {
  const family = sheetColorFamily(sheet, color);
  if (family === 'ocynk') return 'ocynkowana';
  if (!color) return family === 'wood' ? 'drewnopodobny (kolor do ustalenia)' : 'z palety RAL (kolor do ustalenia)';
  const key = normalizedSheetColor(sheet, color);
  return SHEET_COLORS[family].find((option) => option.key === key)?.label ?? '';
}
