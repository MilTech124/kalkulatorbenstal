import mongoose from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteBreakdown } from '@/components/calculator/Summary';
import { formatPln } from '@/lib/format';
import { connectDb } from '@/lib/db';
import { GATE_LABELS } from '@/lib/pricing/engine';
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
      label: 'Brama',
      value:
        input.gate.type === 'none'
          ? 'brak'
          : `${GATE_LABELS[input.gate.type]} ${input.gate.width} × ${input.gate.height} m${input.gate.automat && input.gate.type !== 'sectional' ? ', automat' : ''}${input.gate.winchester ? ', winchester' : ''}${input.gate.doorInGate ? ', drzwi w bramie' : ''}`,
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

  const input = doc.input as QuoteInput;
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
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Razem brutto</p>
          <p className="text-2xl font-bold tabular-nums text-brand-700">{formatPln(doc.total)}</p>
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
              <Row label="Adres" value={c.address} />
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
