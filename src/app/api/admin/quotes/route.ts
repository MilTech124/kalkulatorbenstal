import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDb();
  const quotes = await QuoteModel.find({}, { number: 1, customer: 1, total: 1, createdAt: 1, 'input.width': 1, 'input.length': 1 })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return NextResponse.json(quotes);
}
