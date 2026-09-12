'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { formatPln } from '@/lib/format';
import { Button, Field, TextInput } from '@/components/ui';

export function SendOfferButton({
  quoteId,
  quoteNumber,
  email,
  total,
  offeredTotal,
  note,
  emailSentAt,
}: {
  quoteId: string;
  quoteNumber: number;
  email?: string | null;
  total: number;
  offeredTotal?: number | null;
  note?: string | null;
  emailSentAt?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(email ?? '');
  const [price, setPrice] = useState<number>(offeredTotal ?? total);
  const [text, setText] = useState(note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, offeredTotal: price, note: text || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd wysyłki');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd wysyłki');
    } finally {
      setBusy(false);
    }
  }

  const sent = Boolean(emailSentAt);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${sent ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
        title={sent ? `Oferta wysłana ${new Date(emailSentAt!).toLocaleString('pl-PL')}` : undefined}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-10 6L2 7" />
        </svg>
        {sent ? 'Oferta wysłana – wyślij ponownie' : 'Wyślij ofertę e-mailem'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {done ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
                <h3 className="text-lg font-semibold text-slate-900">Oferta wysłana na {to}</h3>
                <p className="mt-1 text-sm text-slate-600">Cena w ofercie: {formatPln(price)}</p>
                <Button className="mt-5" onClick={() => setOpen(false)}>
                  Zamknij
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Wyślij ofertę e-mailem – wycena #{quoteNumber}</h3>
                  <p className="text-sm text-slate-500">Klient otrzyma podsumowanie konfiguracji (bez rozbicia) i cenę podaną poniżej.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Adres e-mail klienta">
                    <TextInput type="email" value={to} onChange={(e) => setTo(e.target.value)} required />
                  </Field>
                  <Field label="Cena w ofercie [zł]" hint={`Wyliczona z cennika: ${formatPln(total)}`}>
                    <TextInput type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.valueAsNumber || 0)} required />
                  </Field>
                </div>
                <Field label="Dopisek w ofercie (opcjonalnie)">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="np. termin realizacji, warunki płatności, rabat"
                  />
                </Field>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Wysyłanie…' : 'Wyślij ofertę'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
