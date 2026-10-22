'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { QuoteBreakdown } from '@/components/calculator/Summary';
import { Button, TextInput } from '@/components/ui';
import { formatPln } from '@/lib/format';
import type { LineItem, QuoteResult } from '@/lib/pricing/types';

export function QuoteItemsEditor({ quoteId, result }: { quoteId: string; result: QuoteResult }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<LineItem[]>(result.items);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((sum, it) => sum + it.amount, 0);

  function startEditing() {
    setItems(result.items);
    setLabel('');
    setAmount('');
    setError('');
    setEditing(true);
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!label.trim() || amount.trim() === '' || !Number.isFinite(value)) {
      setError('Podaj nazwę pozycji i kwotę brutto.');
      return;
    }
    setError('');
    setItems((prev) => [...prev, { key: `custom:${Date.now()}`, label: label.trim(), amount: Math.round(value) }]);
    setLabel('');
    setAmount('');
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Nie udało się zapisać pozycji.');
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać pozycji.');
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <>
        <QuoteBreakdown result={result} />
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={startEditing}>Edytuj pozycje</Button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-slate-100">
        {items.length === 0 && <li className="py-3 text-sm text-slate-500">Brak pozycji.</li>}
        {items.map((it) => (
          <li key={it.key} className="flex items-start justify-between gap-3 py-2">
            <p className="min-w-0 text-sm text-slate-800">{it.label}</p>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-medium tabular-nums text-slate-900">{formatPln(it.amount)}</span>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.key !== it.key))}
                aria-label={`Usuń pozycję ${it.label}`}
                className="rounded px-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Usuń
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={addItem} className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
        <div className="min-w-40 flex-1">
          <label htmlFor="item-label" className="block text-xs text-slate-600">Nowa pozycja</label>
          <TextInput id="item-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="np. Transport" />
        </div>
        <div className="w-32">
          <label htmlFor="item-amount" className="block text-xs text-slate-600">Kwota brutto [zł]</label>
          <TextInput id="item-amount" type="number" step={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">Dodaj</Button>
      </form>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
        <span>Razem po zmianach</span>
        <span className="tabular-nums">{formatPln(total)}</span>
      </div>
      <p className="text-xs text-slate-500">Zapis przelicza sumę wyceny i kasuje ręcznie ustawioną kwotę oferty.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Anuluj</Button>
        <Button type="button" onClick={save} disabled={busy}>{busy ? 'Zapisywanie…' : 'Zapisz pozycje'}</Button>
      </div>
    </div>
  );
}
