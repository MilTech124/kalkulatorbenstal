import { NextResponse } from 'next/server';
import { getActivePriceList } from '@/lib/pricing/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pl = await getActivePriceList();
  return NextResponse.json(pl);
}
