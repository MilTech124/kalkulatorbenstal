'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPln } from '@/lib/format';
import { QUOTE_STATUS_LABEL, QUOTE_STATUSES, type QuoteStatus } from '@/lib/quoteStatus';
import { SendToTrackerButton, StatusSelect } from './QuoteStatusControls';

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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Szukaj: numer, nazwisko, telefon, adres…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Nr</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Klient</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2">Garaż</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Kwota</th>
              <th className="px-4 py-2 text-center">Tracker</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Brak wycen.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-brand-50/60" onClick={() => router.push(`/panel/wyceny/${r.id}`)}>
                <td className="px-4 py-2 font-medium">
                  <Link href={`/panel/wyceny/${r.id}`} className="text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    #{r.number}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">{new Date(r.createdAt).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800">{r.customer}</div>
                  <div className="text-xs text-slate-500">{r.address}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.phone}</td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">{r.dims}</td>
                <td className="whitespace-nowrap px-4 py-2">
                  <StatusSelect quoteId={r.id} status={r.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums">{formatPln(r.total)}</td>
                <td className="px-4 py-2 text-center">
                  <SendToTrackerButton quoteId={r.id} quoteNumber={r.number} sentAt={r.trackerSentAt} />
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right">
                  <Link href={`/panel/wyceny/${r.id}`} className="mr-3 text-xs text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    szczegóły
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(r);
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    usuń
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
