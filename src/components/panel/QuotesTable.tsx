'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPln } from '@/lib/format';
import { QUOTE_STATUS_LABEL, QUOTE_STATUSES, type QuoteStatus } from '@/lib/quoteStatus';
import { SendToTrackerButton, StatusSelect } from './QuoteStatusControls';
import styles from './QuotesTable.module.css';

export interface QuoteRow {
  id: string;
  number: number;
  createdAt: string;
  customer: string;
  phone: string;
  address: string;
  dims: string;
  total: number;
  version: number;
  status: QuoteStatus;
  trackerSentAt: string | null;
}

export function QuotesTable({ rows }: { rows: QuoteRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all');
  const filtered = rows.filter(
    (r) => (statusFilter === 'all' || r.status === statusFilter) && `${r.number} ${r.customer} ${r.phone} ${r.address}`.toLowerCase().includes(q.toLowerCase()),
  );

  async function remove(row: QuoteRow) {
    if (!confirm(`Usunąć wycenę nr ${row.number} (${row.customer})?`)) return;
    await fetch(`/api/admin/quotes/${row.id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div className={`${styles.container} min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
        <input
          aria-label="Szukaj wyceny"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj: numer, nazwisko, telefon, adres…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          aria-label="Filtruj wyceny według statusu"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | QuoteStatus)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option value="all">Wszystkie statusy</option>
          {QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUOTE_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} z {rows.length}</span>
      </div>
      <table className={styles.table} role="table" aria-label="Zapisane wyceny">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500" role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className={styles.identity}>Nr / data</th>
            <th scope="col" role="columnheader">Klient / kontakt</th>
            <th scope="col" role="columnheader" className={styles.garage}>Garaż</th>
            <th scope="col" role="columnheader" className={styles.amount}>Kwota</th>
            <th scope="col" role="columnheader" className={styles.status}>Status</th>
            <th scope="col" role="columnheader" className={styles.actions}>Akcje</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {filtered.length === 0 && (
            <tr role="row">
              <td role="cell" colSpan={6} className={styles.empty}>Brak wycen.</td>
            </tr>
          )}
          {filtered.map((r) => (
            <tr key={r.id} role="row" className={styles.row} onClick={() => router.push(`/panel/wyceny/${r.id}`)}>
              <td role="cell" className={styles.identity}>
                <Link href={`/panel/wyceny/${r.id}`} className="font-semibold text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                  #{r.number}
                </Link>
                <time dateTime={r.createdAt} className="mt-1 block text-xs leading-5 text-slate-500">
                  <span className="block">{new Date(r.createdAt).toLocaleDateString('pl-PL')}</span>
                  <span className="block">{new Date(r.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                </time>
              </td>
              <td role="cell" className={styles.customer}>
                <div className="font-medium text-slate-800">{r.customer}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{r.address}</div>
                <div className="mt-1 text-sm text-slate-700"><span className="text-xs text-slate-500">Tel. </span>{r.phone || '—'}</div>
              </td>
              <td role="cell" className={styles.garage}>
                <span className={styles.mobileLabel}>Garaż</span>
                <span className="text-slate-600">{r.dims}</span>
              </td>
              <td role="cell" className={styles.amount}>
                <span className={styles.mobileLabel}>Kwota</span>
                <span className="font-semibold tabular-nums text-slate-900">{formatPln(r.total)}</span>
              </td>
              <td role="cell" className={styles.status}>
                <span className={styles.mobileLabel}>Status</span>
                <StatusSelect quoteId={r.id} status={r.status} />
              </td>
              <td role="cell" className={styles.actions}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/panel/wyceny/${r.id}`} aria-label={`Otwórz wycenę nr ${r.number}`} className="rounded-md border border-brand-100 bg-brand-50 px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500" onClick={(e) => e.stopPropagation()}>
                    Otwórz wycenę
                  </Link>
                  <SendToTrackerButton quoteId={r.id} quoteNumber={r.number} sentAt={r.trackerSentAt} />
                  <button
                    type="button"
                    aria-label={`Usuń wycenę nr ${r.number}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(r);
                    }}
                    className="rounded px-1 py-1 text-xs text-red-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
