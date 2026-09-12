import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { mailConfigured } from '@/lib/mail';
import { appOriginFrom, sendOfferForQuote } from '@/lib/offerService';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  to: z.string().trim().email('Nieprawidłowy e-mail'),
  offeredTotal: z.number().finite().min(0).max(10_000_000),
  note: z.string().trim().max(2000).optional(),
});

// POST: (ponowna) wysylka oferty e-mail z panelu, z edycja ceny.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane' }, { status: 400 });
  if (!mailConfigured()) return NextResponse.json({ error: 'Wysyłka e-mail nie jest skonfigurowana (SMTP_*).' }, { status: 503 });
  await connectDb();
  const quote = await QuoteModel.findById(id);
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  try {
    if (!quote.customer.email) quote.customer.email = parsed.data.to;
    await sendOfferForQuote(quote, {
      to: parsed.data.to,
      offeredTotal: parsed.data.offeredTotal,
      note: parsed.data.note,
      appOrigin: appOriginFrom(request),
    });
    return NextResponse.json({ ok: true, emailSentAt: quote.emailSentAt, offeredTotal: quote.offeredTotal });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Błąd wysyłki' }, { status: 502 });
  }
}
