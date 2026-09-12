import mongoose, { Schema } from 'mongoose';

// Licznik do numerowania wycen (atomowy inkrement).
const counterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });

export const CounterModel = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export async function nextSequence(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true }).lean<{ seq: number }>();
  return doc!.seq;
}
