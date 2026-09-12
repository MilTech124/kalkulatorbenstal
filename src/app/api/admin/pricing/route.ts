import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_PRICE_LIST } from '@/lib/pricing/defaults';
import { activatePriceListVersion, getActivePriceList, listPriceListVersions, saveNewPriceListVersion } from '@/lib/pricing/repository';
import { priceListSchema } from '@/lib/pricing/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [active, versions] = await Promise.all([getActivePriceList(), listPriceListVersions()]);
  return NextResponse.json({ ...active, versions });
}

// Zapis nowej wersji cennika.
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = priceListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Cennik zawiera błędy', issues: parsed.error.issues }, { status: 400 });
  }
  const saved = await saveNewPriceListVersion(parsed.data);
  return NextResponse.json({ version: saved.version });
}

const actionSchema = z.union([
  z.object({ action: z.literal('activate'), version: z.number().int().positive() }),
  z.object({ action: z.literal('restoreDefaults') }),
]);

// Przywrocenie wczesniejszej wersji lub domyslnego cennika.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Nieprawidłowa akcja' }, { status: 400 });
  if (parsed.data.action === 'restoreDefaults') {
    const saved = await saveNewPriceListVersion(DEFAULT_PRICE_LIST);
    return NextResponse.json({ version: saved.version });
  }
  const ok = await activatePriceListVersion(parsed.data.version);
  if (!ok) return NextResponse.json({ error: 'Nie ma takiej wersji' }, { status: 404 });
  return NextResponse.json({ version: parsed.data.version });
}
