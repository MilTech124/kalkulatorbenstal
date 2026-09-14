import { describe, expect, it } from 'vitest';
import { DEFAULT_PRICE_LIST as PL } from './defaults';
import { availableLengths, calculateQuote, defaultGate, emptyInput, heightOptions, sectionalCell, sectionalPrice } from './engine';
import type { QuoteInput } from './types';

function base(overrides: Partial<QuoteInput> = {}): QuoteInput {
  const input = emptyInput(PL);
  return { ...input, gates: [], ...overrides };
}

const amount = (r: ReturnType<typeof calculateQuote>, key: string) => r.items.find((i) => i.key === key)?.amount;

describe('tabela bazowa', () => {
  it('garaż 3×5 spad do tyłu ocynk = 2980 + okucia', () => {
    const r = calculateQuote(base({ width: 3, length: 5 }), PL);
    expect(amount(r, 'base')).toBe(2980);
    // okucia pionowe 4*2.13*30 = 255.6 -> 256, okucia dachu (2*5+3)*30 = 390
    expect(amount(r, 'flashingVertical')).toBe(256);
    expect(amount(r, 'flashingRoof')).toBe(390);
    expect(r.total).toBe(2980 + 256 + 390);
  });

  it('spad na bok i dwuspadowy używają ceny dwuspadu', () => {
    expect(amount(calculateQuote(base({ width: 3, length: 5, roofType: 'side' }), PL), 'base')).toBe(3380);
    expect(amount(calculateQuote(base({ width: 3, length: 5, roofType: 'gable' }), PL), 'base')).toBe(3380);
  });

  it('długości dostępne dla szerokości 5 m zaczynają się od 5', () => {
    expect(availableLengths(PL, 5)).toEqual([5, 5.5, 6, 6.5, 7]);
    expect(heightOptions(PL)[0]).toBe(2.13);
    expect(heightOptions(PL)[1]).toBe(2.23);
  });
});

describe('okucia opcjonalne', () => {
  it('bez okuć brak pozycji okuć', () => {
    const r = calculateQuote(base({ width: 3, length: 5, flashings: false }), PL);
    expect(amount(r, 'flashingVertical')).toBeUndefined();
    expect(amount(r, 'flashingRoof')).toBeUndefined();
    expect(r.total).toBe(2980);
  });
});

describe('kolor i wysokość', () => {
  it('RAL 3×5 wys. 2,33 = kolor 650 + 2 kroki × (130 + 33)', () => {
    const r = calculateQuote(base({ width: 3, length: 5, sheet: 'ral', height: 2.33 }), PL);
    expect(amount(r, 'color')).toBe(650);
    expect(amount(r, 'height')).toBe(2 * (130 + 33));
  });

  it('drewnopodobny 3×5 wys. 2,23 = 980 + 130 + 49', () => {
    const r = calculateQuote(base({ width: 3, length: 5, sheet: 'wood', height: 2.23 }), PL);
    expect(amount(r, 'color')).toBe(980);
    expect(amount(r, 'height')).toBe(130 + 49);
  });
});

describe('rynny / filc / blachodachówka', () => {
  it('rynny: spad do tyłu = S, dwuspad = 2D', () => {
    expect(amount(calculateQuote(base({ width: 3, length: 5, gutters: true }), PL), 'gutters')).toBe(3 * 80);
    expect(amount(calculateQuote(base({ width: 3, length: 5, gutters: true, roofType: 'gable' }), PL), 'gutters')).toBe(10 * 80);
  });

  it('filc liczy garaż + wiatę, blachodachówka tylko garaż', () => {
    const r = calculateQuote(base({ width: 3, length: 5, felt: true, tile: true, carport: { enabled: true, width: 3, length: 4 } }), PL);
    // filc z wypustem 30 cm: (3+0,6)·(5+0,6) + wiata 12 m²
    expect(amount(r, 'felt')).toBe(Math.round((3.6 * 5.6 + 12) * 20));
    expect(amount(r, 'tile')).toBe(15 * 60);
    expect(amount(r, 'carport')).toBe(1200 * 4);
  });
});

