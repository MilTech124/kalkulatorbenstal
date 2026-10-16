import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

import { checkRegistrationCode, createSessionToken, hashPassword, verifyPassword, verifySessionToken } from './auth';
import { safeNext } from '@/components/auth/safeNext';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'a'.repeat(40));
});
afterEach(() => vi.unstubAllEnvs());

describe('hasła', () => {
  it('weryfikuje poprawne hasło i odrzuca błędne', async () => {
    const hash = await hashPassword('tajne-haslo-1');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('tajne-haslo-1', hash)).toBe(true);
    expect(await verifyPassword('inne-haslo', hash)).toBe(false);
  });

  it('używa losowej soli i odrzuca uszkodzony hash', async () => {
    expect(await hashPassword('x1234567')).not.toBe(await hashPassword('x1234567'));
    expect(await verifyPassword('x', 'smieci')).toBe(false);
  });
});

describe('sesja', () => {
  it('zachowuje id, login i imię użytkownika', async () => {
    const token = await createSessionToken({ userId: 'u1', login: 'jan', name: 'Jan Kowalski' });
    expect(await verifySessionToken(token)).toEqual({ userId: 'u1', login: 'jan', name: 'Jan Kowalski' });
  });

  it('odrzuca brak, śmieci i token podpisany innym sekretem', async () => {
    const token = await createSessionToken({ userId: 'u1', login: 'jan', name: 'Jan Kowalski' });
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('abc.def.ghi')).toBeNull();
    vi.stubEnv('AUTH_SECRET', 'b'.repeat(40));
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe('kod rejestracyjny', () => {
  it('przyjmuje tylko dokładny kod', () => {
    vi.stubEnv('REGISTRATION_CODE', 'sekret-kod');
    expect(checkRegistrationCode('sekret-kod')).toBe(true);
    expect(checkRegistrationCode('sekret-kod ')).toBe(false);
    expect(checkRegistrationCode('')).toBe(false);
  });

  it('brak kodu w env wyłącza rejestrację', () => {
    vi.stubEnv('REGISTRATION_CODE', '');
    expect(checkRegistrationCode('')).toBe(false);
    expect(checkRegistrationCode('cokolwiek')).toBe(false);
  });
});

describe('safeNext', () => {
  it('przepuszcza tylko ścieżki wewnętrzne', () => {
    expect(safeNext('/panel/cennik')).toBe('/panel/cennik');
    expect(safeNext(null)).toBe('/');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
  });
});
