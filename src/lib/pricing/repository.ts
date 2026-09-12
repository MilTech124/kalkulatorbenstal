import { connectDb } from '@/lib/db';
import { PriceListModel } from '@/models/PriceList';
import { DEFAULT_PRICE_LIST } from './defaults';
import type { PriceList } from './types';

export interface ActivePriceList {
  version: number;
  data: PriceList;
}

/** Aktywny cennik z bazy; gdy brak - domyslny (wersja 0). */
export async function getActivePriceList(): Promise<ActivePriceList> {
  await connectDb();
  const doc = await PriceListModel.findOne({ active: true }).sort({ version: -1 }).lean();
  if (!doc) return { version: 0, data: DEFAULT_PRICE_LIST };
  return { version: doc.version, data: doc.data as PriceList };
}

/** Zapisuje nowa wersje cennika i ustawia ja jako aktywna. */
export async function saveNewPriceListVersion(data: PriceList): Promise<ActivePriceList> {
  await connectDb();
  const last = await PriceListModel.findOne().sort({ version: -1 }).lean();
  const version = (last?.version ?? 0) + 1;
  await PriceListModel.updateMany({ active: true }, { $set: { active: false } });
  await PriceListModel.create({ version, active: true, data });
  return { version, data };
}

export async function listPriceListVersions() {
  await connectDb();
  return PriceListModel.find({}, { version: 1, active: 1, createdAt: 1 }).sort({ version: -1 }).lean();
}

export async function activatePriceListVersion(version: number): Promise<boolean> {
  await connectDb();
  const doc = await PriceListModel.findOne({ version });
  if (!doc) return false;
  await PriceListModel.updateMany({ active: true }, { $set: { active: false } });
  doc.active = true;
  await doc.save();
  return true;
}
