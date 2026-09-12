'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QUOTE_STATUS_CLASS, QUOTE_STATUS_LABEL, QUOTE_STATUSES, type QuoteStatus } from '@/lib/quoteStatus';
import { SendToTrackerDialog } from './SendToTrackerDialog';

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${QUOTE_STATUS_CLASS[status] ?? ''}`}>{QUOTE_STATUS_LABEL[status] ?? status}</span>;
}

/** Select statusu zapisujacy zmiane od razu (PATCH). */
export function StatusSelect({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<QuoteStatus>(status);
  const [busy, setBusy] = useState(false);

  async function change(next: QuoteStatus) {
    setValue(next);
    setBusy(true);
    const res = await fetch(`/api/admin/quotes/${quoteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    if (!res.ok) {
      setValue(status);
      alert('Nie udało się zmienić statusu.');
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => change(e.target.value as QuoteStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-full border-0 py-0.5 pl-2 pr-6 text-xs font-medium outline-none ring-1 ring-black/5 ${QUOTE_STATUS_CLASS[value]}`}
    >
      {QUOTE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {QUOTE_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function TrackerIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

/** Przycisk/ikona "Wyslij do Tracker" z oknem przed wysylka. */
export function SendToTrackerButton({
  quoteId,
  quoteNumber,
  sentAt,
  variant = 'icon',
}: {
  quoteId: string;
  quoteNumber: number;
  sentAt?: string | null;
  variant?: 'icon' | 'button';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sent = Boolean(sentAt);
  const title = sent ? `Wysłano do trackera ${new Date(sentAt!).toLocaleString('pl-PL')} – wyślij ponownie` : 'Wyślij do Tracker';

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          title={title}
          aria-label={title}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${sent ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-600'}`}
        >
          <TrackerIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${sent ? 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}
        >
          <TrackerIcon />
          {sent ? 'Wysłano do Tracker – wyślij ponownie' : 'Wyślij do Tracker'}
        </button>
      )}
      {open && <SendToTrackerDialog quoteId={quoteId} quoteNumber={quoteNumber} onClose={() => setOpen(false)} onSent={() => router.refresh()} />}
    </>
  );
}
