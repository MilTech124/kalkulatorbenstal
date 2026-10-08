import mongoose, { Schema } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  if (mongoose.models.Quote) mongoose.deleteModel('Quote');
  vi.resetModules();
});

describe('odświeżenie modelu wyceny', () => {
  it('zachowuje wybór firmy, gdy w pamięci jest model sprzed dodania offerCompany', async () => {
    const oldModel = mongoose.model('Quote', new Schema({ number: Number, offeredTotal: Number, offerNote: String }));
    expect(new oldModel({ number: 1, offerCompany: 'zimstal' }).toObject()).not.toHaveProperty('offerCompany');

    const { QuoteModel } = await import('./Quote');
    expect(QuoteModel.schema.path('offerCompany')).toBeDefined();
    expect(new QuoteModel({ number: 1, offerCompany: 'zimstal' }).toObject()).toHaveProperty('offerCompany', 'zimstal');
    expect(new QuoteModel({ number: 2 }).toObject()).toHaveProperty('offerCompany', 'benstal');
  });

  it('ponownie wykorzystuje aktualny model bez błędu ponownej rejestracji', async () => {
    const first = await import('./Quote');
    vi.resetModules();
    const second = await import('./Quote');
    expect(second.QuoteModel).toBe(first.QuoteModel);
  });
});
