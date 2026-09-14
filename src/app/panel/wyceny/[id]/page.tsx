import mongoose from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteBreakdown } from '@/components/calculator/Summary';
import { formatAddress } from '@/lib/customer';
import { formatPln } from '@/lib/format';
import { convertFromPln, formatMoney } from '@/lib/currency';
import { SendToTrackerButton, StatusSelect } from '@/components/panel/QuoteStatusControls';
import { OfferPdfButton } from '@/components/panel/OfferPdfButton';
import { connectDb } from '@/lib/db';
import { GATE_LABELS, normalizeInput } from '@/lib/pricing/engine';
import type { QuoteInput, QuoteResult } from '@/lib/pricing/types';
import { QuoteModel } from '@/models/Quote';

export const dynamic = 'force-dynamic';

function describeInput(input: QuoteInput): { label: string; value: string }[] {
  const sheet = { ocynk: 'ocynk', ral: 'kolor RAL', wood: 'drewnopodobny' }[input.sheet];
  const roof = { rear: 'spad do tyłu', side: 'spad na bok', gable: 'dwuspadowy' }[input.roofType];
  const rows = [
    { label: 'Wymiary', value: `${input.width} × ${input.length} m, wys. ${input.height} m` },
    { label: 'Dach / blacha', value: `${roof}, ${sheet}${input.horizontalPanel ? ', poziomy panel' : ''}` },
    {
      label: input.gates.length > 1 ? 'Bramy' : 'Brama',
      value:
        input.gates.length === 0
          ? 'brak'
          : input.gates
              .map(
                (g) =>
                  `${GATE_LABELS[g.type]} ${g.width} × ${g.height} m${g.automat && g.type !== 'sectional' ? ', automat' : ''}${g.winchester ? ', winchester' : ''}${g.doorInGate ? ', drzwi w bramie' : ''}`,
              )
              .join('; '),
    },
    { label: 'Opcje dachu', value: [input.gutters && 'rynny', input.felt && 'filc', input.tile && 'blachodachówka'].filter(Boolean).join(', ') || '—' },
  ];
  if (input.carport.enabled) rows.push({ label: 'Wiata', value: `${input.carport.width} × ${input.carport.length} m` });
  return rows;
}

export default async function QuoteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  await connectDb();
  const doc = await QuoteModel.findById(id).lean();
  if (!doc) notFound();

  const input = normalizeInput(doc.input as QuoteInput);
  const result = doc.result as QuoteResult;
  const c = doc.customer;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/panel" className="text-sm text-slate-500 hover:text-slate-800">
            ← Wszystkie wyceny
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Wycena #{doc.number}</h1>
          <p className="text-sm text-slate-500">
            {doc.createdAt.toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })} · cennik v{doc.priceListVersion}
            {doc.tracker?.orderId && (
              <>
                {' '}· w trackerze od {doc.tracker.sentAt?.toLocaleString('pl-PL')}
                {doc.tracker.addressGeocoded === false && <span className="text-amber-700"> (adres bez pina na mapie)</span>}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            Status: <StatusSelect quoteId={id} status={doc.status ?? 'nowe'} />
          </div>
          <OfferPdfButton quoteId={id} total={doc.total} offeredTotal={doc.offeredTotal} note={doc.offerNote} />
          <SendToTrackerButton quoteId={id} quoteNumber={doc.number} sentAt={doc.tracker?.sentAt ? doc.tracker.sentAt.toISOString() : null} variant="button" />
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Razem brutto</p>
            <p className="text-2xl font-bold tabular-nums text-brand-700">{formatPln(doc.total)}</p>
            {doc.offeredTotal != null && doc.offeredTotal !== doc.total && (
              <p className="text-xs text-amber-700">w ofercie: {formatPln(doc.offeredTotal)}</p>
            )}
            {doc.currency?.code && doc.currency.code !== 'PLN' && doc.currency.rate ? (
              <p className="text-xs text-slate-500">
                {formatMoney(convertFromPln(doc.offeredTotal ?? doc.total, { rate: doc.currency.rate }), doc.currency.code)} (kurs {doc.currency.rate})
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Klient</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Imię i nazwisko" value={`${c.firstName} ${c.lastName}`} />
              <Row label="Telefon" value={c.phone} />
              <Row label="E-mail" value={c.email ?? '—'} />
              <Row label="Adres" value={formatAddress(c)} />
            </dl>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Konfiguracja</h2>
            <dl className="space-y-2 text-sm">
              {describeInput(input).map((r) => (
                <Row key={r.label} label={r.label} value={r.value} />
              ))}
            </dl>
          </section>
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Rozbicie ceny</h2>
          <QuoteBreakdown result={result} />
          {result.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {result.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
            <span>Razem</span>
            <span className="tabular-nums">{formatPln(result.total)}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
