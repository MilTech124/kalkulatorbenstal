import { z } from 'zod';
import { SHEET_COLORS, sheetColorFamily } from '@/lib/sheetColors';

const num = z.number().finite();
const nonNeg = num.min(0);
const pos = num.positive();

export const sheetSchema = z.enum(['ocynk', 'ral', 'wood']);
export const roofTypeSchema = z.enum(['rear', 'side', 'gable']);
export const gateTypeSchema = z.enum(['none', 'tilt', 'double', 'sectional']);
export const windowTypeSchema = z.enum(['w100x60', 'w80x60', 'w60x40', 'plexi64x34', 'opening']);

export const productTypeSchema = z.enum(['steel', 'sandwich', 'bin']);

export const quoteInputSchema = z.object({
  productType: productTypeSchema.optional(),
  customDims: z.boolean().optional(),
  structure: z.string().max(50).optional(),
  sandwichPanel: z.string().max(50).optional(),
  width: pos.max(20),
  length: pos.max(20),
  height: pos.max(6),
  roofType: roofTypeSchema,
  sheet: sheetSchema,
  sheetColor: z.string().max(40).optional(),
  roofSheet: sheetSchema.optional(),
  roofColor: z.string().max(40).optional(),
  flashingColor: z.string().max(40).optional(),
  horizontalPanel: z.boolean(),
  sheetLayout: z.enum(['v', 'h', 'vWide', 'hWide']).optional(),
  felt: z.boolean(),
  flashings: z.boolean().optional(),
  tile: z.boolean(),
  gutters: z.boolean(),
  gates: z
    .array(
      z.object({
        type: gateTypeSchema,
        color: z.string().max(40).optional(),
        width: nonNeg.max(20),
        height: nonNeg.max(6),
        automat: z.boolean(),
        horizontalPanel: z.boolean(),
        winchester: z.boolean(),
        doorInGate: z.boolean(),
        lockKowal: z.boolean().optional(),
      }),
    )
    .max(6),
  windows: z.array(z.object({ type: windowTypeSchema, qty: z.number().int().min(0).max(50), color: z.string().max(40).optional() })).max(20),
  doors: z.number().int().min(0).max(20),
  doorColors: z.array(z.string().max(40)).max(20).optional(),
  doorLocks: z.number().int().min(0).max(20).optional(),
  currency: z.string().trim().max(20).optional(),
  extras: z.object({
    lockKowal: z.boolean(),
    anchoring: z.boolean(),
    padlockHolder: z.boolean(),
    ventGrilleQty: z.number().int().min(0).max(50),
  }),
  carport: z.object({ enabled: z.boolean(), width: nonNeg.max(20), length: nonNeg.max(50) }),
  partitionWalls: z.array(z.object({ width: nonNeg.max(20), height: nonNeg.max(6) })).max(10),
  openwork: z.object({ mode: z.enum(['none', 'wall', 'whole']), width: nonNeg.max(20), height: nonNeg.max(6) }),
}).superRefine((input, ctx) => {
  const family = sheetColorFamily(input.sheet, input.sheetColor);
  const valid = (color: string) => family !== 'ocynk' && SHEET_COLORS[family].some((option) => option.key === color);
  if (input.sheetColor && !valid(input.sheetColor)) ctx.addIssue({ code: 'custom', path: ['sheetColor'], message: 'Wybierz kolor dostępny dla rodzaju blachy' });
  if (input.roofColor) {
    const roofSheet = input.roofSheet ?? input.sheet;
    const roofFamily = sheetColorFamily(roofSheet, input.roofColor);
    if (roofFamily === 'ocynk' || !SHEET_COLORS[roofFamily].some((option) => option.key === input.roofColor)) {
      ctx.addIssue({ code: 'custom', path: ['roofColor'], message: 'Wybierz kolor dachu z wybranej palety' });
    }
  }
  if (input.flashingColor && (!valid(input.flashingColor) || input.flashings === false)) ctx.addIssue({ code: 'custom', path: ['flashingColor'], message: 'Wybierz kolor okuć z aktualnej palety' });
  input.gates.forEach((gate, index) => {
    if (gate.color && !valid(gate.color)) ctx.addIssue({ code: 'custom', path: ['gates', index, 'color'], message: 'Wybierz kolor bramy z aktualnej palety' });
  });
  input.windows.forEach((window, index) => {
    if (window.color && (window.type === 'opening' || !valid(window.color))) ctx.addIssue({ code: 'custom', path: ['windows', index, 'color'], message: 'Wybierz kolor okna z aktualnej palety' });
  });
  if (input.doorColors && input.doorColors.length > input.doors) ctx.addIssue({ code: 'custom', path: ['doorColors'], message: 'Liczba kolorów przekracza liczbę drzwi' });
  input.doorColors?.forEach((color, index) => {
    if (!valid(color)) ctx.addIssue({ code: 'custom', path: ['doorColors', index], message: 'Wybierz kolor drzwi z aktualnej palety' });
  });
});

export const customerSchema = z.object({
  firstName: z.string().trim().min(1, 'Podaj imię').max(100),
  lastName: z.string().trim().min(1, 'Podaj nazwisko').max(100),
  phone: z.string().trim().min(5, 'Podaj numer telefonu').max(30),
  email: z.union([z.literal(''), z.string().trim().email('Nieprawidłowy e-mail').max(200)]).optional(),
  street: z.string().trim().min(2, 'Podaj ulicę i numer').max(200),
  postalCode: z.string().trim().min(2, 'Podaj kod pocztowy').max(20),
  city: z.string().trim().min(2, 'Podaj miejscowość').max(100),
});

