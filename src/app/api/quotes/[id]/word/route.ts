import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { offerWordFilename, renderOfferWord } from '@/lib/offerWord';
import { normalizeInput } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  await connectDb();
  const quote = await QuoteModel.findById(id).lean();
  if (!quote) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });

  const token = request.nextUrl.searchParams.get('t');
  const isAdmin = Boolean(await getSession());
  if (!isAdmin && (!token || !quote.accessToken || token !== quote.accessToken)) {
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
  }

  const pl = await getActivePriceList();
  const word = renderOfferWord({
    number: quote.number,
    createdAt: quote.createdAt,
    customer: quote.customer,
    input: normalizeInput(quote.input),
    priceList: pl.data,
    effectiveHeight: quote.result?.effectiveHeight ?? quote.input.height,
    total: quote.offeredTotal ?? quote.total,
    currency: quote.currency?.code && quote.currency.rate ? { code: quote.currency.code, rate: quote.currency.rate, label: quote.currency.label ?? undefined } : undefined,
    note: quote.offerNote ?? undefined,
  });
  return new NextResponse(new Uint8Array(word), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${offerWordFilename(quote.number)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
