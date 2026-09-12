'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { TRACKER_STATUS_LABEL, TRACKER_STATUSES, type TrackerStatus } from '@/lib/quoteStatus';
import { Button, Field, Select, TextInput } from '@/components/ui';

interface Preview {
  configured: boolean;
  title: string;
  details: string;
  status: TrackerStatus;
  tracker: { orderId?: string; sentAt?: string; addressGeocoded?: boolean } | null;
}

export function SendToTrackerDialog({ quoteId, quoteNumber, onClose, onSent }: { quoteId: string; quoteNumber: number; onClose: () => void; onSent: () => void }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState<TrackerStatus>('nowe');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ addressGeocoded: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/quotes/${quoteId}/tracker`)
      .then((r) => r.json())
      .then((p: Preview) => {
        if (cancelled) return;
        setPreview(p);
        setStatus(p.status);
        setDetails(p.details);
      })
      .catch(() => !cancelled && setError('Nie udało się pobrać danych wyceny.'));
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deliveryDate, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd wysyłki');
      setDone({ addressGeocoded: Boolean(data.addressGeocoded) });
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd wysyłki');
    } finally {
      setBusy(false);
    }
  }

  const alreadySent = preview?.tracker?.orderId;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div>
            <h3 className="text-lg font-semibold text-slate-900">Wysłano do Order-trackera</h3>
            <p className="mt-1 text-sm text-slate-600">
              {done.addressGeocoded ? 'Adres został zlokalizowany na mapie.' : 'Uwaga: adres nie został zlokalizowany na mapie – ustaw pin ręcznie w trackerze.'}
            </p>
            <Button className="mt-5" onClick={onClose}>
              Zamknij
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Wyślij wycenę #{quoteNumber} do Order-trackera</h3>
              {preview && <p className="text-sm text-slate-500">{preview.title}</p>}
            </div>
            {preview && !preview.configured && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Brak klucza API – ustaw ORDER_TRACKER_API_KEY w konfiguracji serwera.</p>
            )}
            {alreadySent && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Ta wycena była już wysłana ({preview?.tracker?.sentAt ? new Date(preview.tracker.sentAt).toLocaleString('pl-PL') : ''}). Ponowna wysyłka utworzy drugie zamówienie.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status w trackerze">
                <Select value={status} onChange={(e) => setStatus(e.target.value as TrackerStatus)}>
                  {TRACKER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TRACKER_STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Data dostawy (opcjonalnie)">
                <TextInput type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Uwagi (trafią do pola „szczegóły”)">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </Field>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={busy || !preview || !preview.configured}>
                {busy ? 'Wysyłanie…' : alreadySent ? 'Wyślij ponownie' : 'Wyślij do Tracker'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
