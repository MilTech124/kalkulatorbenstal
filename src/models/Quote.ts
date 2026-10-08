import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { CustomerInfo, QuoteInput, QuoteResult } from '@/lib/pricing/types';
import { QUOTE_STATUSES, type QuoteStatus } from '@/lib/quoteStatus';
import { OFFER_COMPANIES, type OfferCompany } from '@/lib/offerCompany';

const quoteSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true },
    customer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      street: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      city: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    status: { type: String, enum: QUOTE_STATUSES, default: 'nowe', index: true },
    /** Cena podana w ofercie e-mail (moze byc inna niz wyliczona - edycja przez firme). */
    offeredTotal: { type: Number },
    offerNote: { type: String },
    offerCompany: { type: String, enum: OFFER_COMPANIES, default: 'benstal' },
    /** Waluta prezentacji + kurs z chwili zapisu (ile PLN za 1 jednostke). */
    currency: { key: { type: String }, code: { type: String }, label: { type: String }, rate: { type: Number } },
    /** Losowy token do publicznego pobrania oferty PDF. */
    accessToken: { type: String, index: true },
    tracker: {
      orderId: { type: String },
      sentAt: { type: Date },
      status: { type: String },
      addressGeocoded: { type: Boolean },
    },
    input: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    total: { type: Number, required: true },
    priceListVersion: { type: Number, required: true },
  },
  { timestamps: true, minimize: false },
);

export interface TrackerInfo {
  orderId?: string;
  sentAt?: Date;
  status?: string;
  addressGeocoded?: boolean;
}

export type QuoteDoc = Omit<InferSchemaType<typeof quoteSchema>, 'customer' | 'input' | 'result' | 'status' | 'tracker' | 'offerCompany'> & {
  offerCompany?: OfferCompany;
  customer: CustomerInfo;
  status: QuoteStatus;
  tracker?: TrackerInfo;
  input: QuoteInput;
  result: QuoteResult;
  createdAt: Date;
  updatedAt: Date;
};

// Hot reload może pozostawić model sprzed dodania pola firmy. Taki model
// po cichu usuwa offerCompany zarówno przy create, jak i findByIdAndUpdate.
// Wymieniamy wyłącznie nieaktualny model w pamięci; zapisane wyceny pozostają bez zmian.
if (mongoose.models.Quote && !mongoose.models.Quote.schema.path('offerCompany')) {
  mongoose.deleteModel('Quote');
}

export const QuoteModel = (mongoose.models.Quote as mongoose.Model<QuoteDoc>) || mongoose.model<QuoteDoc>('Quote', quoteSchema);
