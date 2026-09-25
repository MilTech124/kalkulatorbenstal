'use client';

import { useCallback, useMemo, useState } from 'react';
import { availableLengths, calculateQuote, emptyInput, PRODUCT_LABELS } from '@/lib/pricing/engine';
import type { PriceList, ProductType, QuoteInput } from '@/lib/pricing/types';
import { Segmented } from '@/components/ui';
import { CarportAndWallsSection, DimensionsSection, ExtrasSection, GateSection, RoofAndSheetSection, WindowsDoorsSection } from './Sections';
import { MobileTotalBar, Summary } from './Summary';
import { SaveQuoteDialog } from './SaveQuoteDialog';

export function Calculator({ priceList, isAdmin = false }: { priceList: PriceList; isAdmin?: boolean }) {
  const [input, setInput] = useState<QuoteInput>(() => emptyInput(priceList));
  const [dialogOpen, setDialogOpen] = useState(false);

  const update = useCallback((patch: Partial<QuoteInput>) => setInput((prev) => ({ ...prev, ...patch })), []);
  const result = useMemo(() => calculateQuote(input, priceList), [input, priceList]);
  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const sectionProps = { input, pl: priceList, update };
  const productType: ProductType = input.productType ?? 'steel';

  const setProductType = (type: ProductType) => {
    if (type === 'steel') {
      // Wracajac do blaszakow dopasuj wymiary do tabeli cennika.
      const base = emptyInput(priceList);
      const widths = [...new Set(priceList.baseTable.map((r) => r.width))];
      const width = widths.includes(input.width) ? input.width : base.width;
      const lengths = availableLengths(priceList, width);
      update({ productType: type, width, length: lengths.includes(input.length) ? input.length : lengths[0], height: base.height });
    } else {
      update({ productType: type, horizontalPanel: false, felt: false, tile: false, gutters: false, sheet: 'ocynk', sheetColor: undefined, roofSheet: undefined, roofColor: undefined, flashingSheet: undefined, flashingColor: undefined, gates: input.gates.map((gate) => ({ ...gate, color: undefined })), doorColors: undefined, windows: input.windows.map((window) => ({ ...window, color: undefined })), partitionWalls: [], openwork: { ...input.openwork, mode: 'none' } });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-28 pt-6 lg:grid-cols-[1fr_360px] lg:pb-10">
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-slate-700">Co wyceniamy?</p>
          <Segmented<ProductType>
            value={productType}
            onChange={setProductType}
            options={[
              { value: 'steel', label: PRODUCT_LABELS.steel, hint: 'cennik wg wymiarów' },
              { value: 'sandwich', label: PRODUCT_LABELS.sandwich, hint: 'płyta warstwowa, cena za m³' },
              { value: 'bin', label: PRODUCT_LABELS.bin, hint: 'wkrótce' },
            ]}
          />
        </section>
        {productType === 'bin' ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Wycena wiat śmietnikowych będzie dostępna wkrótce.
          </section>
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
          currencies={priceList.currencies ?? []}
          currency={input.currency}
          onCurrencyChange={(currency) => update({ currency: currency === 'PLN' ? undefined : currency })}
        />
      </div>
      <MobileTotalBar total={result.total} onSave={openDialog} />
      <SaveQuoteDialog open={dialogOpen} onClose={closeDialog} input={input} total={result.total} isAdmin={isAdmin} />
    </div>
  );
}