export const offerEmailOptionsSchema = z.object({
  offeredTotal: z.number().finite().min(0).max(10_000_000).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const saveQuoteSchema = z.object({
  input: quoteInputSchema,
  customer: customerSchema,
  offer: offerEmailOptionsSchema.optional(),
});

const linearSchema = z.object({ s: num, d: num });
const roofTypeConfigSchema = z.object({
  label: z.string().min(1),
  priceGroup: z.enum(['rear', 'gable']),
  gutter: linearSchema,
  roofFlashing: linearSchema,
  downpipes: z.number().int().min(0).max(10).optional(),
});

const sheetRecord = z.object({ ocynk: nonNeg, ral: nonNeg, wood: nonNeg });

export const priceListSchema = z.object({
  standardHeight: pos,
  heightStep: pos,
  maxHeightSteps: z.number().int().min(0).max(50),
  baseTable: z
    .array(
      z.object({
        width: pos,
        length: pos,
        rear: nonNeg,
        gable: nonNeg,
        color: nonNeg,
        colorPer10: nonNeg,
        wood: nonNeg,
        woodPer10: nonNeg,
        heightPer10: nonNeg,
        horizontalPanel: nonNeg,
      }),
    )
    .min(1),
  roofTypes: z.object({ rear: roofTypeConfigSchema, side: roofTypeConfigSchema, gable: roofTypeConfigSchema }),
  verticalFlashingPerHeight: nonNeg,
  unit: z.object({
    flashingPerMb: nonNeg,
    gutterPerMb: nonNeg,
    feltPerM2: nonNeg,
    tilePerM2: nonNeg,
    roofAreaFactor: pos,
    feltOverhangM: nonNeg.default(0),
    downpipePrice: nonNeg.optional(),
  }),
  gate: z.object({
    tilt: z.object({
      baseWidth: pos,
      baseHeight: pos,
      priceLow: nonNeg,
      lowMaxHeight: pos,
      priceHigh: nonNeg,
      per50cmWidth: nonNeg,
      per10cmHeight: nonNeg,
    }),
    doubleLeafExtra: nonNeg,
    automat: nonNeg,
    horizontalPanelOnGateOrDoor: nonNeg,
    sectional: z
      .object({
        widths: z.array(z.number().int().positive()).min(1),
        heights: z.array(z.number().int().positive()).min(1),
        net: z.array(z.array(z.union([nonNeg, z.null()]))),
        vatMultiplier: pos,
        marginMultiplier: pos,
        winchesterPerM2: nonNeg,
        doorInGate: nonNeg,
      })
      .refine((s) => s.net.length === s.heights.length && s.net.every((r) => r.length === s.widths.length), {
        message: 'Tabela bram segmentowych ma zły rozmiar (wiersze = wysokości, kolumny = szerokości).',
      }),
    heightRules: z.array(
      z.object({
        gates: z.array(gateTypeSchema),
        roofs: z.array(roofTypeSchema),
        minGateWidth: nonNeg.optional(),
        automat: z.boolean().optional(),
        addCm: nonNeg,
        label: z.string(),
      }),
    ),
  }),
  windows: z.object({
    w100x60: z.object({ label: z.string(), price: nonNeg, requiresHorizontalPanel: z.boolean().optional() }),
    w80x60: z.object({ label: z.string(), price: nonNeg, requiresHorizontalPanel: z.boolean().optional() }),
    w60x40: z.object({ label: z.string(), price: nonNeg, requiresHorizontalPanel: z.boolean().optional() }),
    plexi64x34: z.object({ label: z.string(), price: nonNeg, requiresHorizontalPanel: z.boolean().optional() }),
    opening: z.object({ label: z.string(), price: nonNeg, requiresHorizontalPanel: z.boolean().optional() }),
  }),
  door: nonNeg,
  extras: z.object({
    lockKowal: nonNeg,
    padlockHolder: nonNeg,
    ventGrille: nonNeg,
    anchoring: z.array(z.object({ maxWidth: pos, price: nonNeg })).min(1),
  }),
  carport: z.object({
    ratePerMbByWidth: z.record(z.string(), nonNeg),
    colorPerMb: sheetRecord,
  }),
  partitionWallPerM2: sheetRecord,
  openwork: z.object({ wallPerM2: z.object({ ral: nonNeg, wood: nonNeg }), wholeGaragePerM2: nonNeg }),
  sheetLabels: z.object({ ocynk: z.string(), ral: z.string(), wood: z.string() }),
  sandwich: z
    .object({ pricePerM3: nonNeg, panels: z.array(z.object({ key: z.string().min(1).max(50), label: z.string().min(1).max(100), pricePerM3: nonNeg })).default([]) })
    .default({ pricePerM3: 0, panels: [] }),
  custom: z.object({ pricePerM3: nonNeg, colorPerM3: z.object({ ral: nonNeg, wood: nonNeg }) }).default({ pricePerM3: 0, colorPerM3: { ral: 0, wood: 0 } }),
  structures: z.array(z.object({ key: z.string().min(1).max(50), label: z.string().min(1).max(100), pct: num })).default([]),
  currencies: z.array(z.object({ key: z.string().trim().min(1).max(20).optional(), code: z.string().trim().min(3).max(3).toUpperCase(), label: z.string().min(1).max(50), rate: pos })).default([]),
});
