import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { PriceList } from '@/lib/pricing/types';

// Cennik trzymany jako jeden dokument JSON (Mixed) - struktura walidowana przez zod przy zapisie.
const priceListSchema = new Schema(
  {
    version: { type: Number, required: true, unique: true },
    active: { type: Boolean, required: true, default: false, index: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false },
);

export type PriceListDoc = InferSchemaType<typeof priceListSchema> & { data: PriceList };

export const PriceListModel =
  (mongoose.models.PriceList as mongoose.Model<PriceListDoc>) || mongoose.model<PriceListDoc>('PriceList', priceListSchema);
