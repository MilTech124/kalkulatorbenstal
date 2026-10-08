import type { QuoteInput } from '@/lib/pricing/types';

export const OFFER_COMPANIES = ['benstal', 'zimstal'] as const;
export type OfferCompany = (typeof OFFER_COMPANIES)[number];

interface CompanyProfile {
  name: string;
  short: string;
  filename: string;
  tagline: string;
  address: string;
  nip?: string;
  phones: string[];
  email: string;
  www: string;
  domain: string;
  logo: string;
}

export const COMPANY_PROFILES: Record<OfferCompany, CompanyProfile> = {
  benstal: {
    name: 'F.P.H.U. „BEN-STAL” Galica Beniamin',
    short: 'BEN-STAL',
    filename: 'BENSTAL',
    tagline: 'Producent garaży blaszanych, hal, wiat i carportów',
    address: 'Przenosza 102, 34-625 Skrzydlna',
    phones: ['602 348 266', '533 615 010'],
    email: 'biuro@benstal.pl',
    www: 'https://benstal.pl',
    domain: 'benstal.pl',
    logo: 'benstal-logo.png',
  },
  zimstal: {
    name: 'ZIMSTAL RENATA GALICA',
    short: 'ZIMSTAL',
    filename: 'ZIMSTAL',
    tagline: 'Producent garaży blaszanych oraz konstrukcji stalowych',
    address: 'Skrzydlna 335, 34-625 Skrzydlna',
    nip: '7371859447',
    phones: ['530 163 444'],
    email: 'biuro.zimstal@gmail.com',
    www: 'https://zimstalgaraze.pl',
    domain: 'zimstalgaraze.pl',
    logo: 'zimstal-logo.png',
  },
};

/** Brak firmy w starszej wycenie oznacza Benstal. */
export function resolveOfferCompany(company?: OfferCompany | null): OfferCompany {
  return company ?? 'benstal';
}

export function offerCompanyProfile(company?: OfferCompany | null, productType?: QuoteInput['productType']): CompanyProfile {
  const profile = COMPANY_PROFILES[resolveOfferCompany(company)];
  if (company === 'zimstal' && productType === 'sandwich') {
    return { ...profile, phones: ['508 330 803'], email: 'biuro.benstalzimstalgroup@gmail.com' };
  }
  return profile;
}

/** Wspólne warunki oferty; jedynie firma, kontakt i adres witryny są zmienne. */
export function offerCompanyTerms(company: CompanyProfile): string[] {
  return [
    'Poniższa specyfikacja jest naszą propozycją. Umiejscowienie poszczególnych elementów ustalimy podczas składania zamówienia.',
    'Termin realizacji zamówienia wynosi od 2 do około 10 tygodni.',
    `Firma „${company.short}” nie sporządza dokumentacji technicznej do wykonanej konstrukcji stalowej.`,
    `Wizualizację garażu można wykonać samodzielnie na stronie www.${company.domain}.`,
    'Dostawa i montaż odbywają się w dni robocze w sposób „wiązany”. Montażyści dostarczają garaże punkt po punkcie, dlatego nie ma możliwości wybrania dnia i godziny dostawy.',
    `Montujemy na terenie przygotowanym przez Zamawiającego. Wskazówki dotyczące przygotowania podłoża znajdą Państwo na stronie www.${company.domain}.`,
    'W przypadku zamówienia usługi kotwiczenia podłoże musi być stałe: wylewka, punktowe stopy betonowe lub fundament. Nie kotwiczymy konstrukcji do kostki brukowej ani płyt chodnikowych.',
    `W razie pytań zapraszamy do kontaktu: +48 ${company.phones[0]}.`,
  ];
}
