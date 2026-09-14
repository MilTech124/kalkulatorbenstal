// Silnik wyceny - czysta funkcja bez zaleznosci od React/Mongo.
// Uzywany na kliencie (cena na zywo) i na serwerze (przeliczenie przy zapisie wyceny).
import type {
  BaseTableRow,
  GateInput,
  GateType,
  LineItem,
  ProductType,
  PriceList,
  QuoteInput,
  QuoteResult,
  RoofType,
  SheetType,
} from './types';

const cm = (m: number) => Math.round(m * 100);
const money = (v: number) => Math.round(v);

export function findBaseRow(pl: PriceList, width: number, length: number): BaseTableRow | undefined {
  return pl.baseTable.find((r) => r.width === width && r.length === length);
}

export function availableWidths(pl: PriceList): number[] {
  return [...new Set(pl.baseTable.map((r) => r.width))].sort((a, b) => a - b);
}

export function availableLengths(pl: PriceList, width: number): number[] {
  return pl.baseTable
    .filter((r) => r.width === width)
    .map((r) => r.length)
    .sort((a, b) => a - b);
}

export function heightOptions(pl: PriceList): number[] {
  const out: number[] = [];
  for (let i = 0; i <= pl.maxHeightSteps; i++) {
    out.push((cm(pl.standardHeight) + i * cm(pl.heightStep)) / 100);
  }
  return out;
}

/** Liczba rozpoczetych krokow (np. 10 cm) powyzej wysokosci standardowej. */
export function heightSteps(pl: PriceList, height: number): number {
  const diff = cm(height) - cm(pl.standardHeight);
  if (diff <= 0) return 0;
  return Math.ceil(diff / cm(pl.heightStep));
}

/** Wymagany zapas wysokosci garazu ponad wysokosc bramy [cm] - max z pasujacych regul. */
export function gateClearanceCm(
  pl: PriceList,
  gate: GateInput,
  roofType: RoofType,
): { cm: number; label?: string } {
  if (gate.type === 'none') return { cm: 0 };
  let best: { cm: number; label?: string } = { cm: 0 };
  for (const rule of pl.gate.heightRules) {
    if (!rule.gates.includes(gate.type)) continue;
    if (!rule.roofs.includes(roofType)) continue;
    if (rule.minGateWidth !== undefined && !(gate.width > rule.minGateWidth)) continue;
    if (rule.automat !== undefined && rule.automat !== gate.automat) continue;
    if (rule.addCm > best.cm) best = { cm: rule.addCm, label: rule.label };
  }
  return best;
}

/** Zaokragla wymiar bramy segmentowej w gore do najblizszego rozmiaru z tabeli. */
export function sectionalCell(pl: PriceList, widthM: number, heightM: number) {
  const { widths, heights, net } = pl.gate.sectional;
  const wMm = Math.round(widthM * 1000);
  const hMm = Math.round(heightM * 1000);
  const wi = widths.findIndex((w) => w >= wMm);
  const hi = heights.findIndex((h) => h >= hMm);
  if (wi < 0 || hi < 0) return null;
  const value = net[hi]?.[wi] ?? null;
  return { width: widths[wi], height: heights[hi], net: value };
}

export function sectionalPrice(pl: PriceList, net: number): number {
  const { vatMultiplier, marginMultiplier } = pl.gate.sectional;
  return money(net * vatMultiplier * marginMultiplier);
}

function linear(f: { s: number; d: number }, width: number, length: number): number {
  return f.s * width + f.d * length;
}

function fmt(n: number): string {
  return n.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
}

