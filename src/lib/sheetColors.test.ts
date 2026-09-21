import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { emptyInput } from './pricing/engine';
import { quoteInputSchema } from './pricing/schemas';
import { offerSummary } from './offer';

describe('kolor blachy w zapisanej wycenie i PDF', () => {
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
});
