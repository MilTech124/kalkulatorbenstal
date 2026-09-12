'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Field, TextInput } from '@/components/ui';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Błąd logowania');
      return;
    }
    const next = params.get('next');
    router.replace(next && next.startsWith('/panel') ? next : '/panel');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </Field>
      <Field label="Hasło">
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </Field>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Logowanie…' : 'Zaloguj'}
      </Button>
    </form>
  );
}
