import { connectDb } from '@/lib/db';
import { PriceListModel } from '@/models/PriceList';
import { DEFAULT_PRICE_LIST } from './defaults';
import type { PriceList } from './types';

export interface ActivePriceList {
  version: number;
  data: PriceList;
}

/**
 * Uzupelnia cennik zapisany starsza wersja aplikacji o pola dodane pozniej (np. structures, currencies, custom),
 * biorac je z domyslnego cennika. Istniejace wartosci nie sa nadpisywane.
 */
export function withDefaults(data: Partial<PriceList>): PriceList {
  const out = { ...DEFAULT_PRICE_LIST, ...data } as PriceList;
  const d = DEFAULT_PRICE_LIST;
  out.unit = { ...d.unit, ...(data.unit ?? {}) };
  out.gate = { ...d.gate, ...(data.gate ?? {}), tilt: { ...d.gate.tilt, ...(data.gate?.tilt ?? {}) }, sectional: { ...d.gate.sectional, ...(data.gate?.sectional ?? {}) } };
  out.extras = { ...d.extras, ...(data.extras ?? {}) };
  out.carport = { ...d.carport, ...(data.carport ?? {}) };
  out.custom = { ...d.custom, ...(data.custom ?? {}), colorPerM3: { ...d.custom.colorPerM3, ...(data.custom?.colorPerM3 ?? {}) } };
  out.sandwich = { ...d.sandwich, ...(data.sandwich ?? {}) };
  // Puste listy w starym cenniku = brak konfiguracji -> domyslne
  if (!data.structures?.length) out.structures = d.structures;
  if (!data.currencies?.length) out.currencies = d.currencies;
  return out;
}

/** Aktywny cennik z bazy; gdy brak - domyslny (wersja 0). */
export async function getActivePriceList(): Promise<ActivePriceList> {
  await connectDb();
  const doc = await PriceListModel.findOne({ active: true }).sort({ version: -1 }).lean();
  if (!doc) return { version: 0, data: DEFAULT_PRICE_LIST };
  return { version: doc.version, data: withDefaults(doc.data as Partial<PriceList>) };
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
