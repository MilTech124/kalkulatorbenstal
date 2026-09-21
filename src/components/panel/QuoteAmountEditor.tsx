'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { formatPln } from '@/lib/format';
import { Button, TextInput } from '@/components/ui';

export function QuoteAmountEditor({ quoteId, calculatedTotal, offeredTotal }: { quoteId: string; calculatedTotal: number; offeredTotal?: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(offeredTotal ?? calculatedTotal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEditing() {
    setPrice(String(offeredTotal ?? calculatedTotal));
    setError('');
    setEditing(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const amount = Number(price);
    if (price.trim() === '' || !Number.isInteger(amount) || amount < 0 || amount > 10_000_000) {
      setError('Podaj pełną kwotę od 0 do 10 000 000 zł.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offeredTotal: amount === calculatedTotal ? null : amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Nie udało się zapisać kwoty.');
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać kwoty.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wide text-slate-500">Kwota wyceny brutto</p>
      <p className="text-2xl font-bold tabular-nums text-brand-700">{formatPln(offeredTotal ?? calculatedTotal)}</p>
      {offeredTotal != null && offeredTotal !== calculatedTotal && (
        <p className="text-xs text-slate-500">Z cennika: {formatPln(calculatedTotal)}</p>
      )}
      {!editing ? (
        <button type="button" onClick={startEditing} className="mt-1 text-sm font-medium text-brand-600 hover:underline">
          Edytuj kwotę
        </button>
      ) : (
        <form onSubmit={save} className="mt-2 space-y-2">
          <label htmlFor="quote-amount" className="block text-xs text-slate-600">Nowa kwota brutto [zł]</label>
          <TextInput id="quote-amount" type="number" min={0} max={10000000} step={1} value={price} onChange={(event) => setPrice(event.target.value)} required autoFocus />
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Anuluj</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz'}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
