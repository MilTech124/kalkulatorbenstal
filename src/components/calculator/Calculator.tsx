'use client';

import { useCallback, useMemo, useState } from 'react';
import { availableLengths, calculateQuote, emptyInput, PRODUCT_LABELS } from '@/lib/pricing/engine';
import type { PriceList, ProductType, QuoteInput } from '@/lib/pricing/types';
import { Icon } from '@/components/icons';
import { Segmented } from '@/components/ui';
import { BinSection } from './BinSection';
import { CarportAndWallsSection, DimensionsSection, ExtrasSection, GateSection, RoofAndSheetSection, WindowsDoorsSection } from './Sections';
import { MobileTotalBar, Summary } from './Summary';
import { SaveQuoteDialog } from './SaveQuoteDialog';

export function Calculator({ priceList }: { priceList: PriceList }) {
  const [input, setInput] = useState<QuoteInput>(() => emptyInput(priceList));
  const [dialogOpen, setDialogOpen] = useState(false);

  const update = useCallback((patch: Partial<QuoteInput>) => setInput((prev) => ({ ...prev, ...patch })), []);
  const result = useMemo(() => calculateQuote(input, priceList), [input, priceList]);
  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  // Reset czysci caly formularz - pytamy, bo przycisk stoi pod "Zapisz wycene".
  const reset = useCallback(() => {
    if (!confirm('Wyczyścić kalkulator i wrócić do ustawień startowych?')) return;
    setInput(emptyInput(priceList));
  }, [priceList]);

  const sectionProps = { input, pl: priceList, update };
  const productType: ProductType = input.productType ?? 'steel';

  const setProductType = (type: ProductType) => {
    if (type === 'steel') {
      // Wracajac do blaszakow dopasuj wymiary do tabeli cennika.
      const base = emptyInput(priceList);
      const widths = [...new Set(priceList.baseTable.map((r) => r.width))];
      const width = widths.includes(input.width) ? input.width : base.width;
      const lengths = availableLengths(priceList, width);
      const fromBin = input.productType === 'bin' ? { gates: base.gates, doors: 0, doorLocks: 0, openworkWalls: [] } : {};
      update({ productType: type, width, length: lengths.includes(input.length) ? input.length : lengths[0], height: base.height, ...fromBin });
    } else {
      if (type === 'bin') {
        // Wiata smietnikowa: tabela garazy, spad tyl/bok, drzwi pojedyncze w cenie, bez dodatkow garazowych.
        const base = emptyInput(priceList);
        const widths = [...new Set(priceList.baseTable.map((r) => r.width))];
        const width = widths.includes(input.width) ? input.width : base.width;
        const lengths = availableLengths(priceList, width);
        update({
          productType: type,
          customDims: false,
          width,
          length: lengths.includes(input.length) ? input.length : lengths[0],
          height: priceList.standardHeight,
          roofType: input.roofType === 'side' ? 'side' : 'rear',
          sheet: 'ocynk',
          sheetColor: undefined,
          roofSheet: undefined,
          roofColor: undefined,
          flashingSheet: undefined,
          flashingColor: undefined,
          structure: undefined,
          sheetLayout: 'v',
          horizontalPanel: false,
          felt: false,
          tile: false,
          gutters: false,
          gutterColor: undefined,
          gates: [],
          doors: 1,
          doorLocks: 0,
          doorColors: undefined,
          windows: [],
          extras: base.extras,
          carport: base.carport,
          partitionWalls: [],
          openwork: base.openwork,
          openworkWalls: [],
        });
        return;
      }
      update({ productType: type, horizontalPanel: false, felt: false, tile: false, gutters: false, sheet: 'ocynk', sheetColor: undefined, roofSheet: undefined, roofColor: undefined, flashingSheet: undefined, flashingColor: undefined, gates: input.gates.map((gate) => ({ ...gate, color: undefined })), doorColors: undefined, windows: input.windows.map((window) => ({ ...window, color: undefined })), partitionWalls: [], openwork: { ...input.openwork, mode: 'none' } });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-28 pt-6 lg:grid-cols-[1fr_360px] lg:pb-10">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Icon name="dashboard" size={18} className="text-brand-500" />
            Co wyceniamy?
          </p>
          <Segmented<ProductType>
            value={productType}
            onChange={setProductType}
            options={[
              { value: 'steel', label: PRODUCT_LABELS.steel, icon: 'home' },
              { value: 'sandwich', label: PRODUCT_LABELS.sandwich, icon: 'layers' },
              { value: 'bin', label: PRODUCT_LABELS.bin, icon: 'trashbin' },
            ]}
          />
        </section>
        {productType === 'bin' ? (
          <BinSection {...sectionProps} />
        ) : (
          <>
            <DimensionsSection {...sectionProps} />
            {productType === 'steel' && <RoofAndSheetSection {...sectionProps} />}
            <GateSection {...sectionProps} />
            <WindowsDoorsSection {...sectionProps} />
            <ExtrasSection {...sectionProps} />
            <CarportAndWallsSection {...sectionProps} />
          </>
        )}
      </div>
      <div>
        <Summary
          result={result}
          onSave={openDialog}
          onReset={reset}
          currencies={priceList.currencies ?? []}
          currency={input.currency}
          onCurrencyChange={(currency) => update({ currency: currency === 'PLN' ? undefined : currency })}
        />
      </div>
      <MobileTotalBar total={result.total} onSave={openDialog} />
      {dialogOpen && <SaveQuoteDialog open={dialogOpen} onClose={closeDialog} input={input} total={result.total} />}
    </div>
  );
}
