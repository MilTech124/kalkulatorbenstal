import Link from 'next/link';
import { Calculator } from '@/components/calculator/Calculator';
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

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">BEN-STAL</p>
            <h1 className="text-xl font-bold text-slate-900">Kalkulator garaży blaszanych</h1>
          </div>
          <Link href="/panel" className="text-sm text-slate-500 hover:text-slate-800">
            Panel
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Calculator priceList={priceList} />
      </main>
      <footer className="px-4 py-6 text-center text-xs text-slate-400">Wycena ma charakter orientacyjny i nie stanowi oferty handlowej.</footer>
    </>
  );
}
