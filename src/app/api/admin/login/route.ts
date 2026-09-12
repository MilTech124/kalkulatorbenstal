import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkCredentials, createSessionToken, setSessionCookie } from '@/lib/auth';

const schema = z.object({ email: z.string().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Podaj e-mail i hasło' }, { status: 400 });
  if (!checkCredentials(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ error: 'Nieprawidłowy e-mail lub hasło' }, { status: 401 });
  }
  await setSessionCookie(await createSessionToken(parsed.data.email));
  return NextResponse.json({ ok: true });
}
