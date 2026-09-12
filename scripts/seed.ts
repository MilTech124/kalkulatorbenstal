// Zapisuje domyslny cennik do bazy, jesli nie ma jeszcze zadnego aktywnego.
// Uzycie: npm run seed   (wymaga MONGODB_URI w .env.local lub srodowisku)
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { DEFAULT_PRICE_LIST } from '../src/lib/pricing/defaults';
import { PriceListModel } from '../src/models/PriceList';

config({ path: '.env.local' });
config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Brak MONGODB_URI');
  await mongoose.connect(uri);
  const existing = await PriceListModel.findOne({ active: true }).lean();
  if (existing) {
    console.log(`Aktywny cennik już istnieje (wersja ${existing.version}) - pomijam.`);
  } else {
    await PriceListModel.create({ version: 1, active: true, data: DEFAULT_PRICE_LIST });
    console.log('Zapisano domyślny cennik jako wersję 1.');
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
