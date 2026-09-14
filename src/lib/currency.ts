// Waluty: kursy w cenniku (ile PLN za 1 jednostke). PLN zawsze dostepny.
export interface CurrencyOption {
  code: string;
  label: string;
  /** Ile PLN za 1 jednostke waluty. */
  rate: number;
}

export const PLN: CurrencyOption = { code: 'PLN', label: 'Złoty (PLN)', rate: 1 };

export function findCurrency(list: CurrencyOption[] | undefined, code: string | undefined): CurrencyOption {
  if (!code || code === 'PLN') return PLN;
  return list?.find((c) => c.code === code && c.rate > 0) ?? PLN;
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
