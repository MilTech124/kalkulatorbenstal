'use client';

import { useCallback, useMemo, useState } from 'react';
import { calculateQuote, emptyInput } from '@/lib/pricing/engine';
import type { PriceList, QuoteInput } from '@/lib/pricing/types';
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

  const sectionProps = { input, pl: priceList, update };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-28 pt-6 lg:grid-cols-[1fr_360px] lg:pb-10">
      <div className="space-y-5">
        <DimensionsSection {...sectionProps} />
        <RoofAndSheetSection {...sectionProps} />
        <GateSection {...sectionProps} />
        <WindowsDoorsSection {...sectionProps} />
        <ExtrasSection {...sectionProps} />
        <CarportAndWallsSection {...sectionProps} />
      </div>
      <div>
        <Summary result={result} onSave={openDialog} />
      </div>
      <MobileTotalBar total={result.total} onSave={openDialog} />
      <SaveQuoteDialog open={dialogOpen} onClose={closeDialog} input={input} total={result.total} />
    </div>
  );
}
