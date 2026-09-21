import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { calculateQuote, emptyInput } from './pricing/engine';
import { renderOfferPdf } from './offerPdf';

describe('układ oferty PDF', () => {
  it('mieści ofertę z wyposażeniem na jednej stronie', async () => {
    const input = {
      ...emptyInput(DEFAULT_PRICE_LIST),
      sheet: 'ral' as const,
      sheetColor: 'btx-7016',
      roofType: 'gable' as const,
      doors: 1,
      windows: [{ type: 'w100x60' as const, qty: 2 }],
      gutters: true,
      felt: true,
      carport: { enabled: true, width: 3, length: 4 },
      partitionWalls: [{ width: 3, height: 2 }],
    };
    const result = calculateQuote(input, DEFAULT_PRICE_LIST);
    const pdf = await renderOfferPdf({
      number: 123,
      createdAt: new Date('2026-09-21'),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '602 348 266', email: 'jan@example.com', street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa' },
      input,
      priceList: DEFAULT_PRICE_LIST,
      effectiveHeight: result.effectiveHeight,
      total: result.total,
      note: 'Wszystkie szczegóły do potwierdzenia przed realizacją.',
    });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    fs.mkdirSync('tmp/pdfs', { recursive: true });
    fs.writeFileSync('tmp/pdfs/offer-a4.pdf', pdf);
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  });

  it('zachowuje jedną stronę także przy długiej notatce i rozbudowanej specyfikacji', async () => {
    const input = {
      ...emptyInput(DEFAULT_PRICE_LIST),
      sheet: 'wood' as const,
      sheetColor: 'wood-zloty-dab',
      gates: Array.from({ length: 3 }, () => ({ ...emptyInput(DEFAULT_PRICE_LIST).gates[0] })),
      windows: [{ type: 'w100x60' as const, qty: 4 }, { type: 'w80x60' as const, qty: 2 }, { type: 'w60x40' as const, qty: 2 }],
      doors: 2,
      gutters: true,
      felt: true,
      tile: true,
      carport: { enabled: true, width: 4, length: 6 },
      partitionWalls: Array.from({ length: 10 }, () => ({ width: 3, height: 2 })),
      openwork: { mode: 'wall' as const, width: 2, height: 2 },
      extras: { lockKowal: true, anchoring: true, padlockHolder: true, ventGrilleQty: 3 },
    };
    const result = calculateQuote(input, DEFAULT_PRICE_LIST);
    const pdf = await renderOfferPdf({
      number: 124,
      createdAt: new Date('2026-09-21'),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '602 348 266', email: 'jan@example.com', street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa' },
      input,
      priceList: DEFAULT_PRICE_LIST,
      effectiveHeight: result.effectiveHeight,
      total: result.total,
      note: 'Uzgodnienie szczegółów technicznych i terminu dostawy podczas składania zamówienia. '.repeat(24).slice(0, 1900),
    });
    fs.mkdirSync('tmp/pdfs', { recursive: true });
    fs.writeFileSync('tmp/pdfs/offer-a3.pdf', pdf);
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  });

  it('nie gubi strony przy maksymalnej notatce i wielu pozycjach', async () => {
    const input = {
      ...emptyInput(DEFAULT_PRICE_LIST),
      sheet: 'wood' as const,
      sheetColor: 'wood-grafit',
      gates: Array.from({ length: 6 }, () => ({ ...emptyInput(DEFAULT_PRICE_LIST).gates[0], automat: true, winchester: true, doorInGate: true, lockKowal: true })),
      windows: Array.from({ length: 20 }, () => ({ type: 'w100x60' as const, qty: 50 })),
      doors: 20,
      doorLocks: 20,
      gutters: true,
      felt: true,
      tile: true,
      carport: { enabled: true, width: 20, length: 50 },
      partitionWalls: Array.from({ length: 10 }, () => ({ width: 20, height: 6 })),
      openwork: { mode: 'wall' as const, width: 20, height: 6 },
      extras: { lockKowal: true, anchoring: true, padlockHolder: true, ventGrilleQty: 50 },
    };
    const result = calculateQuote(input, DEFAULT_PRICE_LIST);
    const pdf = await renderOfferPdf({
      number: 125,
      createdAt: new Date('2026-09-21'),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '602 348 266', email: 'jan@example.com', street: 'Testowa 12', postalCode: '00-001', city: 'Warszawa' },
      input,
      priceList: DEFAULT_PRICE_LIST,
      effectiveHeight: result.effectiveHeight,
      total: result.total,
      note: 'Uzgodnienie szczegółów technicznych i terminu dostawy podczas składania zamówienia. '.repeat(26).slice(0, 2000),
    });
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
  });
});
