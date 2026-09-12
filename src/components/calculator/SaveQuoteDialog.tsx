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
}

const EMPTY: CustomerInfo = { firstName: '', lastName: '', phone: '', email: '', street: '', postalCode: '', city: '' };

export function SaveQuoteDialog({ open, onClose, input, total }: Props) {
  const [customer, setCustomer] = useState<CustomerInfo>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInfo, string>>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<{ number: number; total: number } | null>(null);

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
        body: JSON.stringify({ input, customer: parsed.data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd zapisu');
      setSaved({ number: data.number, total: data.total });
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
            <Button className="mt-5" onClick={onClose}>
              Zamknij
            </Button>
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
