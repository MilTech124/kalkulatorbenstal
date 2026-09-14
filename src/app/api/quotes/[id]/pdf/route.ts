import { NextResponse, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { offerPdfFilename, renderOfferPdf } from '@/lib/offerPdf';
import { normalizeInput } from '@/lib/pricing/engine';
import { getActivePriceList } from '@/lib/pricing/repository';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

// GET /api/quotes/[id]/pdf?t=<token>  - oferta PDF. Dostep: token z zapisu wyceny albo sesja admina.
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
  const pdf = await renderOfferPdf({
    number: quote.number,
    createdAt: quote.createdAt,
    customer: quote.customer,
    input: normalizeInput(quote.input),
    priceList: pl.data,
    effectiveHeight: quote.result?.effectiveHeight ?? quote.input.height,
    total: quote.offeredTotal ?? quote.total,
    note: quote.offerNote ?? undefined,
  });
  const inline = request.nextUrl.searchParams.get('download') !== '1';
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${offerPdfFilename(quote.number)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