export function calculateQuote(input: QuoteInput, pl: PriceList): QuoteResult {
  const items: LineItem[] = [];
  const warnings: string[] = [];
  let needsManualQuote = false;
  const push = (item: LineItem) => items.push({ ...item, amount: money(item.amount) });

  const { width: S, length: D, roofType, sheet } = input;
  const productType = input.productType ?? 'steel';
  const roof = pl.roofTypes[roofType];

  if (productType === 'bin') {
    warnings.push('Wiaty śmietnikowe – wycena wkrótce.');
    return { items, total: 0, effectiveHeight: input.height, warnings, needsManualQuote: true };
  }

  // Garaz warstwowy nie korzysta z tabeli bazowej (blaszaki); dopłaty z tabeli (kolor, panel, +10 cm) nie obowiazuja.
  // Blaszak spoza tabeli (customDims) liczony z m3 jak "garaze spoza cennika".
  const customSteel = productType === 'steel' && Boolean(input.customDims);
  const row = productType === 'steel' && !customSteel ? findBaseRow(pl, S, D) : undefined;
  if (productType === 'steel' && !customSteel && !row) {
    warnings.push(`Brak w cenniku garażu ${fmt(S)} × ${fmt(D)} m.`);
    return { items, total: 0, effectiveHeight: input.height, warnings, needsManualQuote: true };
  }

  // 1. Garaz bazowy
  if (row) {
    push({
      key: 'base',
      label: `Garaż ${fmt(S)} × ${fmt(D)} m, ${roof.label.toLowerCase()}`,
      amount: roof.priceGroup === 'rear' ? row.rear : row.gable,
    });
  }

  // 2. Wymagana wysokosc (najwyzsza z bram moze wymusic podwyzszenie)
  const gates = input.gates.filter((g) => g.type !== 'none');
  let effectiveHeight = input.height;
  let heightNote: string | undefined;
  let requiredCm = 0;
  let requiredLabel: string | undefined;
  let requiredAdd = 0;
  for (const gate of gates) {
    // Garaz warstwowy nie ma wyboru dachu - wymagana wysokosc = wysokosc bramy (bez zapasu z regul).
    const clearance = productType === 'steel' ? gateClearanceCm(pl, gate, roofType) : { cm: 0 };
    const needed = cm(gate.height) + clearance.cm;
    if (needed > requiredCm) {
      requiredCm = needed;
      requiredLabel = clearance.label;
      requiredAdd = clearance.cm;
    }
    if (gate.width >= S) warnings.push(`Brama ${fmt(gate.width)} m jest szersza lub równa szerokości garażu.`);
  }
  if (requiredCm > cm(effectiveHeight)) {
    const steps = heightSteps(pl, requiredCm / 100);
    effectiveHeight = (cm(pl.standardHeight) + steps * cm(pl.heightStep)) / 100;
    heightNote = `Podwyższono do ${fmt(effectiveHeight)} m: ${requiredLabel ?? 'wysokość bramy'} (+${requiredAdd} cm nad bramą).`;
  }
  const gatesWidth = gates.reduce((sum, g) => sum + g.width, 0);
  if (gates.length > 1 && gatesWidth >= S) warnings.push('Łączna szerokość bram jest większa lub równa szerokości garażu.');

  // 1b. Garaz warstwowy: kubatura x stawka (po ustaleniu wysokosci efektywnej)
  if (productType === 'sandwich') {
    const m3 = S * D * effectiveHeight;
    const rate = pl.sandwich?.pricePerM3 ?? 0;
    if (rate <= 0) {
      warnings.push('Brak stawki za m³ dla garaży warstwowych – ustaw ją w panelu.');
      needsManualQuote = true;
    }
    push({
      key: 'base',
      label: `Garaż warstwowy ${fmt(S)} × ${fmt(D)} × ${fmt(effectiveHeight)} m`,
      qty: m3,
      unit: 'm³',
      unitPrice: rate,
      amount: m3 * rate,
      note: heightNote,
    });
  }

  // 1c. Blaszak spoza cennika: a x b x h (najwyzszy punkt) x stawka + kolor za m3
  if (customSteel) {
    const m3 = S * D * effectiveHeight;
    const rate = pl.custom?.pricePerM3 ?? 0;
    if (rate <= 0) {
      warnings.push('Brak stawki za m³ dla garaży spoza cennika – ustaw ją w panelu.');
      needsManualQuote = true;
    }
    push({
      key: 'base',
      label: `Garaż ${fmt(S)} × ${fmt(D)} × ${fmt(effectiveHeight)} m (spoza cennika), ${roof.label.toLowerCase()}`,
      qty: m3,
      unit: 'm³',
      unitPrice: rate,
      amount: m3 * rate,
      note: heightNote,
    });
    const colorRate = sheet === 'ral' ? (pl.custom?.colorPerM3.ral ?? 0) : sheet === 'wood' ? (pl.custom?.colorPerM3.wood ?? 0) : 0;
    if (colorRate) {
      push({ key: 'color', label: sheet === 'ral' ? 'Blacha w kolorze RAL' : 'Blacha drewnopodobna', qty: m3, unit: 'm³', unitPrice: colorRate, amount: m3 * colorRate });
    }
  }

  // 1d. Konstrukcja: katownik w cenie, inne profile = % od ceny bazowej garazu
  if (productType === 'steel' && input.structure) {
    const opt = pl.structures?.find((o) => o.key === input.structure);
    const baseAmount = items.find((i) => i.key === 'base')?.amount ?? 0;
    if (opt && opt.pct !== 0) {
      push({ key: 'structure', label: `Konstrukcja: ${opt.label} (${opt.pct > 0 ? '+' : ''}${fmt(opt.pct)}%)`, amount: (baseAmount * opt.pct) / 100 });
    }
  }

  // 3. Podwyzszenie (tylko blaszaki - z tabeli)
  const steps = heightSteps(pl, effectiveHeight);
  if (row && steps > pl.maxHeightSteps) warnings.push(`Wysokość ${fmt(effectiveHeight)} m przekracza maksymalną z cennika.`);
  if (row && steps > 0) {
    const per = row.heightPer10 + (sheet === 'ral' ? row.colorPer10 : sheet === 'wood' ? row.woodPer10 : 0);
    push({
      key: 'height',
      label: `Podwyższenie do ${fmt(effectiveHeight)} m`,
      qty: steps,
      unit: `× ${Math.round(pl.heightStep * 100)} cm`,
      unitPrice: per,
      amount: steps * per,
      note: heightNote,
    });
  } else if (row && heightNote) {
    warnings.push(heightNote);
  }

  // 4. Kolor
  if (row && sheet === 'ral') push({ key: 'color', label: 'Blacha w kolorze RAL', amount: row.color });
  if (row && sheet === 'wood') push({ key: 'color', label: 'Blacha drewnopodobna', amount: row.wood });

  // 5. Poziomy panel (wymuszany przez okno fix)
  const plexiSelected = input.windows.some((w) => w.qty > 0 && pl.windows[w.type]?.requiresHorizontalPanel);
  const horizontalPanel = input.horizontalPanel || plexiSelected;
  if (row && horizontalPanel) {
    push({
      key: 'horizontalPanel',
      label: 'Poziomy panel blachy',
      amount: row.horizontalPanel,
      note: !input.horizontalPanel && plexiSelected ? 'Wymagany przez okno fix (stałe przeszklenie).' : undefined,
    });
  }

  // 6-8. Elementy dachu i blachy - tylko garaze blaszane
  if (productType === 'steel') {
    // 6. Okucia (opcjonalne; brak pola = tak)
    const flashings = input.flashings ?? true;
    const vertMb = pl.verticalFlashingPerHeight * effectiveHeight;
    if (flashings) push({
      key: 'flashingVertical',
      label: 'Okucia pionowe',
      qty: vertMb,
      unit: 'mb',
      unitPrice: pl.unit.flashingPerMb,
      amount: vertMb * pl.unit.flashingPerMb,
    });
    const roofMb = linear(roof.roofFlashing, S, D);
    if (flashings) push({
      key: 'flashingRoof',
      label: 'Okucia dachu',
      qty: roofMb,
      unit: 'mb',
      unitPrice: pl.unit.flashingPerMb,
      amount: roofMb * pl.unit.flashingPerMb,
    });

    // 7. Rynny
    if (input.gutters) {
      const mb = linear(roof.gutter, S, D);
      push({ key: 'gutters', label: 'Rynny', qty: mb, unit: 'mb', unitPrice: pl.unit.gutterPerMb, amount: mb * pl.unit.gutterPerMb });
    }

    // 8. Filc / blachodachowka
    const garageArea = S * D * pl.unit.roofAreaFactor;
    const carportArea = input.carport.enabled ? input.carport.width * input.carport.length : 0;
    if (input.felt) {
      // Filc: powierzchnia dachu z wypustem na kazda strone (np. +30 cm) + wiata
      const o = pl.unit.feltOverhangM ?? 0;
      const m2 = (S + 2 * o) * (D + 2 * o) * pl.unit.roofAreaFactor + carportArea;
      push({
        key: 'felt',
        label: carportArea ? 'Filc (garaż + wiata)' : 'Filc',
        qty: m2,
        unit: 'm²',
        unitPrice: pl.unit.feltPerM2,
        amount: m2 * pl.unit.feltPerM2,
      });
    }
    if (input.tile) {
      push({
        key: 'tile',
        label: 'Blachodachówka',
        qty: garageArea,
        unit: 'm²',
        unitPrice: pl.unit.tilePerM2,
        amount: garageArea * pl.unit.tilePerM2,
      });
    }

  }

  // 9. Bramy
  // W cenie garazu jest 1x brama (uchylna/dwuskrzydlowa) LUB 1x drzwi; kazde kolejne = pl.door. Segmentowa zawsze z tabeli.
  let includedOpeningUsed = false;
  gates.forEach((gate, gi) => {
    const k = (key: string) => `gate:${gi}:${key}`;
    const prefix = gates.length > 1 ? `Brama ${gi + 1}: ` : '';
    if (gate.type === 'tilt' || gate.type === 'double') {
      const t = pl.gate.tilt;
      const included = !includedOpeningUsed;
      includedOpeningUsed = true;
      const label = gate.type === 'tilt' ? 'uchylna' : 'dwuskrzydłowa';
      push({
        key: k('base'),
        label: `${prefix}Brama ${label} ${fmt(gate.width)} × ${fmt(gate.height)} m`,
        amount: included ? 0 : pl.door,
        note: included ? 'W cenie garażu' : 'Dodatkowa brama',
      });
      const w50 = Math.max(0, Math.ceil((cm(gate.width) - cm(t.baseWidth)) / 50));
      if (w50 > 0) {
        push({ key: k('width'), label: `${prefix}dodatkowa szerokość`, qty: w50, unit: '× 50 cm', unitPrice: t.per50cmWidth, amount: w50 * t.per50cmWidth });
      }
      const h10 = Math.max(0, Math.ceil((cm(gate.height) - cm(t.baseHeight)) / 10));
      if (h10 > 0) {
        push({ key: k('height'), label: `${prefix}dodatkowa wysokość`, qty: h10, unit: '× 10 cm', unitPrice: t.per10cmHeight, amount: h10 * t.per10cmHeight });
      }
      if (gate.type === 'double') push({ key: k('double'), label: `${prefix}dopłata: dwuskrzydłowa`, amount: pl.gate.doubleLeafExtra });
      if (gate.automat) push({ key: k('automat'), label: `${prefix}automat do bramy`, amount: pl.gate.automat });
      if (horizontalPanel && gate.horizontalPanel) {
        push({ key: k('panel'), label: `${prefix}poziomy panel na bramie`, amount: pl.gate.horizontalPanelOnGateOrDoor });
      }
    } else if (gate.type === 'sectional') {
      const cell = sectionalCell(pl, gate.width, gate.height);
      if (!cell || cell.net === null) {
        needsManualQuote = true;
        warnings.push(`Brama segmentowa ${fmt(gate.width)} × ${fmt(gate.height)} m – rozmiar poza cennikiem, wycena indywidualna.`);
        push({ key: k('base'), label: `${prefix}Brama segmentowa ${fmt(gate.width)} × ${fmt(gate.height)} m`, amount: 0, note: 'Wycena indywidualna' });
      } else {
        const rounded = cell.width !== Math.round(gate.width * 1000) || cell.height !== Math.round(gate.height * 1000);
        push({
          key: k('base'),
          label: `${prefix}Brama segmentowa ${fmt(gate.width)} × ${fmt(gate.height)} m (z automatem)`,
          amount: sectionalPrice(pl, cell.net),
          note: rounded ? `Przyjęto rozmiar ${cell.width} × ${cell.height} mm z cennika.` : undefined,
        });
        if (gate.winchester) {
          const m2 = gate.width * gate.height;
          push({
            key: k('winchester'),
            label: `${prefix}kolor winchester`,
            qty: m2,
            unit: 'm²',
            unitPrice: sectionalPrice(pl, pl.gate.sectional.winchesterPerM2),
            amount: sectionalPrice(pl, m2 * pl.gate.sectional.winchesterPerM2),
          });
        }
        if (gate.doorInGate) push({ key: k('door'), label: `${prefix}drzwi w bramie segmentowej`, amount: pl.gate.sectional.doorInGate });
      }
    }
    if (gate.lockKowal) push({ key: k('lock'), label: `${prefix}zamek kowal (klamka)`, amount: pl.extras.lockKowal });
  });

  // 10. Okna i drzwi
  for (const w of input.windows) {
    const def = pl.windows[w.type];
    if (!def || w.qty <= 0) continue;
    push({ key: `window:${w.type}`, label: def.label, qty: w.qty, unit: 'szt.', unitPrice: def.price, amount: w.qty * def.price });
  }
  if (input.doors > 0) {
    const paidDoors = includedOpeningUsed ? input.doors : input.doors - 1;
    push({
      key: 'doors',
      label: 'Drzwi',
      qty: input.doors,
      unit: 'szt.',
      unitPrice: pl.door,
      amount: paidDoors * pl.door,
      note: includedOpeningUsed ? 'Dodatkowe drzwi' : '1 szt. w cenie garażu',
    });
    includedOpeningUsed = true;
    const locks = Math.min(input.doorLocks ?? 0, input.doors);
    if (locks > 0) push({ key: 'doorLocks', label: 'Zamek kowal (klamka) w drzwiach', qty: locks, unit: 'szt.', unitPrice: pl.extras.lockKowal, amount: locks * pl.extras.lockKowal });
    if (horizontalPanel) {
      push({
        key: 'doorsPanel',
        label: 'Poziomy panel na drzwiach',
        qty: input.doors,
        unit: 'szt.',
        unitPrice: pl.gate.horizontalPanelOnGateOrDoor,
        amount: input.doors * pl.gate.horizontalPanelOnGateOrDoor,
      });
    }
  }

  // 11. Dodatki
  // Stare wyceny: globalny zamek kowal (obecnie zaznaczany przy bramie/drzwiach)
  if (input.extras.lockKowal) push({ key: 'lockKowal', label: 'Zamek kowal', amount: pl.extras.lockKowal });
  if (input.extras.padlockHolder) push({ key: 'padlockHolder', label: 'Uchwyt na kłódkę', amount: pl.extras.padlockHolder });
  if (input.extras.ventGrilleQty > 0) {
    push({
      key: 'ventGrille',
      label: 'Kratka wentylacyjna 14×21',
      qty: input.extras.ventGrilleQty,
      unit: 'szt.',
      unitPrice: pl.extras.ventGrille,
      amount: input.extras.ventGrilleQty * pl.extras.ventGrille,
    });
  }
  if (input.extras.anchoring) {
    const tiers = [...pl.extras.anchoring].sort((a, b) => a.maxWidth - b.maxWidth);
    const tier = tiers.find((t) => S <= t.maxWidth) ?? tiers[tiers.length - 1];
    if (tier) push({ key: 'anchoring', label: `Kotwiczenie (do ${fmt(tier.maxWidth)} m szer.)`, amount: tier.price });
  }

  // 12. Wiata
  if (input.carport.enabled && input.carport.length > 0) {
    const rate = pl.carport.ratePerMbByWidth[String(input.carport.width)];
    if (rate === undefined) {
      warnings.push(`Brak w cenniku wiaty o szerokości ${fmt(input.carport.width)} m.`);
      needsManualQuote = true;
    } else {
      push({
        key: 'carport',
        label: `Wiata ${fmt(input.carport.width)} × ${fmt(input.carport.length)} m`,
        qty: input.carport.length,
        unit: 'mb',
        unitPrice: rate,
        amount: rate * input.carport.length,
      });
      const colorRate = pl.carport.colorPerMb[sheet] ?? 0;
      if (colorRate > 0) {
        push({
          key: 'carportColor',
          label: `Wiata – ${pl.sheetLabels[sheet].toLowerCase()}`,
          qty: input.carport.length,
          unit: 'mb',
          unitPrice: colorRate,
          amount: colorRate * input.carport.length,
        });
      }
    }
  }

  // 13-14. Sciany dzialowe i azury - tylko garaze blaszane
  if (productType === 'steel') {
    // 13. Sciany dzialowe
    input.partitionWalls.forEach((wall, i) => {
      if (wall.width <= 0 || wall.height <= 0) return;
      const m2 = wall.width * wall.height;
      const rate = pl.partitionWallPerM2[sheet];
      push({
        key: `partitionWall:${i}`,
        label: `Ściana działowa ${fmt(wall.width)} × ${fmt(wall.height)} m`,
        qty: m2,
        unit: 'm²',
        unitPrice: rate,
        amount: m2 * rate,
      });
    });

    // 14. Azury
    if (input.openwork.mode === 'wall' && input.openwork.width > 0 && input.openwork.height > 0) {
      const m2 = input.openwork.width * input.openwork.height;
      const rateSheet: 'ral' | 'wood' = sheet === 'wood' ? 'wood' : 'ral';
      if (sheet === 'ocynk') warnings.push('Ażury dostępne tylko w RAL / drewnopodobnym – przyjęto cenę RAL.');
      const rate = pl.openwork.wallPerM2[rateSheet];
      push({
        key: 'openworkWall',
        label: `Ściana ażurowa ${fmt(input.openwork.width)} × ${fmt(input.openwork.height)} m`,
        qty: m2,
        unit: 'm²',
        unitPrice: rate,
        amount: m2 * rate,
      });
    } else if (input.openwork.mode === 'whole') {
      const m2 = (2 * S + 2 * D) * effectiveHeight;
      push({
        key: 'openworkWhole',
        label: 'Cały garaż w ażurach',
        qty: m2,
        unit: 'm²',
        unitPrice: pl.openwork.wholeGaragePerM2,
        amount: m2 * pl.openwork.wholeGaragePerM2,
      });
    }

  }

  const total = money(items.reduce((sum, it) => sum + it.amount, 0));
  return { items, total, effectiveHeight, warnings, needsManualQuote };
}

