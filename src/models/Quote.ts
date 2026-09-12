import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { CustomerInfo, QuoteInput, QuoteResult } from '@/lib/pricing/types';

const quoteSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String, required: true },
    },
    input: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    total: { type: Number, required: true },
    priceListVersion: { type: Number, required: true },
  },
  { timestamps: true, minimize: false },
);

export type QuoteDoc = Omit<InferSchemaType<typeof quoteSchema>, 'customer' | 'input' | 'result'> & {
  customer: CustomerInfo;
  input: QuoteInput;
  result: QuoteResult;
  createdAt: Date;
  updatedAt: Date;
};

export const QuoteModel = (mongoose.models.Quote as mongoose.Model<QuoteDoc>) || mongoose.model<QuoteDoc>('Quote', quoteSchema);
