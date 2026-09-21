'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { CustomerInfo, QuoteInput } from '@/lib/pricing/types';
import { customerSchema } from '@/lib/pricing/schemas';
import { Button, Field, TextInput } from '@/components/ui';
import { formatPln } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  input: QuoteInput;
  total: number;
  /** Zalogowany admin: moze edytowac cene w ofercie e-mail. */
  isAdmin?: boolean;
}

const EMPTY: CustomerInfo = { firstName: '', lastName: '', phone: '', email: '', street: '', postalCode: '', city: '' };

export function SaveQuoteDialog({ open, onClose, input, total, isAdmin = false }: Props) {
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<{ number: number; total: number; pdfUrl: string; wordUrl: string } | null>(null);
  const [markupPct, setMarkupPct] = useState(0);
  const [offeredTotal, setOfferedTotal] = useState<number | null>(null);
  const [note, setNote] = useState('');
  // Cena w ofercie: recznie wpisana (offeredTotal) albo wyliczona + narzut %.
  const offerPrice = offeredTotal ?? Math.round(total * (1 + markupPct / 100));
  const applyMarkup = (pct: number) => {
    setMarkupPct(pct);
    setOfferedTotal(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: keyof CustomerInfo, v: string) => setCustomer((c) => ({ ...c, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = customerSchema.safeParse(customer);
    if (!parsed.success) {
      const errs: Partial<Record<keyof CustomerInfo, string>> = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof CustomerInfo] = issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus('saving');
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          customer: parsed.data,
          offer: offerPrice !== total || note ? { offeredTotal: offerPrice, note: note || undefined } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd zapisu');
      setSaved({ number: data.number, total: data.offeredTotal ?? data.total, pdfUrl: data.pdfUrl, wordUrl: data.wordUrl });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Nie udało się zapisać wyceny.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {status === 'done' && saved ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Wycena nr {saved.number} zapisana</h3>
            <p className="mt-1 text-sm text-slate-600">
              Kwota: <strong>{formatPln(saved.total)}</strong>. Skontaktujemy się z Tobą w celu potwierdzenia szczegółów.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a
                href={saved.pdfUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-600"
              >
                Pobierz ofertę PDF
              </a>
              <a
                href={saved.wordUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent-500 bg-white px-4 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-50"
              >
                Pobierz ofertę Word
              </a>
              <Button variant="secondary" onClick={onClose}>
                Zamknij
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Zapisz wycenę</h3>
              <p className="text-sm text-slate-500">
                Aktualna kwota: <strong className="text-slate-800">{formatPln(total)}</strong>. Podaj dane kontaktowe.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Imię">
                <TextInput value={customer.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" />
                {errors.firstName && <span className="text-xs text-red-600">{errors.firstName}</span>}
              </Field>
              <Field label="Nazwisko">
                <TextInput value={customer.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" />
                {errors.lastName && <span className="text-xs text-red-600">{errors.lastName}</span>}
              </Field>
              <Field label="Telefon">
                <TextInput value={customer.phone} onChange={(e) => set('phone', e.target.value)} type="tel" autoComplete="tel" />
                {errors.phone && <span className="text-xs text-red-600">{errors.phone}</span>}
              </Field>
              <Field label="E-mail (opcjonalnie)">
                <TextInput value={customer.email ?? ''} onChange={(e) => set('email', e.target.value)} type="email" autoComplete="email" />
                {errors.email && <span className="text-xs text-red-600">{errors.email}</span>}
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_1fr]">
              <Field label="Ulica i numer (adres montażu)">
                <TextInput value={customer.street} onChange={(e) => set('street', e.target.value)} autoComplete="street-address" />
                {errors.street && <span className="text-xs text-red-600">{errors.street}</span>}
              </Field>
              <Field label="Kod pocztowy">
                <TextInput value={customer.postalCode} onChange={(e) => set('postalCode', e.target.value)} autoComplete="postal-code" placeholder="00-000" />
                {errors.postalCode && <span className="text-xs text-red-600">{errors.postalCode}</span>}
              </Field>
              <Field label="Miejscowość">
                <TextInput value={customer.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" />
                {errors.city && <span className="text-xs text-red-600">{errors.city}</span>}
              </Field>
            </div>
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Cena w ofercie</p>
                <div className="flex flex-wrap gap-1">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyMarkup(pct)}
                      className={`rounded-md border px-2 py-1 text-xs font-medium ${offeredTotal === null && markupPct === pct ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {pct === 0 ? 'bez narzutu' : `+${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[110px_1fr_1fr]">
                <Field label="Narzut [%]">
                  <TextInput type="number" min={isAdmin ? -100 : 0} max={500} step={1} value={markupPct} onChange={(e) => applyMarkup(e.target.valueAsNumber || 0)} />
                </Field>
                <Field label="Cena w ofercie [zł]" hint={`Wyliczona z cennika: ${formatPln(total)}`}>
                  <TextInput type="number" min={isAdmin ? 0 : total} step={1} value={offerPrice} onChange={(e) => setOfferedTotal(e.target.valueAsNumber || 0)} />
                </Field>
                <Field label="Dopisek w ofercie (opcjonalnie)">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="np. termin realizacji, warunki płatności"
                  />
                </Field>
              </div>
              {!isAdmin && offerPrice < total && <p className="text-xs text-red-600">Cena w ofercie nie może być niższa niż wyliczona ({formatPln(total)}).</p>}
            </div>
            {status === 'error' && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? 'Zapisywanie…' : 'Zapisz wycenę'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