export function emptyInput(pl: PriceList): QuoteInput {
  const width = 3;
  const lengths = availableLengths(pl, width);
  return {
    productType: 'steel',
    width,
    length: lengths.includes(5) ? 5 : lengths[0],
    height: pl.standardHeight,
    roofType: 'rear',
    sheet: 'ocynk',
    horizontalPanel: false,
    felt: false,
    flashings: true,
    tile: false,
    gutters: false,
    gates: [defaultGate()],
    windows: [],
    doors: 0,
    extras: { lockKowal: false, anchoring: false, padlockHolder: false, ventGrilleQty: 0 },
    carport: { enabled: false, width: 3, length: 3 },
    partitionWalls: [],
    openwork: { mode: 'none', width: 3, height: 2 },
  };
}

/** Ujednolica wejscie zapisane w starszym formacie (pojedyncze pole `gate`). */
export function normalizeInput(raw: QuoteInput & { gate?: GateInput }): QuoteInput {
  if (Array.isArray(raw.gates)) return raw;
  const gates = raw.gate && raw.gate.type !== 'none' ? [raw.gate] : [];
  return { ...raw, gates };
}

export function defaultGate(): GateInput {
  return { type: 'tilt', width: 2.5, height: 2, automat: false, horizontalPanel: false, winchester: false, doorInGate: false };
}

export const GATE_LABELS: Record<GateType, string> = {
  none: 'Bez bramy',
  tilt: 'Uchylna',
  double: 'Dwuskrzydłowa',
  sectional: 'Segmentowa (z automatem)',
};

export const SHEET_ORDER: SheetType[] = ['ocynk', 'ral', 'wood'];

export const PRODUCT_LABELS: Record<ProductType, string> = {
  steel: 'Garaże blaszane',
  sandwich: 'Garaże warstwowe',
  bin: 'Wiaty śmietnikowe',
};
