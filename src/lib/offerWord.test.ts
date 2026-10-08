import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { emptyInput } from './pricing/engine';
import { renderOfferWord } from './offerWord';
import { offerWordFilename } from './offerWord';
import { offerPdfFilename } from './offerPdf';
import { offerCompanyProfile, type OfferCompany } from './offerCompany';
import fs from 'node:fs';
import path from 'node:path';

describe('oferta Word', () => {
  it.each([
    [undefined, 'steel'],
    ['zimstal', 'steel'],
    ['zimstal', 'sandwich'],
  ] as const)('stosuje firmę %s i kontakt dla %s wraz z lokalnym logo', (company, productType) => {
    const input = { ...emptyInput(DEFAULT_PRICE_LIST), productType };
    const profile = offerCompanyProfile(company, productType);
    const archive = unzipSync(new Uint8Array(renderOfferWord({
      company, input, number: 7, createdAt: new Date('2026-10-08'),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', street: 'Polna 1', postalCode: '00-001', city: 'Warszawa' },
      priceList: DEFAULT_PRICE_LIST, effectiveHeight: input.height, total: 12345,
      currency: { code: 'EUR', rate: 4 }, note: 'Dopisek',
    })));
    const decode = (name: string) => new TextDecoder().decode(archive[name]);
    const document = decode('word/document.xml');
    expect(document).toContain(profile.name);
    expect(document).toContain(profile.address);
    expect(document).toContain(profile.email);
    expect(document).toContain(`+48 ${profile.phones[0]}`);
    expect(document).toContain(`www.${profile.domain}`);
    expect(document).toContain('2 do około 10 tygodni');
    expect(document).toContain('EUR');
    expect(document).toContain('Dopisek');
    if (company === 'zimstal') {
      expect(document).toContain('NIP: 7371859447');
      expect(document).not.toContain('BEN-STAL');
      expect(document).not.toContain('www.benstal.pl');
    }
    expect(decode('word/_rels/document.xml.rels')).toContain('Target="media/logo.png"');
    expect(decode('[Content_Types].xml')).toContain('ContentType="image/png"');
    expect(Buffer.from(archive['word/media/logo.png'])).toEqual(fs.readFileSync(path.join(process.cwd(), 'src/assets', profile.logo)));
  });

  it.each([undefined, 'benstal', 'zimstal'] as (OfferCompany | undefined)[])('nazywa oba formaty według firmy %s', (company) => {
    const expected = company === 'zimstal' ? 'ZIMSTAL' : 'BENSTAL';
    expect(offerPdfFilename(7, company)).toBe(`Oferta-${expected}-7.pdf`);
    expect(offerWordFilename(7, company)).toBe(`Oferta-${expected}-7.docx`);
  });

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
