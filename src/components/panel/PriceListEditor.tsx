'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { PriceList } from '@/lib/pricing/types';
import { Button } from '@/components/ui';
import { AddonsEditor, AdvancedEditor, BaseTableEditor, CarportEditor, GatesEditor } from './editors';

export interface VersionInfo {
  version: number;
  active: boolean;
  createdAt: string;
}

type Tab = 'base' | 'addons' | 'gates' | 'carport' | 'advanced' | 'versions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'base', label: 'Tabela bazowa' },
  { id: 'addons', label: 'Dodatki' },
  { id: 'gates', label: 'Bramy' },
  { id: 'carport', label: 'Wiata' },
  { id: 'advanced', label: 'Zaawansowane' },
  { id: 'versions', label: 'Wersje' },
];

export function PriceListEditor({ initial, version, versions }: { initial: PriceList; version: number; versions: VersionInfo[] }) {
  const router = useRouter();
  const [pl, setPlState] = useState<PriceList>(initial);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('base');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Po router.refresh() serwer przekazuje swiezy cennik - przejmujemy go, o ile nie ma niezapisanych zmian.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (!dirty) setPlState(initial);
  }

  const setPl = useCallback((updater: (prev: PriceList) => PriceList) => {
    setPlState(updater);
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/pricing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pl) });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.issues?.[0] ? ` (${data.issues[0].path?.join('.')}: ${data.issues[0].message})` : '';
        throw new Error((data.error ?? 'Błąd zapisu') + detail);
      }
      setDirty(false);
      setToast({ kind: 'ok', text: `Zapisano cennik jako wersję ${data.version}.` });
      router.refresh();
    } catch (err) {
      setToast({ kind: 'err', text: err instanceof Error ? err.message : 'Błąd zapisu' });
    } finally {
      setBusy(false);
    }
  }

  async function action(body: { action: 'activate'; version: number } | { action: 'restoreDefaults' }) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Błąd');
      setToast({ kind: 'ok', text: body.action === 'activate' ? `Aktywowano wersję ${data.version}.` : `Przywrócono domyślny cennik jako wersję ${data.version}.` });
      setDirty(false);
      router.refresh();
    } catch (err) {
      setToast({ kind: 'err', text: err instanceof Error ? err.message : 'Błąd' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cennik</h1>
          <p className="text-sm text-slate-500">
            Aktywna wersja: <strong>v{version}</strong>
            {dirty && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">niezapisane zmiany</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!dirty || busy}
            onClick={() => {
              setPlState(initial);
              setDirty(false);
            }}
          >
            Cofnij zmiany
          </Button>
          <Button disabled={!dirty || busy} onClick={save}>
            {busy ? 'Zapisywanie…' : 'Zapisz jako nową wersję'}
          </Button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'base' && <BaseTableEditor pl={pl} setPl={setPl} />}
      {tab === 'addons' && <AddonsEditor pl={pl} setPl={setPl} />}
      {tab === 'gates' && <GatesEditor pl={pl} setPl={setPl} />}
      {tab === 'carport' && <CarportEditor pl={pl} setPl={setPl} />}
      {tab === 'advanced' && <AdvancedEditor pl={pl} setPl={setPl} />}
      {tab === 'versions' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Historia wersji</h3>
          <p className="mb-3 text-sm text-slate-500">Każdy zapis tworzy nową wersję. Można wrócić do wcześniejszej lub przywrócić cennik domyślny z Excela/PDF.</p>
          <ul className="divide-y divide-slate-100">
            {versions.map((v) => (
              <li key={v.version} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <strong>v{v.version}</strong> <span className="text-slate-500">{new Date(v.createdAt).toLocaleString('pl-PL')}</span>
                  {v.active && <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">aktywna</span>}
                </span>
                {!v.active && (
                  <Button variant="secondary" disabled={busy} onClick={() => action({ action: 'activate', version: v.version })}>
                    Aktywuj
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (confirm('Przywrócić domyślny cennik (z Excela i skanu)? Zostanie zapisany jako nowa wersja.')) action({ action: 'restoreDefaults' });
              }}
            >
              Przywróć cennik domyślny
            </Button>
          </div>
        </section>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm shadow-lg ${toast.kind === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.text}</div>
      )}
    </div>
  );
}
