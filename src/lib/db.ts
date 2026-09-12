import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

// Cache polaczenia miedzy hot-reloadami w dev i miedzy wywolaniami route handlerow.
const globalForMongoose = globalThis as unknown as { _mongoose?: Promise<typeof mongoose> };

export function connectDb(): Promise<typeof mongoose> {
  if (!uri) throw new Error('Brak MONGODB_URI w zmiennych środowiskowych.');
  if (!globalForMongoose._mongoose) {
    globalForMongoose._mongoose = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
      globalForMongoose._mongoose = undefined;
      throw err;
    });
  }
  return globalForMongoose._mongoose;
}
