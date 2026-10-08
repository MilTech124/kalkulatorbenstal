import { describe, expect, it } from 'vitest';
import { offerCompanyProfile, offerCompanyTerms, resolveOfferCompany } from './offerCompany';
import { saveQuoteSchema } from './pricing/schemas';
import { emptyInput } from './pricing/engine';
import { DEFAULT_PRICE_LIST } from './pricing/defaults';
import { QuoteModel } from '@/models/Quote';

describe('firma wystawiająca ofertę', () => {
  it('zachowuje Benstal dla starych danych i nowych wycen bez wyboru', () => {
    expect(resolveOfferCompany()).toBe('benstal');
    expect(offerCompanyProfile().email).toBe('biuro@benstal.pl');
    expect(new QuoteModel().offerCompany).toBe('benstal');
  });

  it('dobiera kontakt Zimstal do rodzaju garażu i zachowuje warunki realizacji', () => {
    const steel = offerCompanyProfile('zimstal', 'steel');
    const sandwich = offerCompanyProfile('zimstal', 'sandwich');
    expect(steel).toMatchObject({ phones: ['530 163 444'], email: 'biuro.zimstal@gmail.com', nip: '7371859447' });
    expect(sandwich).toMatchObject({ phones: ['508 330 803'], email: 'biuro.benstalzimstalgroup@gmail.com', logo: steel.logo });
    expect(offerCompanyProfile('benstal', 'sandwich').phones).toEqual(['602 348 266', '533 615 010']);
    expect(offerCompanyTerms(sandwich)).toContain('Termin realizacji zamówienia wynosi od 2 do około 10 tygodni.');
    expect(offerCompanyTerms(sandwich).join(' ')).toContain('+48 508 330 803');
  });

  it('przyjmuje obie firmy i odrzuca nieznaną firmę przy zapisie', async () => {
    const payload = {
      input: emptyInput(DEFAULT_PRICE_LIST),
      customer: { firstName: 'Jan', lastName: 'Kowalski', phone: '123456789', street: 'Polna 1', postalCode: '00-001', city: 'Warszawa' },
    };
    expect(saveQuoteSchema.safeParse(payload).success).toBe(true);
    for (const company of ['benstal', 'zimstal']) {
      expect(saveQuoteSchema.safeParse({ ...payload, offer: { company } }).success).toBe(true);
    }
    expect(saveQuoteSchema.safeParse({ ...payload, offer: { company: 'inna' } }).success).toBe(false);
    await expect(new QuoteModel({ offerCompany: 'inna' }).validate()).rejects.toMatchObject({ errors: { offerCompany: expect.anything() } });
  });
});
