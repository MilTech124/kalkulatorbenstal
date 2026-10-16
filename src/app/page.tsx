import Link from 'next/link';
import { Icon } from '@/components/icons';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Calculator } from '@/components/calculator/Calculator';
import { getSession } from '@/lib/auth';
import { DEFAULT_PRICE_LIST } from '@/lib/pricing/defaults';
import { getActivePriceList } from '@/lib/pricing/repository';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Gdy baza jest niedostepna, kalkulator dziala na domyslnym cenniku (zapis wyceny i tak wymaga bazy).
  const priceList = await getActivePriceList()
    .then((p) => p.data)
    .catch((err) => {
      console.error('Nie udało się pobrać cennika z bazy, używam domyślnego:', err?.message ?? err);
      return DEFAULT_PRICE_LIST;
    });

  const session = await getSession();

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon name="home" size={24} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">BEN-STAL</p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Kalkulator garaży blaszanych</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="hidden items-center gap-1.5 text-sm text-slate-500 sm:inline-flex">
                <Icon name="user" size={16} />
                {session.name}
              </span>
            )}
            <Link href="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
              <Icon name="dashboard" size={16} />
              Panel
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Calculator priceList={priceList} />
      </main>
      <footer className="px-4 py-6 text-center text-xs text-slate-400">Wycena ma charakter orientacyjny i nie stanowi oferty handlowej.</footer>
    </>
  );
}
