// Statusy wyceny (cykl zycia zapytania -> zamowienia -> dostawy) i mapowanie na statusy Order-trackera.

export const QUOTE_STATUSES = ['nowe', 'wyceniono', 'zamowiono', 'w_trakcie', 'w_trasie', 'dostarczone', 'anulowane'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  nowe: 'Nowe',
  wyceniono: 'Wyceniono',
  zamowiono: 'Zamówiono',
  w_trakcie: 'W realizacji',
  w_trasie: 'W trasie',
  dostarczone: 'Dostarczone',
  anulowane: 'Anulowane',
};

/** Klasy Tailwind dla etykiety statusu. */
export const QUOTE_STATUS_CLASS: Record<QuoteStatus, string> = {
  nowe: 'bg-blue-100 text-blue-800',
  wyceniono: 'bg-violet-100 text-violet-800',
  zamowiono: 'bg-amber-100 text-amber-800',
  w_trakcie: 'bg-orange-100 text-orange-800',
  w_trasie: 'bg-yellow-100 text-yellow-800',
  dostarczone: 'bg-green-100 text-green-800',
  anulowane: 'bg-slate-200 text-slate-700',
};

export const TRACKER_STATUSES = ['nowe', 'w_trakcie', 'w_trasie', 'dostarczone', 'anulowane'] as const;
export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export const TRACKER_STATUS_LABEL: Record<TrackerStatus, string> = {
  nowe: 'Nowe',
  w_trakcie: 'W trakcie',
  w_trasie: 'W trasie',
  dostarczone: 'Dostarczone',
  anulowane: 'Anulowane',
};

/** Domyslny status w trackerze dla statusu wyceny. */
export function toTrackerStatus(status: QuoteStatus): TrackerStatus {
  switch (status) {
    case 'w_trakcie':
    case 'w_trasie':
    case 'dostarczone':
    case 'anulowane':
      return status;
    default:
      return 'nowe';
  }
}
