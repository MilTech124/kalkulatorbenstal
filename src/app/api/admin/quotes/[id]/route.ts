import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDb } from '@/lib/db';
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
