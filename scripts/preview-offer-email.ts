// Podglad szablonu oferty e-mail: npx tsx scripts/preview-offer-email.ts > oferta.html
import { DEFAULT_PRICE_LIST } from '../src/lib/pricing/defaults';
import { calculateQuote, defaultGate, emptyInput } from '../src/lib/pricing/engine';
import { renderOfferEmail } from '../src/lib/offerEmail';

const input = { ...emptyInput(DEFAULT_PRICE_LIST), width: 6, length: 6, sheet: 'ral' as const, roofType: 'gable' as const, gutters: true, felt: true };
input.gates = [{ ...defaultGate(), type: 'sectional', width: 3, height: 2.24 }, { ...defaultGate(), type: 'tilt', width: 2.5, height: 2, automat: true }];
input.windows = [{ type: 'w80x60', qty: 2 }];
input.doors = 1;
input.extras.anchoring = true;
const result = calculateQuote(input, DEFAULT_PRICE_LIST);
const mail = renderOfferEmail({
  number: 17,
  customer: { firstName: 'Jan', lastName: 'Kowalski', street: 'ul. Długa 12', postalCode: '32-415', city: 'Raciechowice' },
  input,
  priceList: DEFAULT_PRICE_LIST,
  effectiveHeight: result.effectiveHeight,
  total: 21500,
  appOrigin: process.env.APP_URL ?? 'http://localhost:3000',
  note: 'Termin realizacji: 3–4 tygodnie od wpłaty zaliczki 30%.',
});
process.stdout.write(mail.html);
