import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { QUOTE_STATUSES } from '@/lib/quoteStatus';
import { QuoteModel } from '@/models/Quote';

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

const patchSchema = z.object({ status: z.enum(QUOTE_STATUSES) });

// PATCH: zmiana statusu wyceny.
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowy status' }, { status: 400 });
  await connectDb();
  const quote = await QuoteModel.findByIdAndUpdate(id, { $set: { status: parsed.data.status } }, { new: true }).lean();
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  return NextResponse.json({ ok: true, status: quote.status });
}
