import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { emptyInput } from './pricing/engine';
import { renderOfferWord } from './offerWord';

describe('oferta Word', () => {
  it('tworzy edytowalny DOCX z ceną, specyfikacją i warunkami oferty', () => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), sheet: 'wood' as const, sheetColor: 'wood-grafit', roofSheet: 'ral' as const, roofColor: 'btx-7016' };
    const buffer = renderOfferWord({
      number: 42,
      createdAt: new Date('2026-09-21T12:00:00Z'),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', email: '', street: 'Polna 1', postalCode: '00-001', city: 'Warszawa' },
      input,
      priceList: DEFAULT_PRICE_LIST,
      effectiveHeight: input.height,
      total: 7300,
      note: 'Cena <do potwierdzenia> & montaż',
    });
    const archive = unzipSync(new Uint8Array(buffer));
    const document = new TextDecoder().decode(archive['word/document.xml']);
    expect(document).toContain('Oferta nr 42');
    expect(document).toContain('BTX drewnopodobny grafit');
    expect(document).toContain('BTX 7016 antracyt');
    expect(document).toContain('7300 zł');
    expect(document).toContain('Transport i montaż GRATIS');
    expect(document).toContain('Cena &lt;do potwierdzenia&gt; &amp; montaż');
    expect(document).toContain('Oferta cenowa jest ważna 2 dni');
  });
});