describe('brama uchylna / dwuskrzydłowa', () => {
  it('pierwsza brama w cenie garażu; 3×2,3 = 0 + 3 × 50', () => {
    const r1 = calculateQuote(base({ gates: [{ ...defaultGate(), type: 'tilt', width: 3, height: 2 }] }), PL);
    expect(amount(r1, 'gate:0:base')).toBe(0);
    const r2 = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), type: 'tilt', width: 3, height: 2.3 }] }), PL);
    expect(amount(r2, 'gate:0:base')).toBe(0);
    expect(amount(r2, 'gate:0:height')).toBe(3 * 50);
  });

  it('1x brama lub drzwi w cenie, kolejne +300; segmentowa zawsze z tabeli', () => {
    const two = calculateQuote(base({ width: 6, length: 6, gates: [defaultGate(), defaultGate()], doors: 2 }), PL);
    expect(amount(two, 'gate:0:base')).toBe(0);
    expect(amount(two, 'gate:1:base')).toBe(300);
    expect(amount(two, 'doors')).toBe(600);
    const onlyDoors = calculateQuote(base({ width: 3, length: 5, doors: 2 }), PL);
    expect(amount(onlyDoors, 'doors')).toBe(300);
    const sec = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), type: 'sectional', width: 3, height: 2.5 }], doors: 1 }), PL);
    expect(amount(sec, 'gate:0:base')).toBe(Math.round(3500 * 1.23 * 1.4));
    expect(amount(sec, 'doors')).toBe(0);
  });

  it('dwuskrzydłowa 3,5×2 z automatem = 0 + 150 + 500 + 1300', () => {
    const r = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), type: 'double', width: 3.5, height: 2, automat: true }] }), PL);
    expect(amount(r, 'gate:0:base')).toBe(0);
    expect(amount(r, 'gate:0:width')).toBe(150);
    expect(amount(r, 'gate:0:double')).toBe(500);
    expect(amount(r, 'gate:0:automat')).toBe(1300);
  });

  it('automat przy spadzie do tyłu podnosi garaż o 20 cm nad bramę', () => {
    const r = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), type: 'tilt', width: 3, height: 2.2, automat: true }] }), PL);
    // wymagane 2,40 -> 3 kroki od 2,13 -> 2,43
    expect(r.effectiveHeight).toBe(2.43);
    expect(amount(r, 'height')).toBe(3 * 170);
  });
});

describe('brama segmentowa', () => {
  it('3050×2300 zaokrągla do 3100×2350 = 3330 × 1,23 × 1,4', () => {
    const cell = sectionalCell(PL, 3.05, 2.3);
    expect(cell).toEqual({ width: 3100, height: 2350, net: 3330 });
    expect(sectionalPrice(PL, 3330)).toBe(Math.round(3330 * 1.23 * 1.4));
  });

  it('rozmiar poza tabelą = wycena indywidualna', () => {
    const r = calculateQuote(base({ width: 7, length: 7, gates: [{ ...defaultGate(), type: 'sectional', width: 5.5, height: 3 }] }), PL);
    expect(r.needsManualQuote).toBe(true);
    expect(amount(r, 'gate:0:base')).toBe(0);
  });

  it('segmentówka 2,5 m przy spadzie do tyłu wymusza wysokość 3,03 (2,5 + 0,5 -> 9 kroków)', () => {
    const r = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), type: 'sectional', width: 3, height: 2.5 }] }), PL);
    expect(r.effectiveHeight).toBe(3.03);
    expect(amount(r, 'height')).toBe(9 * 170);
    expect(amount(r, 'gate:0:base')).toBe(Math.round(3500 * 1.23 * 1.4));
  });

  it('segmentówka > 4 m przy spadzie do tyłu: +80 cm; przy dwuspadzie +40 cm', () => {
    const g = { ...defaultGate(), type: 'sectional' as const, width: 4.5, height: 2.02 };
    expect(calculateQuote(base({ width: 6, length: 6, gates: [g] }), PL).effectiveHeight).toBe(2.83);
    expect(calculateQuote(base({ width: 6, length: 6, gates: [g], roofType: 'gable' }), PL).effectiveHeight).toBe(2.43);
  });
});

describe('kilka bram', () => {
  it('dwie bramy: każda wyceniona osobno, wysokość wg najwyższej wymaganej', () => {
    const r = calculateQuote(
      base({
        width: 7,
        length: 6,
        gates: [
          { ...defaultGate(), type: 'tilt', width: 2.5, height: 2 },
          { ...defaultGate(), type: 'sectional', width: 3, height: 2.5 },
        ],
      }),
      PL,
    );
    expect(amount(r, 'gate:0:base')).toBe(0);
    expect(amount(r, 'gate:1:base')).toBe(Math.round(3500 * 1.23 * 1.4));
    expect(r.effectiveHeight).toBe(3.03);
    expect(r.items.find((i) => i.key === 'gate:1:base')?.label).toMatch(/^Brama 2: /);
  });

  it('łączna szerokość bram >= szerokość garażu daje ostrzeżenie', () => {
    const r = calculateQuote(base({ width: 5, length: 5, gates: [{ ...defaultGate(), width: 2.5 }, { ...defaultGate(), width: 2.5 }] }), PL);
    expect(r.warnings.some((w) => w.includes('Łączna szerokość'))).toBe(true);
  });
});

