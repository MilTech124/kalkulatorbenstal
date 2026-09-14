'use client';

import type { QuoteResult } from '@/lib/pricing/types';
import { formatNum, formatPln } from '@/lib/format';
import { convertFromPln, currencyKey, findCurrency, formatMoney, PLN, type CurrencyOption } from '@/lib/currency';

export function QuoteBreakdown({ result, compact = false }: { result: QuoteResult; compact?: boolean }) {
  return (
    <ul className={`divide-y divide-slate-100 ${compact ? 'text-sm' : ''}`}>
      {result.items.map((it) => (
        <li key={it.key} className="flex items-start justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-sm text-slate-800">{it.label}</p>
            {it.qty !== undefined && it.unitPrice !== undefined && (
              <p className="text-xs text-slate-500">
                {formatNum(it.qty)} {it.unit} × {formatPln(it.unitPrice)}
              </p>
            )}
            {it.note && <p className="text-xs text-amber-700">{it.note}</p>}
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-slate-900">{formatPln(it.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Summary({
  result,
  onSave,
  currencies = [],
  currency,
  onCurrencyChange,
}: {
  result: QuoteResult;
  onSave: () => void;
  currencies?: CurrencyOption[];
  currency?: string;
  onCurrencyChange?: (code: string) => void;
}) {
  const cur = findCurrency(currencies, currency);
  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Twoja wycena</h2>
        <p className="text-xs text-slate-500">Cena aktualizuje się na bieżąco.</p>
      </div>
      <div className="max-h-[50vh] overflow-y-auto px-5">
        {result.items.length === 0 ? <p className="py-4 text-sm text-slate-500">Brak pozycji.</p> : <QuoteBreakdown result={result} />}
      </div>
      {result.warnings.length > 0 && (
        <ul className="mx-5 mb-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {result.warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
      <div className="border-t border-slate-100 px-5 py-4">
        {onCurrencyChange && currencies.length > 0 && (
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Waluta</span>
            <select value={currencyKey(cur)} onChange={(e) => onCurrencyChange(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
              {[PLN, ...currencies].map((c) => (
                <option key={currencyKey(c)} value={currencyKey(c)}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-slate-600">Razem brutto</span>
          <span className="text-2xl font-bold tabular-nums text-brand-700">{cur.code === 'PLN' ? formatPln(result.total) : formatMoney(convertFromPln(result.total, cur), cur.code)}</span>
        </div>
        {cur.code !== 'PLN' && (
          <p className="text-right text-xs text-slate-500">
            {formatPln(result.total)} · {cur.label}: 1 {cur.code} = {formatNum(cur.rate)} zł
          </p>
        )}
        {result.needsManualQuote && <p className="mt-1 text-xs text-amber-700">Część pozycji wymaga wyceny indywidualnej – suma jest orientacyjna.</p>}
        <button
          type="button"
          onClick={onSave}
          disabled={result.items.length === 0}
          className="mt-4 w-full rounded-lg bg-accent-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600 disabled:opacity-50"
        >
          Zapisz wycenę
        </button>
      </div>
    </aside>
  );
}

export function MobileTotalBar({ total, onSave }: { total: number; onSave: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div>
        <p className="text-xs text-slate-500">Razem brutto</p>
        <p className="text-lg font-bold tabular-nums text-brand-700">{formatPln(total)}</p>
      </div>
      <button type="button" onClick={onSave} className="rounded-lg bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600">
        Zapisz wycenę
      </button>
    </div>
  );
}
