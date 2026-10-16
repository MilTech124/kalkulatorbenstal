'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field, TextInput } from '@/components/ui';

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', login: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Błąd rejestracji');
      return;
    }
    router.replace('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Imię">
        <TextInput value={form.firstName} onChange={set('firstName')} autoComplete="given-name" required />
      </Field>
      <Field label="Nazwisko">
        <TextInput value={form.lastName} onChange={set('lastName')} autoComplete="family-name" required />
      </Field>
      <Field label="Login" hint="3–32 znaków: litery bez polskich znaków, cyfry, . _ -">
        <TextInput value={form.login} onChange={set('login')} autoComplete="username" required />
      </Field>
      <Field label="Hasło" hint="Min. 8 znaków">
        <TextInput type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
      </Field>
      <Field label="Kod rejestracyjny">
        <TextInput type="password" value={form.code} onChange={set('code')} autoComplete="off" required />
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Tworzenie konta…' : 'Utwórz konto'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Masz już konto?{' '}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
