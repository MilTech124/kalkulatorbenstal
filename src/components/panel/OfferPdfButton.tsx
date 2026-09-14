'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { formatPln } from '@/lib/format';
import { Button, Field, TextInput } from '@/components/ui';

/** Przycisk "Oferta PDF": okno z edycja ceny i dopisku, zapis (PATCH) i otwarcie PDF. */
export function OfferPdfButton({ quoteId, total, offeredTotal, note }: { quoteId: string; total: number; offeredTotal?: number | null; note?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState<number>(offeredTotal ?? total);
  const [text, setText] = useState(note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      const res = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offeredTotal: price, offerNote: text || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd zapisu');
      window.open(`/api/quotes/${quoteId}/pdf`, '_blank');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
        </svg>
        Oferta PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Oferta PDF</h3>
                <p className="text-sm text-slate-500">Podsumowanie konfiguracji (bez rozbicia) i cena podana poniżej. Zmiany zostaną zapisane przy wycenie.</p>
              </div>
              <Field label="Cena w ofercie [zł]" hint={`Wyliczona z cennika: ${formatPln(total)}`}>
                <TextInput type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.valueAsNumber || 0)} required />
              </Field>
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
                  {busy ? 'Generowanie…' : 'Zapisz i otwórz PDF'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
