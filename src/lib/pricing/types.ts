// Typy wspoldzielone przez silnik wyceny (klient + serwer), panel admina i baze.

export type SheetType = 'ocynk' | 'ral' | 'wood';
export type RoofType = 'rear' | 'side' | 'gable';
export type RoofPriceGroup = 'rear' | 'gable';
export type GateType = 'none' | 'tilt' | 'double' | 'sectional';
export type WindowType = 'w100x60' | 'w80x60' | 'w60x40' | 'plexi64x34' | 'opening';
export type OpenworkMode = 'none' | 'wall' | 'whole';

/** Wiersz tabeli bazowej z Excela (ceny w zl). */
export interface BaseTableRow {
  width: number;
  length: number;
  rear: number;
  gable: number;
  color: number;
  colorPer10: number;
  wood: number;
  woodPer10: number;
  heightPer10: number;
  horizontalPanel: number;
}

/** Wzor liniowy na metry biezace: s*szerokosc + d*dlugosc. */
export interface LinearFormula {
  s: number;
  d: number;
}

export interface RoofTypeConfig {
  label: string;
  priceGroup: RoofPriceGroup;
  gutter: LinearFormula;
  roofFlashing: LinearFormula;
}

export interface HeightRule {
  gates: GateType[];
  roofs: RoofType[];
  /** Regula obowiazuje tylko dla bramy o szerokosci > minGateWidth [m]. */
  minGateWidth?: number;
  /** Regula obowiazuje tylko gdy wybrano automat. */
  automat?: boolean;
  addCm: number;
  label: string;
}

export interface AnchoringTier {
  maxWidth: number;
  price: number;
}

export interface PriceList {
  standardHeight: number;
  heightStep: number;
  maxHeightSteps: number;
  baseTable: BaseTableRow[];
  roofTypes: Record<RoofType, RoofTypeConfig>;
  verticalFlashingPerHeight: number;
  unit: {
    flashingPerMb: number;
    gutterPerMb: number;
    feltPerM2: number;
    tilePerM2: number;
    roofAreaFactor: number;
  };
  gate: {
    tilt: {
      baseWidth: number;
      baseHeight: number;
      priceLow: number;
      lowMaxHeight: number;
      priceHigh: number;
      per50cmWidth: number;
      per10cmHeight: number;
    };
    doubleLeafExtra: number;
    automat: number;
    horizontalPanelOnGateOrDoor: number;
    sectional: {
      widths: number[];
      heights: number[];
      net: (number | null)[][];
      vatMultiplier: number;
      marginMultiplier: number;
      winchesterPerM2: number;
      doorInGate: number;
    };
    heightRules: HeightRule[];
  };
  windows: Record<WindowType, { label: string; price: number; requiresHorizontalPanel?: boolean }>;
  door: number;
  extras: {
    lockKowal: number;
    padlockHolder: number;
    ventGrille: number;
    anchoring: AnchoringTier[];
  };
  carport: {
    ratePerMbByWidth: Record<string, number>;
    colorPerMb: Record<SheetType, number>;
  };
  partitionWallPerM2: Record<SheetType, number>;
  openwork: {
    wallPerM2: Record<'ral' | 'wood', number>;
    wholeGaragePerM2: number;
  };
  sheetLabels: Record<SheetType, string>;
}

export interface GateInput {
  type: GateType;
  width: number;
  height: number;
  automat: boolean;
  horizontalPanel: boolean;
  winchester: boolean;
  doorInGate: boolean;
}

export interface QuoteInput {
  width: number;
  length: number;
  height: number;
  roofType: RoofType;
  sheet: SheetType;
  horizontalPanel: boolean;
  felt: boolean;
  tile: boolean;
  gutters: boolean;
  /** Lista bram (moze byc pusta = bez bramy). */
  gates: GateInput[];
  windows: { type: WindowType; qty: number }[];
  doors: number;
  extras: {
    lockKowal: boolean;
    anchoring: boolean;
    padlockHolder: boolean;
    ventGrilleQty: number;
  };
  carport: { enabled: boolean; width: number; length: number };
  partitionWalls: { width: number; height: number }[];
  openwork: { mode: OpenworkMode; width: number; height: number };
}

export interface LineItem {
  key: string;
  label: string;
  qty?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
  note?: string;
}

export interface QuoteResult {
  items: LineItem[];
  total: number;
  effectiveHeight: number;
  warnings: string[];
  needsManualQuote: boolean;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
}
