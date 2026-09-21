// Typy wspoldzielone przez silnik wyceny (klient + serwer), panel admina i baze.

export type ProductType = 'steel' | 'sandwich' | 'bin';
export type SheetType = 'ocynk' | 'ral' | 'wood';
export type RoofType = 'rear' | 'side' | 'gable';
export type RoofPriceGroup = 'rear' | 'gable';
export type GateType = 'none' | 'tilt' | 'double' | 'sectional';
export type WindowType = 'w100x60' | 'w80x60' | 'w60x40' | 'plexi64x34' | 'opening';
export type OpenworkMode = 'none' | 'wall' | 'whole';
/** Ulozenie blachy: pionowo (w cenie), poziomo (doplata), pionowo szeroka (doplata), poziomo szeroka (doplata x2). */
export type SheetLayout = 'v' | 'h' | 'vWide' | 'hWide';

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
  /** Liczba rur spustowych (spad: 1, dwuspad: 2). */
  downpipes?: number;
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

/** Rodzaj konstrukcji: katownik w cenie, inne profile = narzut % od ceny bazowej garazu. */
export interface StructureOption {
  key: string;
  label: string;
  pct: number;
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
    /** Wypust filcu poza obrys garazu na kazda strone [m] (np. 0,3). */
    feltOverhangM: number;
    /** Rura spustowa [zl/szt.] (doliczana przy rynnach). */
    downpipePrice?: number;
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
  /** Garaze warstwowe (plyta warstwowa): cena bazowa = szer. x dl. x wys. x stawka. */
  sandwich: {
    /** Stara stawka (fallback, gdy brak listy plyt). */
    pricePerM3: number;
    /** Rodzaje plyty warstwowej do wyboru: stawka za m3. */
    panels: { key: string; label: string; pricePerM3: number }[];
  };
  /** Garaze blaszane spoza tabeli: a x b x h (w najwyzszym punkcie) x stawka + kolor za m3. */
  custom: {
    pricePerM3: number;
    colorPerM3: Record<'ral' | 'wood', number>;
  };
  structures: StructureOption[];
  /** Waluty do wyboru przy wycenie (kurs = ile PLN za 1 jednostke). */
  currencies: { key?: string; code: string; label: string; rate: number }[];
}

export interface GateInput {
  type: GateType;
  /** Kolor bramy z palety wybranego rodzaju blachy; brak = kolor poszycia garażu. */
  color?: string;
  width: number;
  height: number;
  automat: boolean;
  horizontalPanel: boolean;
  winchester: boolean;
  doorInGate: boolean;
  /** Zamek kowal (klamka) w tej bramie. */
  lockKowal?: boolean;
}

export interface QuoteInput {
  /** Rodzaj produktu; brak = garaz blaszany (stare wyceny). */
  productType?: ProductType;
  /** Blaszak o wymiarach spoza tabeli - liczony z m3 (custom). */
  customDims?: boolean;
  /** Klucz z PriceList.structures; brak = katownik (w cenie). */
  structure?: string;
  /** Garaz warstwowy: klucz plyty z PriceList.sandwich.panels; brak = pierwsza. */
  sandwichPanel?: string;
  width: number;
  length: number;
  height: number;
  roofType: RoofType;
  sheet: SheetType;
  /** Kolor poszycia; brak w starszych wycenach oznacza pierwszy kolor danej palety. */
  sheetColor?: string;
  /** Kolor okuć dachowych i narożnych; brak = kolor poszycia. */
  flashingColor?: string;
  /** Zachowane dla zgodnosci: true = blacha w poziomie (h/hWide). Zrodlem prawdy jest sheetLayout, gdy ustawione. */
  horizontalPanel: boolean;
  sheetLayout?: SheetLayout;
  felt: boolean;
  /** Okucia (pionowe + dachu); brak pola = tak (stare wyceny). */
  flashings?: boolean;
  tile: boolean;
  gutters: boolean;
  /** Lista bram (moze byc pusta = bez bramy). */
  gates: GateInput[];
  windows: { type: WindowType; qty: number; color?: string }[];
  doors: number;
  /** Kolory kolejnych drzwi; brak pozycji = kolor poszycia garażu. */
  doorColors?: string[];
  /** Liczba drzwi z zamkiem kowal. */
  doorLocks?: number;
  /** Waluta prezentacji ceny (klucz pozycji z PriceList.currencies); brak = PLN. */
  currency?: string;
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
  street: string;
  postalCode: string;
  city: string;
  /** Adres jednym ciagiem (stare wyceny); nowe zapisy skladaja go z ulicy/kodu/miasta. */
  address?: string;
}
