import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { QUOTE_STATUSES } from '@/lib/quoteStatus';
import { QuoteModel } from '@/models/Quote';
import { OFFER_COMPANIES, resolveOfferCompany } from '@/lib/offerCompany';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  await connectDb();
  const quote = await QuoteModel.findById(id).lean();
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  return NextResponse.json(quote);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  await connectDb();
  await QuoteModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({
  offerCompany: z.enum(OFFER_COMPANIES).optional(),
  status: z.enum(QUOTE_STATUSES).optional(),
  offeredTotal: z.number().finite().min(0).max(10_000_000).nullable().optional(),
  offerNote: z.string().trim().max(2000).nullable().optional(),
  items: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(100),
        label: z.string().trim().min(1).max(300),
        qty: z.number().finite().optional(),
        unit: z.string().max(20).optional(),
        unitPrice: z.number().finite().optional(),
        amount: z.number().finite().min(-10_000_000).max(10_000_000),
        note: z.string().max(500).optional(),
      }),
    )
    .max(200)
    .optional(),
});

// PATCH: zmiana statusu wyceny i/lub ceny/dopisku w ofercie PDF.
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowe dane' }, { status: 400 });
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  const { status, offeredTotal, offerNote, offerCompany, items } = parsed.data;
  if (items !== undefined) {
    const total = Math.round(items.reduce((sum, it) => sum + it.amount, 0));
    set['result.items'] = items;
    set['result.total'] = total;
    set.total = total;
    // Ręcznie ustawiona kwota dotyczyła starego zestawu pozycji - wracamy do kwoty z pozycji.
    if (offeredTotal === undefined) unset.offeredTotal = 1;
  }
  if (offerCompany !== undefined) set.offerCompany = offerCompany;
  if (status !== undefined) set.status = status;
  if (offeredTotal !== undefined) {
    if (offeredTotal === null) unset.offeredTotal = 1;
    else set.offeredTotal = offeredTotal;
  }
  if (offerNote !== undefined) {
    if (!offerNote) unset.offerNote = 1;
    else set.offerNote = offerNote;
  }
  await connectDb();
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  const quote = await QuoteModel.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  return NextResponse.json({ ok: true, status: quote.status, offeredTotal: quote.offeredTotal ?? null, offerNote: quote.offerNote ?? null, offerCompany: resolveOfferCompany(quote.offerCompany) });
}
