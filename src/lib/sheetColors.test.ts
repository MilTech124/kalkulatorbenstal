import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { calculateQuote, emptyInput } from './pricing/engine';
import { quoteInputSchema } from './pricing/schemas';
import { offerSummary } from './offer';
import { INHERIT_COLOR, SHEET_COLORS, colorOptionsWithInherit, resolvedRoof } from './sheetColors';

describe('kolor blachy w zapisanej wycenie i PDF', () => {
  it('pozwala wybrać dach BTX przy drewnopodobnych ścianach i oznacza cenę do potwierdzenia', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'wood' as const, sheetColor: 'wood-grafit', roofSheet: 'ral' as const, roofColor: 'btx-7016' };
    expect(quoteInputSchema.safeParse(input).success).toBe(true);
    const rows = offerSummary(input, DEFAULT_PRICE_LIST, input.height);
    expect(rows.find((row) => row.label === 'Poszycie dachu')?.value).toBe('blacha trapezowa, kolor: BTX 7016 antracyt');
    expect(calculateQuote(input, DEFAULT_PRICE_LIST).needsManualQuote).toBe(true);
  });

  it('odrzuca kolor dachu spoza wybranej palety', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), roofSheet: 'wood' as const, roofColor: 'btx-7016' };
    const result = quoteInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('roofColor');
  });

  it('zachowuje matowy BTX i pokazuje jego kolor w ofercie', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'ral' as const, sheetColor: 'btx-7016' };
    expect(quoteInputSchema.safeParse(input).success).toBe(true);
    expect(offerSummary(input, DEFAULT_PRICE_LIST, input.height)).toContainEqual({
      label: 'Poszycie dachu',
      value: 'blacha trapezowa, kolor: BTX 7016 antracyt',
    });
  });

  it('odrzuca kolor z innej palety', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'wood' as const, sheetColor: 'ral-3011' };
    expect(quoteInputSchema.safeParse(input).success).toBe(false);
  });

  it('nie wymyśla koloru dla starszej wyceny', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'ral' as const };
    expect(offerSummary(input, DEFAULT_PRICE_LIST, input.height).find((row) => row.label === 'Poszycie ścian')?.value).toContain('kolor do ustalenia');
  });

  it('zapisuje osobne kolory bram i drzwi oraz pokazuje je w PDF', () => {
    const base = emptyInput(DEFAULT_PRICE_LIST);
    const input = {
      ...base,
      sheet: 'ral' as const,
      sheetColor: 'btx-7016',
      gates: [{ ...base.gates[0], color: 'btx-8017' }, { ...base.gates[0], color: 'btx-9005' }],
      doors: 2,
      doorColors: ['btx-3011', 'btx-6020'],
    };
    expect(quoteInputSchema.safeParse(input).success).toBe(true);
    const rows = offerSummary(input, DEFAULT_PRICE_LIST, input.height);
    expect(rows.find((row) => row.label === 'Poszycie bramy 1')?.value).toContain('BTX 8017 brązowy');
    expect(rows.find((row) => row.label === 'Poszycie bramy 2')?.value).toContain('BTX 9005 czarny');
    expect(rows.find((row) => row.label === 'Poszycie drzwi 1')?.value).toContain('BTX 3011 czerwony');
    expect(rows.find((row) => row.label === 'Poszycie drzwi 2')?.value).toContain('BTX 6020 zielony');
    expect(calculateQuote(input, DEFAULT_PRICE_LIST).total).toBe(calculateQuote({ ...input, gates: input.gates.map((gate) => ({ ...gate, color: undefined })), doorColors: undefined }, DEFAULT_PRICE_LIST).total);
  });

  it('odrzuca kolory bram i drzwi spoza wybranej palety', () => {
    const base = emptyInput(DEFAULT_PRICE_LIST);
    const input = { ...base, sheet: 'wood' as const, sheetColor: 'wood-grafit', gates: [{ ...base.gates[0], color: 'ral-3011' }], doors: 1, doorColors: ['btx-7016'] };
    const result = quoteInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(expect.arrayContaining(['gates.0.color', 'doorColors.0']));
  });

  it('zapisuje osobne kolory okien i okuć oraz pokazuje je w ofercie', () => {
    const input = {
      ...emptyInput(DEFAULT_PRICE_LIST),
      sheet: 'ral' as const,
      sheetColor: 'btx-7016',
      flashingColor: 'btx-8017',
      windows: [
        { type: 'w100x60' as const, qty: 2, color: 'btx-3011' },
        { type: 'w80x60' as const, qty: 1, color: 'btx-6020' },
        { type: 'opening' as const, qty: 1 },
      ],
    };
    expect(quoteInputSchema.safeParse(input).success).toBe(true);
    const rows = offerSummary(input, DEFAULT_PRICE_LIST, input.height);
    expect(rows.find((row) => row.label === 'Kolor okuć')?.value).toBe('BTX 8017 brązowy');
    expect(rows.find((row) => row.label === 'Kolor okien')?.value).toContain('Okno 100×60: BTX 3011 czerwony');
    expect(rows.find((row) => row.label === 'Kolor okien')?.value).toContain('Okno 80×60: BTX 6020 zielony');
    expect(rows.find((row) => row.label === 'Kolor okien')?.value).not.toContain('Otwór okienny');
    expect(calculateQuote(input, DEFAULT_PRICE_LIST).total).toBe(calculateQuote({ ...input, flashingColor: undefined, windows: input.windows.map((window) => ({ ...window, color: undefined })) }, DEFAULT_PRICE_LIST).total);
  });

  // Uwaga klienta 22.09.2026: kolor poszycia narzuca palete okuc, bram, drzwi i okien - w obie strony.
  it('nie pozwala zestawić poszycia drewnopodobnego z okuciami, oknami, bramą ani drzwiami z palety RAL/BTX', () => {
    const base = emptyInput(DEFAULT_PRICE_LIST);
    const input = {
      ...base,
      sheet: 'wood' as const,
      sheetColor: 'wood-zloty-dab',
      flashingColor: 'ral-9010',
      gates: [{ ...base.gates[0], color: 'btx-9005' }],
      doors: 1,
      doorColors: ['ral-3011'],
      windows: [{ type: 'w100x60' as const, qty: 1, color: 'btx-7016' }],
    };
    const result = quoteInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['flashingColor', 'gates.0.color', 'doorColors.0', 'windows.0.color']),
      );
    }
  });

  it('i odwrotnie: przy poszyciu RAL/BTX nie przyjmuje kolorów drewnopodobnych', () => {
    const base = emptyInput(DEFAULT_PRICE_LIST);
    const input = {
      ...base,
      sheet: 'ral' as const,
      sheetColor: 'ral-5010',
      flashingColor: 'wood-orzech',
      gates: [{ ...base.gates[0], color: 'wood-grafit' }],
      doors: 1,
      doorColors: ['wood-zloty-dab'],
      windows: [{ type: 'w80x60' as const, qty: 1, color: 'wood-orzech' }],
    };
    const result = quoteInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['flashingColor', 'gates.0.color', 'doorColors.0', 'windows.0.color']),
      );
    }
  });

  it('udostępnia do wyboru wyłącznie paletę poszycia', () => {
    expect(colorOptionsWithInherit('wood', 'wood-orzech').every((option) => option.key === INHERIT_COLOR || option.key.startsWith('wood-'))).toBe(true);
    expect(colorOptionsWithInherit('btx', 'btx-9005').every((option) => option.key === INHERIT_COLOR || option.key.startsWith('btx-'))).toBe(true);
    expect(colorOptionsWithInherit('ral', 'ral-3011').every((option) => option.key === INHERIT_COLOR || option.key.startsWith('ral-'))).toBe(true);
  });

  it('zmiana koloru ścian nie rusza elementów z własnym kolorem, a dziedziczące idą za nią', () => {
    const base = emptyInput(DEFAULT_PRICE_LIST);
    const czerwone = {
      ...base,
      sheet: 'ral' as const,
      sheetColor: 'ral-3011',
      // brama ma wlasny kolor, drzwi i okucia ida za poszyciem
      gates: [{ ...base.gates[0], color: 'ral-9010' }],
      doors: 1,
      doorColors: [INHERIT_COLOR],
    };
    const niebieskie = { ...czerwone, sheetColor: 'ral-5010' };
    expect(quoteInputSchema.safeParse(niebieskie).success).toBe(true);

    const przed = offerSummary(czerwone, DEFAULT_PRICE_LIST, czerwone.height);
    const po = offerSummary(niebieskie, DEFAULT_PRICE_LIST, niebieskie.height);
    expect(przed.find((row) => row.label === 'Poszycie bramy')?.value).toContain('RAL 9010 biały');
    expect(po.find((row) => row.label === 'Poszycie bramy')?.value).toContain('RAL 9010 biały');
    expect(przed.find((row) => row.label === 'Poszycie drzwi')?.value).toContain('RAL 3011 czerwony');
    expect(po.find((row) => row.label === 'Poszycie drzwi')?.value).toContain('RAL 5010 niebieski');
    expect(po.find((row) => row.label === 'Kolor okuć')?.value).toBe('RAL 5010 niebieski');
  });

  it('dach bez własnego ustawienia idzie za kolorem ścian', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'ral' as const, sheetColor: 'ral-9006' };
    expect(resolvedRoof(input)).toEqual({ sheet: 'ral', color: 'ral-9006' });
    expect(resolvedRoof({ ...input, roofSheet: 'wood', roofColor: 'wood-orzech' })).toEqual({ sheet: 'wood', color: 'wood-orzech' });
    expect(offerSummary(input, DEFAULT_PRICE_LIST, input.height).find((row) => row.label === 'Poszycie dachu')?.value).toContain('RAL 9006 srebrny');
  });

  it('lista kolorów zaczyna się od pozycji „taki jak poszycie” z aktualnym kolorem ścian', () => {
    const options = colorOptionsWithInherit('ral', 'ral-8017');
    expect(options[0].key).toBe(INHERIT_COLOR);
    expect(options[0].label).toContain('RAL 8017 brązowy');
    expect(options).toHaveLength(SHEET_COLORS.ral.length + 1);
  });

  it('odrzuca kolor otworu okiennego i kolor okuć spoza palety', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'wood' as const, sheetColor: 'wood-orzech', flashingColor: 'ral-3011', windows: [{ type: 'opening' as const, qty: 1, color: 'wood-grafit' }] };
    const result = quoteInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(expect.arrayContaining(['flashingColor', 'windows.0.color']));
  });
});
