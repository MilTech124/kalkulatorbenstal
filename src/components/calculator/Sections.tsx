'use client';

import { availableLengths, availableWidths, defaultGate, GATE_LABELS, heightOptions, SHEET_ORDER } from '@/lib/pricing/engine';
import type { GateInput, GateType, PriceList, QuoteInput, RoofType, SheetType, WindowType } from '@/lib/pricing/types';
import { Card, Checkbox, Field, NumberInput, Segmented, Select } from '@/components/ui';
import { formatNum, formatPln } from '@/lib/format';

export interface SectionProps {
  input: QuoteInput;
  pl: PriceList;
  update: (patch: Partial<QuoteInput>) => void;
}

const ROOF_ORDER: RoofType[] = ['rear', 'side', 'gable'];

export function DimensionsSection({ input, pl, update }: SectionProps) {
  const widths = availableWidths(pl);
  const lengths = availableLengths(pl, input.width);
  const heights = heightOptions(pl);

  const setWidth = (w: number) => {
    const ls = availableLengths(pl, w);
    update({ width: w, length: ls.includes(input.length) ? input.length : ls[0] });
  };

  if (input.productType === 'sandwich') {
    return (
      <Card title="Wymiary garażu warstwowego" subtitle={`Cena bazowa: szerokość × długość × wysokość × ${formatPln(pl.sandwich?.pricePerM3 ?? 0)}/m³.`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Szerokość [m]">
            <NumberInput value={input.width} min={2} max={15} step={0.5} onChange={(width) => update({ width })} />
          </Field>
          <Field label="Długość [m]">
            <NumberInput value={input.length} min={2} max={20} step={0.5} onChange={(length) => update({ length })} />
          </Field>
          <Field label="Wysokość [m]" hint="Brama może wymusić większą wysokość">
            <NumberInput value={input.height} min={2} max={5} step={0.1} onChange={(height) => update({ height })} />
          </Field>
        </div>
      </Card>
    );
  }

  const customToggle = (
    <div className="mt-4">
      <Checkbox
        checked={Boolean(input.customDims)}
        onChange={(customDims) => {
          if (customDims) {
            update({ customDims, horizontalPanel: false });
          } else {
            const w = widths.includes(input.width) ? input.width : widths[0];
            const ls = availableLengths(pl, w);
            update({ customDims: false, width: w, length: ls.includes(input.length) ? input.length : ls[0], height: pl.standardHeight });
          }
        }}
        label="Wymiary spoza cennika"
        hint={`Dowolne wymiary: szer. × dł. × wys. (w najwyższym punkcie) × ${formatPln(pl.custom?.pricePerM3 ?? 0)}/m³, kolor RAL/drewno za m³`}
      />
    </div>
  );

  if (input.customDims) {
    return (
      <Card title="Wymiary garażu (spoza cennika)" subtitle="Cena bazowa liczona z kubatury: szerokość × długość × wysokość w najwyższym punkcie.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Szerokość [m]">
            <NumberInput value={input.width} min={1} max={20} step={0.1} onChange={(width) => update({ width })} />
          </Field>
          <Field label="Długość [m]">
            <NumberInput value={input.length} min={1} max={20} step={0.1} onChange={(length) => update({ length })} />
          </Field>
          <Field label="Wysokość w najwyższym punkcie [m]" hint="Brama może wymusić większą wysokość">
            <NumberInput value={input.height} min={1.5} max={6} step={0.1} onChange={(height) => update({ height })} />
          </Field>
        </div>
        {customToggle}
      </Card>
    );
  }

  return (
    <Card title="Wymiary garażu" subtitle="Wybierz szerokość, długość i wysokość. Wysokość standardowa jest wliczona w cenę.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Szerokość [m]">
          <Select value={input.width} onChange={(e) => setWidth(Number(e.target.value))}>
            {widths.map((w) => (
              <option key={w} value={w}>
                {formatNum(w)} m
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Długość [m]">
          <Select value={input.length} onChange={(e) => update({ length: Number(e.target.value) })}>
            {lengths.map((l) => (
              <option key={l} value={l}>
                {formatNum(l)} m
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Wysokość [m]" hint={`Standard ${formatNum(pl.standardHeight)} m, dopłata za każde ${Math.round(pl.heightStep * 100)} cm`}>
          <Select value={input.height} onChange={(e) => update({ height: Number(e.target.value) })}>
            {heights.map((h) => (
              <option key={h} value={h}>
                {formatNum(h)} m{h === pl.standardHeight ? ' (standard)' : ''}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {customToggle}
    </Card>
  );
}

export function RoofAndSheetSection({ input, pl, update }: SectionProps) {
  const sandwich = input.productType === 'sandwich';
  return (
    <Card title="Dach i blacha">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Rodzaj dachu</p>
          <Segmented
            value={input.roofType}
            onChange={(roofType) => update({ roofType })}
            options={ROOF_ORDER.map((r) => ({ value: r, label: pl.roofTypes[r].label }))}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Rodzaj blachy</p>
          <Segmented<SheetType>
            value={input.sheet}
            onChange={(sheet) => update({ sheet })}
            options={SHEET_ORDER.map((s) => ({ value: s, label: pl.sheetLabels[s], hint: sandwich ? 'dotyczy wiaty i ścian' : s === 'ocynk' ? 'w cenie' : 'dopłata wg wymiarów' }))}
          />
        </div>
        {!sandwich && (pl.structures?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Konstrukcja</p>
            <Segmented<string>
              value={input.structure ?? ''}
              onChange={(structure) => update({ structure: structure || undefined })}
              options={[
                { value: '', label: 'Kątownik', hint: 'w cenie' },
                ...(pl.structures ?? []).map((o) => ({ value: o.key, label: o.label, hint: `${o.pct > 0 ? '+' : ''}${o.pct}% ceny bazowej` })),
              ]}
            />
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {!sandwich && !input.customDims && (
            <Checkbox
              checked={input.horizontalPanel}
              onChange={(horizontalPanel) => update({ horizontalPanel })}
              label="Poziomy panel blachy"
              hint="Dopłata wg wymiarów garażu"
            />
          )}
          {!sandwich && (
            <Checkbox
              checked={input.flashings ?? true}
              onChange={(flashings) => update({ flashings })}
              label="Okucia (pionowe + dachu)"
              hint={`${formatPln(pl.unit.flashingPerMb)}/mb, długość zależna od wysokości i spadu`}
            />
          )}
          <Checkbox
            checked={input.gutters}
            onChange={(gutters) => update({ gutters })}
            label="Rynny"
            hint={`${formatPln(pl.unit.gutterPerMb)}/mb, długość zależna od spadu`}
          />
          {!sandwich && (
            <Checkbox
              checked={input.felt}
              onChange={(felt) => update({ felt })}
              label="Filc (podbicie antykondensacyjne)"
              hint={`${formatPln(pl.unit.feltPerM2)}/m² dachu z wypustem ${Math.round((pl.unit.feltOverhangM ?? 0) * 100)} cm na stronę (+ wiata)`}
            />
          )}
          <Checkbox
            checked={input.tile}
            onChange={(tile) => update({ tile })}
            label="Blachodachówka"
            hint={`${formatPln(pl.unit.tilePerM2)}/m² dachu`}
          />
        </div>
      </div>
    </Card>
  );
}

const GATE_ORDER: GateType[] = ['tilt', 'double', 'sectional'];

export function GateSection({ input, pl, update }: SectionProps) {
  const gates = input.gates;
  const setGates = (next: GateInput[]) => update({ gates: next });
  const patchGate = (i: number, patch: Partial<GateInput>) => setGates(gates.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  return (
    <Card title="Bramy" subtitle="Można dodać kilka bram (np. garaż dwustanowiskowy). Brama segmentowa wyceniana z cennika producenta, automat w standardzie.">
      <div className="space-y-4">
        {gates.length === 0 && <p className="text-sm text-slate-500">Bez bramy.</p>}
        {gates.map((g, i) => (
          <GateCard
            key={i}
            index={i}
            total={gates.length}
            gate={g}
            pl={pl}
            horizontalPanel={input.horizontalPanel}
            onChange={(patch) => patchGate(i, patch)}
            onRemove={() => setGates(gates.filter((_, j) => j !== i))}
          />
        ))}
        {gates.length < 6 && (
          <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setGates([...gates, defaultGate()])}>
            + dodaj bramę
          </button>
        )}
      </div>
    </Card>
  );
}

function GateCard({
  index,
  total,
  gate: g,
  pl,
  horizontalPanel,
  onChange,
  onRemove,
}: {
  index: number;
  total: number;
  gate: GateInput;
  pl: PriceList;
  horizontalPanel: boolean;
  onChange: (patch: Partial<GateInput>) => void;
  onRemove: () => void;
}) {
  const isSectional = g.type === 'sectional';
  const sec = pl.gate.sectional;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{total > 1 ? `Brama ${index + 1}` : 'Brama'}</p>
        <button type="button" className="text-xs text-red-600 hover:underline" onClick={onRemove}>
          usuń bramę
        </button>
      </div>
      <Segmented<GateType>
        value={g.type}
        onChange={(type) => {
          if (type === 'sectional') {
            onChange({ type, width: Math.max(g.width, 2.2), height: Math.max(g.height, 2.02), automat: true });
          } else {
            onChange({ type, automat: false, winchester: false, doorInGate: false });
          }
        }}
        options={GATE_ORDER.map((t) => ({ value: t, label: GATE_LABELS[t] }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {isSectional ? (
          <>
            <Field label="Szerokość bramy [mm]" hint="Rozmiar spoza listy zaokrąglany w górę">
              <Select value={Math.round(g.width * 1000)} onChange={(e) => onChange({ width: Number(e.target.value) / 1000 })}>
                {sec.widths.map((w) => (
                  <option key={w} value={w}>
                    {w} mm
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Wysokość bramy [mm]">
              <Select value={Math.round(g.height * 1000)} onChange={(e) => onChange({ height: Number(e.target.value) / 1000 })}>
                {sec.heights.map((h) => (
                  <option key={h} value={h}>
                    {h} mm
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Szerokość bramy [m]" hint={`Baza ${formatNum(pl.gate.tilt.baseWidth)} m, dopłata za każde 50 cm`}>
              <NumberInput value={g.width} min={1} max={10} step={0.1} onChange={(width) => onChange({ width })} />
            </Field>
            <Field label="Wysokość bramy [m]" hint={`Baza ${formatNum(pl.gate.tilt.baseHeight)} m, dopłata za każde 10 cm`}>
              <NumberInput value={g.height} min={1} max={4} step={0.1} onChange={(height) => onChange({ height })} />
            </Field>
          </>
        )}
      </div>

      {isSectional ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox checked={g.winchester} onChange={(winchester) => onChange({ winchester })} label="Kolor winchester" hint="Dopłata za m² bramy" />
          <Checkbox checked={g.doorInGate} onChange={(doorInGate) => onChange({ doorInGate })} label="Drzwi w bramie" hint={formatPln(sec.doorInGate)} />
          <Checkbox checked={Boolean(g.lockKowal)} onChange={(lockKowal) => onChange({ lockKowal })} label="Zamek kowal (klamka)" hint={formatPln(pl.extras.lockKowal)} />
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Checkbox checked={g.automat} onChange={(automat) => onChange({ automat })} label="Automat do bramy" hint={formatPln(pl.gate.automat)} />
          <Checkbox
            checked={g.horizontalPanel}
            onChange={(horizontalPanel) => onChange({ horizontalPanel })}
            label="Poziomy panel na bramie"
            hint={`${formatPln(pl.gate.horizontalPanelOnGateOrDoor)} (gdy wybrano poziomy panel)`}
            disabled={!horizontalPanel}
          />
          <Checkbox checked={Boolean(g.lockKowal)} onChange={(lockKowal) => onChange({ lockKowal })} label="Zamek kowal (klamka)" hint={formatPln(pl.extras.lockKowal)} />
        </div>
      )}
    </div>
  );
}

const WINDOW_ORDER: WindowType[] = ['w100x60', 'w80x60', 'w60x40', 'plexi64x34', 'opening'];

export function WindowsDoorsSection({ input, pl, update }: SectionProps) {
  const qtyOf = (t: WindowType) => input.windows.find((w) => w.type === t)?.qty ?? 0;
  const setQty = (t: WindowType, qty: number) => {
    const rest = input.windows.filter((w) => w.type !== t);
    update({ windows: qty > 0 ? [...rest, { type: t, qty }] : rest });
  };

  return (
    <Card title="Okna i drzwi">
      <div className="grid gap-3 sm:grid-cols-2">
        {WINDOW_ORDER.map((t) => {
          const def = pl.windows[t];
          return (
            <QtyRow
              key={t}
              label={def.label}
              hint={`${formatPln(def.price)}/szt.${def.requiresHorizontalPanel ? ' · wymaga poziomego panelu' : ''}`}
              value={qtyOf(t)}
              onChange={(v) => setQty(t, v)}
            />
          );
        })}
        <QtyRow label="Drzwi" hint={`1 szt. drzwi lub bramy w cenie garażu, kolejne ${formatPln(pl.door)}/szt.`} value={input.doors} onChange={(doors) => update({ doors, doorLocks: Math.min(input.doorLocks ?? 0, doors) })} />
        {input.doors > 0 && (
          <QtyRow label="Zamek kowal (klamka) w drzwiach" hint={`${formatPln(pl.extras.lockKowal)}/szt., max ${input.doors}`} value={input.doorLocks ?? 0} onChange={(doorLocks) => update({ doorLocks: Math.min(doorLocks, input.doors) })} />
        )}
      </div>
    </Card>
  );
}

function QtyRow({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${value > 0 ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="h-8 w-8 rounded-md border border-slate-300 bg-white text-lg leading-none hover:bg-slate-50">
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(50, value + 1))} className="h-8 w-8 rounded-md border border-slate-300 bg-white text-lg leading-none hover:bg-slate-50">
          +
        </button>
      </div>
    </div>
  );
}

export function ExtrasSection({ input, pl, update }: SectionProps) {
  const e = input.extras;
  const setExtras = (patch: Partial<QuoteInput['extras']>) => update({ extras: { ...e, ...patch } });
  return (
    <Card title="Dodatki">
      <div className="grid gap-2 sm:grid-cols-2">
        <Checkbox checked={e.padlockHolder} onChange={(padlockHolder) => setExtras({ padlockHolder })} label="Uchwyt na kłódkę" hint={formatPln(pl.extras.padlockHolder)} />
        <Checkbox
          checked={e.anchoring}
          onChange={(anchoring) => setExtras({ anchoring })}
          label="Kotwiczenie"
          hint={pl.extras.anchoring.map((t) => `do ${formatNum(t.maxWidth)} m: ${formatPln(t.price)}`).join(', ')}
        />
        <QtyRow label="Kratka wentylacyjna 14×21" hint={`${formatPln(pl.extras.ventGrille)}/szt.`} value={e.ventGrilleQty} onChange={(ventGrilleQty) => setExtras({ ventGrilleQty })} />
      </div>
    </Card>
  );
}

export function CarportAndWallsSection({ input, pl, update }: SectionProps) {
  const c = input.carport;
  const setCarport = (patch: Partial<QuoteInput['carport']>) => update({ carport: { ...c, ...patch } });
  const carportWidths = Object.keys(pl.carport.ratePerMbByWidth)
    .map(Number)
    .sort((a, b) => a - b);
  const ow = input.openwork;
  const setOpenwork = (patch: Partial<QuoteInput['openwork']>) => update({ openwork: { ...ow, ...patch } });
  const sandwich = input.productType === 'sandwich';

  return (
    <Card title={sandwich ? 'Wiata' : 'Wiata, ściany i ażury'} subtitle="Opcjonalne elementy dodatkowe.">
      <div className="space-y-5">
        <div>
          <Checkbox checked={c.enabled} onChange={(enabled) => setCarport({ enabled })} label="Wiata (zadaszenie) przy garażu" hint="Cena za metr bieżący zależna od szerokości wiaty" />
          {c.enabled && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Szerokość wiaty [m]">
                <Select value={c.width} onChange={(e) => setCarport({ width: Number(e.target.value) })}>
                  {carportWidths.map((w) => (
                    <option key={w} value={w}>
                      {w} m ({formatPln(pl.carport.ratePerMbByWidth[String(w)])}/mb)
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Długość wiaty [m]">
                <NumberInput value={c.length} min={1} max={30} step={0.5} onChange={(length) => setCarport({ length })} />
              </Field>
            </div>
          )}
        </div>

        {!sandwich && (
          <>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Ściany działowe / oblachowane</p>
            <button
              type="button"
              className="text-sm font-medium text-brand-600 hover:underline"
              onClick={() => update({ partitionWalls: [...input.partitionWalls, { width: input.length, height: input.height }] })}
            >
              + dodaj ścianę
            </button>
          </div>
          {input.partitionWalls.length === 0 && <p className="text-xs text-slate-500">Brak. Cena {formatPln(pl.partitionWallPerM2[input.sheet])}/m² dla wybranej blachy.</p>}
          <div className="space-y-2">
            {input.partitionWalls.map((wall, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Field label="Szerokość [m]">
                  <NumberInput
                    value={wall.width}
                    min={0.5}
                    max={20}
                    step={0.5}
                    onChange={(width) => update({ partitionWalls: input.partitionWalls.map((w, j) => (j === i ? { ...w, width } : w)) })}
                  />
                </Field>
                <Field label="Wysokość [m]">
                  <NumberInput
                    value={wall.height}
                    min={0.5}
                    max={6}
                    step={0.1}
                    onChange={(height) => update({ partitionWalls: input.partitionWalls.map((w, j) => (j === i ? { ...w, height } : w)) })}
                  />
                </Field>
                <button
                  type="button"
                  className="mb-1 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => update({ partitionWalls: input.partitionWalls.filter((_, j) => j !== i) })}
                >
                  usuń
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Ażury</p>
          <Segmented
            value={ow.mode}
            onChange={(mode) => setOpenwork({ mode })}
            options={[
              { value: 'none', label: 'Bez ażurów' },
              { value: 'wall', label: 'Ściana ażurowa', hint: `${formatPln(pl.openwork.wallPerM2.ral)}–${formatPln(pl.openwork.wallPerM2.wood)}/m²` },
              { value: 'whole', label: 'Cały garaż w ażurach', hint: `${formatPln(pl.openwork.wholeGaragePerM2)}/m² ścian` },
            ]}
          />
          {ow.mode === 'wall' && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Szerokość ściany [m]">
                <NumberInput value={ow.width} min={0.5} max={20} step={0.5} onChange={(width) => setOpenwork({ width })} />
              </Field>
              <Field label="Wysokość ściany [m]">
                <NumberInput value={ow.height} min={0.5} max={6} step={0.1} onChange={(height) => setOpenwork({ height })} />
              </Field>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </Card>
  );
}
