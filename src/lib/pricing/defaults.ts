// Domyslny cennik - zrodlo: Excel (tabela bazowa) + SkanJarek.pdf (dodatki, bramy segmentowe, notatki).
// Uzywany do seeda bazy i jako fallback, gdy w Mongo nie ma jeszcze aktywnego cennika.
import type { PriceList } from './types';
import { BASE_TABLE } from './data/base-table';
import { SECTIONAL_HEIGHTS, SECTIONAL_NET, SECTIONAL_WIDTHS } from './data/sectional';

export const DEFAULT_PRICE_LIST: PriceList = {
  standardHeight: 2.13,
  heightStep: 0.1,
  maxHeightSteps: 14,
  baseTable: BASE_TABLE,
  roofTypes: {
    rear: { label: 'Spad do tyłu', priceGroup: 'rear', gutter: { s: 1, d: 0 }, roofFlashing: { s: 1, d: 2 } },
    side: { label: 'Spad na bok', priceGroup: 'gable', gutter: { s: 0, d: 1 }, roofFlashing: { s: 2, d: 1 } },
    gable: { label: 'Dwuspadowy', priceGroup: 'gable', gutter: { s: 0, d: 2 }, roofFlashing: { s: 2, d: 1 } },
  },
  verticalFlashingPerHeight: 4,
  unit: {
    flashingPerMb: 30,
    gutterPerMb: 80,
    feltPerM2: 20,
    tilePerM2: 60,
    roofAreaFactor: 1,
    feltOverhangM: 0.3,
  },
  gate: {
    tilt: {
      baseWidth: 3,
      baseHeight: 2,
      priceLow: 900,
      lowMaxHeight: 2.2,
      priceHigh: 1000,
      // TODO: wartosci tymczasowe - do uzupelnienia w panelu
      per50cmWidth: 150,
      per10cmHeight: 50,
    },
    doubleLeafExtra: 500,
    automat: 1300,
    horizontalPanelOnGateOrDoor: 100,
    sectional: {
      widths: SECTIONAL_WIDTHS,
      heights: SECTIONAL_HEIGHTS,
      net: SECTIONAL_NET,
      vatMultiplier: 1.23,
      marginMultiplier: 1.4,
      winchesterPerM2: 20,
      doorInGate: 2700,
    },
    heightRules: [
      { gates: ['sectional'], roofs: ['side', 'gable'], addCm: 40, label: 'Brama segmentowa przy spadzie na bok / dwuspadzie' },
      { gates: ['sectional'], roofs: ['rear'], addCm: 50, label: 'Brama segmentowa przy spadzie do tyłu' },
      { gates: ['sectional'], roofs: ['rear'], minGateWidth: 4, addCm: 80, label: 'Brama segmentowa > 4 m przy spadzie do tyłu' },
      { gates: ['tilt', 'double'], roofs: ['rear'], automat: true, addCm: 20, label: 'Automat przy spadzie do tyłu' },
    ],
  },
  windows: {
    w100x60: { label: 'Okno 100×60', price: 700 },
    w80x60: { label: 'Okno 80×60', price: 600 },
    w60x40: { label: 'Okno 60×40', price: 500 },
    plexi64x34: { label: 'Okno fix (stałe przeszklenie)', price: 500, requiresHorizontalPanel: true }, // TODO: wymiary i cena do potwierdzenia przez klienta
    opening: { label: 'Otwór okienny', price: 120 },
  },
  door: 300,
  extras: {
    lockKowal: 200,
    padlockHolder: 50,
    ventGrille: 80,
    anchoring: [
      { maxWidth: 4, price: 200 },
      { maxWidth: 7, price: 300 },
      { maxWidth: 9, price: 400 },
    ],
  },
  carport: {
    ratePerMbByWidth: { '2': 1100, '3': 1200, '4': 1300, '5': 1400, '6': 1500, '7': 1600, '8': 1700 },
    colorPerMb: { ocynk: 0, ral: 20, wood: 30 },
  },
  partitionWallPerM2: { ocynk: 80, ral: 90, wood: 100 },
  openwork: {
    wallPerM2: { ral: 130, wood: 140 },
    wholeGaragePerM2: 40,
  },
  sheetLabels: { ocynk: 'Ocynk', ral: 'Kolor RAL', wood: 'Drewnopodobny' },
  // TODO: stawka tymczasowa - do ustawienia w panelu
  sandwich: { pricePerM3: 350 },
  custom: { pricePerM3: 90, colorPerM3: { ral: 20, wood: 30 } },
  // Katownik w cenie; profile zamkniete = narzut % od ceny bazowej garazu
  structures: [
    { key: 'painted30', label: 'Profil zamknięty 30×30 malowany', pct: 10 },
    { key: 'zinc30', label: 'Profil zamknięty 30×30 ocynk (od podstawy)', pct: 20 },
    { key: 'painted4060', label: 'Profil zamknięty 40×60 malowany', pct: 20 },
    { key: 'zinc4060', label: 'Profil zamknięty 40×60 ocynk', pct: 30 },
  ],
};
