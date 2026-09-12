import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { mailConfigured } from '@/lib/mail';
import { appOriginFrom, sendOfferForQuote } from '@/lib/offerService';
import { calculateQuote } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { saveQuoteSchema } from '@/lib/pricing/schemas';
import { nextSequence } from '@/models/Counter';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

// Publiczny zapis wyceny. Cena liczona po stronie serwera z aktywnego cennika.
// Opcjonalnie wysyla oferte e-mailem; edycja ceny w ofercie tylko dla zalogowanego admina.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = saveQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Nieprawidłowe dane', issues: parsed.error.issues }, { status: 400 });
  }
  const { input, customer, sendEmail, offer } = parsed.data;
  if (sendEmail && !customer.email) {
    return NextResponse.json({ error: 'Podaj adres e-mail, aby wysłać wycenę.' }, { status: 400 });
  }
  const pl = await getActivePriceList();
  const result = calculateQuote(input, pl.data);
  if (result.items.length === 0) {
    return NextResponse.json({ error: result.warnings[0] ?? 'Nie można policzyć wyceny' }, { status: 400 });
  }
  const isAdmin = Boolean(await getSession());
  const offeredTotal = isAdmin ? offer?.offeredTotal : undefined;
  const note = isAdmin ? offer?.note : undefined;

  await connectDb();
  const number = await nextSequence('quote');
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
    priceListVersion: pl.version,
  });

  let emailSent = false;
  let emailError: string | undefined;
  if (sendEmail && customer.email) {
    if (!mailConfigured()) {
      emailError = 'Wysyłka e-mail nie jest jeszcze skonfigurowana.';
    } else {
      try {
        await sendOfferForQuote(doc, { to: customer.email, offeredTotal, note, appOrigin: appOriginFrom(request) });
        emailSent = true;
      } catch (err) {
        console.error('Błąd wysyłki oferty:', err);
        emailError = 'Nie udało się wysłać e-maila – wycena została zapisana.';
      }
    }
  }
  return NextResponse.json(
    { id: doc._id.toString(), number, total: result.total, offeredTotal: offeredTotal ?? null, emailSent, emailError },
    { status: 201 },
  );
}
