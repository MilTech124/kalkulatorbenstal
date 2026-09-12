import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { calculateQuote } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { saveQuoteSchema } from '@/lib/pricing/schemas';
import { nextSequence } from '@/models/Counter';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

// Publiczny zapis wyceny. Cena liczona po stronie serwera z aktywnego cennika.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = saveQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane', issues: parsed.error.issues }, { status: 400 });
  }
  const { input, customer } = parsed.data;
  const pl = await getActivePriceList();
  const result = calculateQuote(input, pl.data);
  if (result.items.length === 0) {
    return NextResponse.json({ error: result.warnings[0] ?? 'Nie można policzyć wyceny' }, { status: 400 });
  }
  await connectDb();
  const number = await nextSequence('quote');
  const doc = await QuoteModel.create({
    number,
    customer: { ...customer, email: customer.email || undefined },
    input,
    result,
    total: result.total,
    priceListVersion: pl.version,
  });
  return NextResponse.json({ id: doc._id.toString(), number, total: result.total }, { status: 201 });
}