describe('okna, drzwi, dodatki', () => {
  it('okno pleksa wymusza poziomy panel', () => {
    const r = calculateQuote(base({ width: 3, length: 5, windows: [{ type: 'plexi64x34', qty: 1 }], doors: 1 }), PL);
    expect(amount(r, 'horizontalPanel')).toBe(600);
    expect(amount(r, 'window:plexi64x34')).toBe(500);
    expect(amount(r, 'doors')).toBe(0);
    expect(amount(r, 'doorsPanel')).toBe(100);
  });

  it('kotwiczenie 6×6 = 300', () => {
    const r = calculateQuote(base({ width: 6, length: 6, extras: { lockKowal: true, anchoring: true, padlockHolder: false, ventGrilleQty: 2 } }), PL);
    expect(amount(r, 'anchoring')).toBe(300);
    expect(amount(r, 'lockKowal')).toBe(200);
    expect(amount(r, 'ventGrille')).toBe(160);
  });

  it('ściana działowa i ażury', () => {
    const r = calculateQuote(base({ width: 3, length: 5, sheet: 'ral', partitionWalls: [{ width: 3, height: 2 }], openwork: { mode: 'whole', width: 0, height: 0 } }), PL);
    expect(amount(r, 'partitionWall:0')).toBe(6 * 90);
    expect(amount(r, 'openworkWhole')).toBe(Math.round(16 * 2.13 * 40));
  });
});

describe('garaże warstwowe', () => {
  it('cena bazowa = S × D × H × stawka, bez dopłat z tabeli', () => {
    const r = calculateQuote(base({ productType: 'sandwich', width: 4.5, length: 7, height: 2.5, sheet: 'ral', horizontalPanel: true, gutters: true }), PL);
    expect(amount(r, 'base')).toBe(Math.round(4.5 * 7 * 2.5 * PL.sandwich.pricePerM3));
    expect(amount(r, 'color')).toBeUndefined();
    expect(amount(r, 'horizontalPanel')).toBeUndefined();
    expect(amount(r, 'height')).toBeUndefined();
    expect(amount(r, 'gutters')).toBeUndefined();
    expect(amount(r, 'flashingRoof')).toBeUndefined();
  });

  it('brama segmentowa podnosi wysokość garażu warstwowego (liczona w kubaturze)', () => {
    const r = calculateQuote(base({ productType: 'sandwich', width: 4, length: 6, height: 2.2, gates: [{ ...defaultGate(), type: 'sectional', width: 3, height: 2.5 }] }), PL);
    // bez zapasu z regul dachowych: 2,5 m -> 4 kroki od 2,13 -> 2,53
    expect(r.effectiveHeight).toBe(2.53);
    expect(amount(r, 'base')).toBe(Math.round(4 * 6 * 2.53 * PL.sandwich.pricePerM3));
  });

  it('wiaty śmietnikowe: jeszcze bez wyceny', () => {
    const r = calculateQuote(base({ productType: 'bin' }), PL);
    expect(r.total).toBe(0);
    expect(r.needsManualQuote).toBe(true);
  });
});

describe('uwagi klienta 11.09', () => {
  it('filc: powierzchnia z wypustem 30 cm na stronę', () => {
    const r = calculateQuote(base({ width: 3, length: 5, felt: true }), PL);
    expect(amount(r, 'felt')).toBe(Math.round(3.6 * 5.6 * 20));
  });

  it('konstrukcja: profil 30×30 malowany = +10% ceny bazowej', () => {
    expect(amount(calculateQuote(base({ width: 3, length: 5, structure: 'painted30' }), PL), 'structure')).toBe(298);
    expect(amount(calculateQuote(base({ width: 3, length: 5, structure: 'zinc4060' }), PL), 'structure')).toBe(894);
  });

  it('garaż spoza cennika: a×b×h × 90 + kolor za m³, bez dopłat tabelowych', () => {
    const r = calculateQuote(base({ customDims: true, width: 4.2, length: 8, height: 2.5, sheet: 'wood', horizontalPanel: true }), PL);
    const m3 = 4.2 * 8 * 2.5;
    expect(amount(r, 'base')).toBe(Math.round(m3 * 90));
    expect(amount(r, 'color')).toBe(Math.round(m3 * 30));
    expect(amount(r, 'horizontalPanel')).toBeUndefined();
    expect(amount(r, 'height')).toBeUndefined();
    expect(amount(r, 'flashingRoof')).toBe((2 * 8 + 4.2) * 30);
  });

  it('zamek kowal: przy bramie i w drzwiach, 200 zł/szt.', () => {
    const r = calculateQuote(base({ width: 4, length: 5, gates: [{ ...defaultGate(), lockKowal: true }], doors: 2, doorLocks: 5 }), PL);
    expect(amount(r, 'gate:0:lock')).toBe(200);
    expect(amount(r, 'doorLocks')).toBe(400);
  });
});
