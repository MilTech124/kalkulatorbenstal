// Klient integracji z Order-trackerem (POST /api/integration/orders, naglowek X-Api-Key).
// Wolany wylacznie po stronie serwera - klucz API nie trafia do przegladarki.
import type { QuoteDoc } from '@/models/Quote';
import { GATE_LABELS, normalizeInput } from '@/lib/pricing/engine';
import type { TrackerStatus } from '@/lib/quoteStatus';

export interface TrackerSendOptions {
  deliveryDate?: string;
  details?: string;
  status: TrackerStatus;
}

export interface TrackerResponse {
  id: string;
  title: string;
  status: string;
  addressGeocoded: boolean;
  lat: number | null;
  lng: number | null;
  createdAt: string;
}

export function trackerConfigured(): boolean {
  return Boolean(process.env.ORDER_TRACKER_API_KEY);
}

export function trackerBaseUrl(): string {
  return (process.env.ORDER_TRACKER_URL || 'https://order-tracker-rouge.vercel.app').replace(/\/+$/, '');
}

/** Tytul zamowienia w trackerze, np. "Wycena #12 - garaż 5 × 6 m". */
export function trackerTitle(quote: Pick<QuoteDoc, 'number' | 'input'>): string {
  const input = normalizeInput(quote.input);
  return `Wycena #${quote.number} - garaż ${input.width} × ${input.length} m`;
}

/** Skrocony opis konfiguracji do pola "details" w trackerze. */
export function trackerDetails(quote: Pick<QuoteDoc, 'number' | 'input' | 'result' | 'total' | 'offeredTotal'>): string {
  const input = normalizeInput(quote.input);
  const sheet = { ocynk: 'ocynk', ral: 'RAL', wood: 'drewnopodobny' }[input.sheet];
  const roof = { rear: 'spad do tyłu', side: 'spad na bok', gable: 'dwuspadowy' }[input.roofType];
  const lines = [
    `Garaż ${input.width} × ${input.length} m, wys. ${quote.result?.effectiveHeight ?? input.height} m, ${roof}, ${sheet}${input.horizontalPanel ? ', poziomy panel' : ''}`,
  ];
  if (input.gates.length) {
    lines.push(
      `Bramy: ${input.gates.map((g) => `${GATE_LABELS[g.type]} ${g.width} × ${g.height} m${g.automat && g.type !== 'sectional' ? ' + automat' : ''}`).join('; ')}`,
    );
  }
  const opts = [input.gutters && 'rynny', input.felt && 'filc', input.tile && 'blachodachówka'].filter(Boolean);
  if (opts.length) lines.push(`Opcje: ${opts.join(', ')}`);
  const windows = input.windows.filter((w) => w.qty > 0).map((w) => `${w.type} × ${w.qty}`);
  if (windows.length || input.doors) {
    lines.push(`Okna/drzwi: ${[...windows, input.doors ? `drzwi × ${input.doors}` : ''].filter(Boolean).join(', ')}`);
  }
  if (input.carport.enabled) lines.push(`Wiata ${input.carport.width} × ${input.carport.length} m`);
  lines.push(`Kwota brutto: ${(quote.offeredTotal ?? quote.total).toLocaleString('pl-PL')} zł`);
  return lines.join('\n');
}

export async function sendQuoteToTracker(quote: QuoteDoc, opts: TrackerSendOptions): Promise<TrackerResponse> {
  const apiKey = process.env.ORDER_TRACKER_API_KEY;
  if (!apiKey) throw new Error('Brak ORDER_TRACKER_API_KEY w konfiguracji serwera.');
  const c = quote.customer;
  const payload = {
    title: trackerTitle(quote),
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    postalCode: c.postalCode || '',
    city: c.city || '',
    // Stare wyceny maja tylko pole address (jednym ciagiem) - wysylamy je jako ulice.
    address: c.street || c.address || '',
    country: 'pl',
    deliveryDate: opts.deliveryDate || undefined,
    details: opts.details ?? trackerDetails(quote),
    amount: quote.offeredTotal ?? quote.total,
    status: opts.status,
  };
  const res = await fetch(`${trackerBaseUrl()}/api/integration/orders`, {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<TrackerResponse> & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Order-tracker odpowiedział kodem ${res.status}`);
  return data as TrackerResponse;
}
