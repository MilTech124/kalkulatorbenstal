import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { toTrackerStatus, TRACKER_STATUSES } from '@/lib/quoteStatus';
import { sendQuoteToTracker, trackerConfigured, trackerDetails, trackerTitle } from '@/lib/tracker';
import { QuoteModel, type QuoteDoc } from '@/models/Quote';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  deliveryDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  details: z.string().max(4000).optional(),
  status: z.enum(TRACKER_STATUSES),
});

// GET: dane, ktore trafia do trackera (do wypelnienia okna przed wysylka).
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  await connectDb();
  const quote = await QuoteModel.findById(id).lean();
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  return NextResponse.json({
    configured: trackerConfigured(),
    title: trackerTitle(quote),
    details: trackerDetails(quote),
    status: toTrackerStatus(quote.status ?? 'nowe'),
    tracker: quote.tracker ?? null,
  });
}

// POST: wysylka wyceny do Order-trackera.
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 });
  if (!trackerConfigured()) {
    return NextResponse.json({ error: 'Integracja nie jest skonfigurowana (brak ORDER_TRACKER_API_KEY).' }, { status: 503 });
  }
  await connectDb();
  const quote = await QuoteModel.findById(id);
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });

  try {
    const result = await sendQuoteToTracker(quote.toObject() as QuoteDoc, {
      deliveryDate: parsed.data.deliveryDate || undefined,
      details: parsed.data.details,
      status: parsed.data.status,
    });
    quote.tracker = { orderId: String(result.id), sentAt: new Date(), status: result.status, addressGeocoded: result.addressGeocoded };
    // Wyslanie do realizacji = zamowienie; wczesniejsze statusy podnosimy do "zamowiono".
    if (!quote.status || quote.status === 'nowe' || quote.status === 'wyceniono') quote.status = 'zamowiono';
    await quote.save();
    return NextResponse.json({ ok: true, tracker: quote.tracker, status: quote.status, addressGeocoded: result.addressGeocoded });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Błąd wysyłki' }, { status: 502 });
  }
}
