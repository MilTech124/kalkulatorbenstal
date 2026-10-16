import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';

const schema = z.object({ login: z.string().trim().min(1), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Podaj login i hasło' }, { status: 400 });

  await connectDb();
  const user = await UserModel.findOne({ login: parsed.data.login.toLowerCase() });
  // Ten sam komunikat dla zlego loginu i hasla.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Nieprawidłowy login lub hasło' }, { status: 401 });
  }
  await setSessionCookie(await createSessionToken({ userId: user._id.toString(), login: user.login, name: `${user.firstName} ${user.lastName}` }));
  return NextResponse.json({ ok: true });
}
