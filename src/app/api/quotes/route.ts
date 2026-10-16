import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { currencyKey, findCurrency } from '@/lib/currency';
import { connectDb } from '@/lib/db';
import { calculateQuote } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { saveQuoteSchema } from '@/lib/pricing/schemas';
import { resolveOfferCompany } from '@/lib/offerCompany';
import { nextSequence } from '@/models/Counter';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

// Zapis wyceny przez zalogowanego pracownika. Cena liczona po stronie serwera z aktywnego cennika.
// offer.offeredTotal: cena w ofercie PDF (np. z narzutem %), moze byc inna niz wyliczona.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = saveQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane', issues: parsed.error.issues }, { status: 400 });
  }
  const { input, customer, offer } = parsed.data;
  const pl = await getActivePriceList();
  const result = calculateQuote(input, pl.data);
  if (result.items.length === 0) {
    return NextResponse.json({ error: result.warnings[0] ?? 'Nie można policzyć wyceny' }, { status: 400 });
  }
  let offeredTotal = offer?.offeredTotal;
  if (offeredTotal === result.total) offeredTotal = undefined;
  const note = offer?.note;

  await connectDb();
  const number = await nextSequence('quote');
  const accessToken = randomBytes(16).toString('hex');
  const doc = await QuoteModel.create({
    number,
    customer: {
      ...customer,
      email: customer.email || undefined,
      address: `${customer.street}, ${customer.postalCode} ${customer.city}`,
    },
    status: 'nowe',
    input,
    result,
    total: result.total,
    offeredTotal,
    offerNote: note,
    offerCompany: resolveOfferCompany(offer?.company),
    currency: (() => {
      const c = findCurrency(pl.data.currencies, input.currency);
      return { key: currencyKey(c), code: c.code, label: c.label, rate: c.rate };
    })(),
    priceListVersion: pl.version,
    accessToken,
    createdBy: { userId: session.userId, name: session.name, login: session.login },
  });

  const id = doc._id.toString();
  return NextResponse.json(
    { id, number, total: result.total, offeredTotal: offeredTotal ?? null, offerCompany: doc.offerCompany, pdfUrl: `/api/quotes/${id}/pdf?t=${accessToken}`, wordUrl: `/api/quotes/${id}/word?t=${accessToken}` },
    { status: 201 },
  );
}
