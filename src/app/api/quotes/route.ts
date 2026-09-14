import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { currencyKey, findCurrency } from '@/lib/currency';
import { connectDb } from '@/lib/db';
import { calculateQuote } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { saveQuoteSchema } from '@/lib/pricing/schemas';
import { nextSequence } from '@/models/Counter';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

// Publiczny zapis wyceny. Cena liczona po stronie serwera z aktywnego cennika.
// offer.offeredTotal: cena w ofercie PDF (np. z narzutem %); dla niezalogowanych nie moze byc nizsza niz wyliczona.
export async function POST(request: Request) {
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
  const isAdmin = Boolean(await getSession());
  // Narzut z frontu jest dozwolony dla kazdego, ale tylko admin moze obnizyc cene ponizej wyliczonej.
  let offeredTotal = offer?.offeredTotal;
  if (offeredTotal !== undefined && !isAdmin && offeredTotal < result.total) offeredTotal = result.total;
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
    currency: (() => {
      const c = findCurrency(pl.data.currencies, input.currency);
      return { key: currencyKey(c), code: c.code, label: c.label, rate: c.rate };
    })(),
    priceListVersion: pl.version,
    accessToken,
  });

  const id = doc._id.toString();
  return NextResponse.json(
    { id, number, total: result.total, offeredTotal: offeredTotal ?? null, pdfUrl: `/api/quotes/${id}/pdf?t=${accessToken}` },
    { status: 201 },
  );
}
