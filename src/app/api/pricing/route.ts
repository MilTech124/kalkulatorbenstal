import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getActivePriceList } from '@/lib/pricing/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  const pl = await getActivePriceList();
  return NextResponse.json(pl);
}
