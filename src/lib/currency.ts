// Waluty: kursy w cenniku (ile PLN za 1 jednostke). PLN zawsze dostepny.
export interface CurrencyOption {
  /** Unikalny identyfikator pozycji (np. EUR_DE); stare cenniki: brak = code. */
  key?: string;
  /** Kod ISO waluty - decyduje o symbolu/formatowaniu; moze sie powtarzac (np. EUR Niemcy i EUR Slowacja z innym kursem). */
  code: string;
  label: string;
  /** Ile PLN za 1 jednostke waluty. */
  rate: number;
}

export const PLN: CurrencyOption = { key: 'PLN', code: 'PLN', label: 'Złoty (PLN)', rate: 1 };

export const currencyKey = (c: CurrencyOption) => c.key || c.code;

export function findCurrency(list: CurrencyOption[] | undefined, key: string | undefined): CurrencyOption {
  if (!key || key === 'PLN') return PLN;
  return list?.find((c) => currencyKey(c) === key && c.rate > 0) ?? PLN;
}

export function convertFromPln(pln: number, cur: Pick<CurrencyOption, 'rate'>): number {
  return cur.rate > 0 ? pln / cur.rate : pln;
}

export function formatMoney(amount: number, code: string): string {
  const digits = code === 'PLN' || code === 'HUF' ? 0 : 2;
  const n = amount.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sym: Record<string, string> = { PLN: 'zł', EUR: '€', HUF: 'Ft' };
  return `${n} ${sym[code] ?? code}`;
}
