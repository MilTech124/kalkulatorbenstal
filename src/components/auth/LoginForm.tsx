'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field, TextInput } from '@/components/ui';
import { safeNext } from './safeNext';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Błąd logowania');
      return;
    }
    router.replace(safeNext(params.get('next')));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Login">
        <TextInput value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required />
      </Field>
      <Field label="Hasło">
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Logowanie…' : 'Zaloguj'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Nie masz konta?{' '}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Zarejestruj się
        </Link>
      </p>
    </form>
  );
}
