import { AppNav } from '@/components/AppNav';
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
      <AppNav userName={session?.name} />
      <main className="flex-1">
        <Calculator priceList={priceList} />
      </main>
      <footer className="px-4 py-6 text-center text-xs text-slate-400">Wycena ma charakter orientacyjny i nie stanowi oferty handlowej.</footer>
    </>
  );
}
