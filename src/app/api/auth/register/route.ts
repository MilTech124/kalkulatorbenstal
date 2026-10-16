import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRegistrationCode, createSessionToken, hashPassword, setSessionCookie } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';

const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  login: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/),
  password: z.string().min(8).max(200),
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Uzupełnij wszystkie pola (login: 3–32 znaków a–z, 0–9, . _ -; hasło: min. 8 znaków)' }, { status: 400 });
  }
  const { firstName, lastName, login, password, code } = parsed.data;
  if (!checkRegistrationCode(code)) return NextResponse.json({ error: 'Nieprawidłowy kod rejestracyjny' }, { status: 403 });

  await connectDb();
  let user;
  try {
    user = await UserModel.create({ firstName, lastName, login, passwordHash: await hashPassword(password) });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return NextResponse.json({ error: 'Ten login jest już zajęty' }, { status: 409 });
    throw err;
  }
  await setSessionCookie(await createSessionToken({ userId: user._id.toString(), login: user.login, name: `${user.firstName} ${user.lastName}` }));
  return NextResponse.json({ ok: true }, { status: 201 });
}
