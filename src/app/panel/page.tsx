import { connectDb } from '@/lib/db';
import { QuoteModel } from '@/models/Quote';
import { QuotesTable, type QuoteRow } from '@/components/panel/QuotesTable';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  await connectDb();
  const docs = await QuoteModel.find({}, { number: 1, customer: 1, total: 1, createdAt: 1, input: 1, 'result.effectiveHeight': 1, priceListVersion: 1 })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const rows: QuoteRow[] = docs.map((d) => ({
    id: d._id.toString(),
    number: d.number,
    createdAt: d.createdAt.toISOString(),
    customer: `${d.customer.firstName} ${d.customer.lastName}`,
    phone: d.customer.phone,
    address: d.customer.address,
    dims: [d.input.width, d.input.length, d.result?.effectiveHeight ?? d.input.height].map((n) => n.toLocaleString('pl-PL')).join(' × ') + ' m',
    total: d.total,
    version: d.priceListVersion,
  }));

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Zapisane wyceny</h1>
          <p className="text-sm text-slate-500">{rows.length} wycen, od najnowszej.</p>
        </div>
      </div>
      <QuotesTable rows={rows} />
    </div>
  );
}
