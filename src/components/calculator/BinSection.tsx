'use client';

import { availableLengths, availableWidths, defaultGate, SHEET_LAYOUT_LABELS, sheetLayout } from '@/lib/pricing/engine';
import type { RoofType, SheetLayout } from '@/lib/pricing/types';
import { Card, Checkbox, Field, Segmented, Select } from '@/components/ui';
import { formatNum, formatPln } from '@/lib/format';
import { normalizedSheetColor, SHEET_COLORS, sheetColorFamily, type SheetColorFamily } from '@/lib/sheetColors';
import { ColorSelect } from './ColorSelect';
import type { SectionProps } from './Sections';

const BIN_ROOFS: RoofType[] = ['rear', 'side'];
const BIN_WALLS = [1, 2, 3, 4];

/** Formularz wiaty smietnikowej wg kartki klientki: wymiary z tabeli garazy, spad, drzwi, kolor, panel, okucia, azury. */
export function BinSection({ input, pl, update }: SectionProps) {
  const widths = availableWidths(pl);
  const lengths = availableLengths(pl, input.width);
  const colorFamily = sheetColorFamily(input.sheet, input.sheetColor);
  const doubleLeaf = input.gates.length > 0;
  const lockChecked = doubleLeaf ? Boolean(input.gates[0]?.lockKowal) : (input.doorLocks ?? 0) > 0;
  const walls = input.openworkWalls ?? [];
  const wallM2 = (n: number) => (n <= 2 ? input.width : input.length) * pl.bin.openworkHeight;

  const setWidth = (w: number) => {
    const ls = availableLengths(pl, w);
    update({ width: w, length: ls.includes(input.length) ? input.length : ls[0] });
  };
  const setColorFamily = (family: SheetColorFamily | 'ocynk') => {
    if (family === colorFamily) return;
    update({ sheet: family === 'ocynk' ? 'ocynk' : family === 'wood' ? 'wood' : 'ral', sheetColor: family === 'ocynk' ? undefined : SHEET_COLORS[family][0].key });
  };
  const setDoor = (type: 'single' | 'double') => {
    if (type === 'double') update({ gates: [{ ...defaultGate(), width: 2, height: 2, lockKowal: lockChecked }], doors: 0, doorLocks: 0 });
    else update({ gates: [], doors: 1, doorLocks: lockChecked ? 1 : 0 });
  };
  const setLock = (on: boolean) => {
    if (doubleLeaf) update({ gates: input.gates.map((g, i) => (i === 0 ? { ...g, lockKowal: on } : g)) });
    else update({ doorLocks: on ? 1 : 0 });
  };
  const toggleWall = (n: number) => update({ openworkWalls: walls.includes(n) ? walls.filter((w) => w !== n) : [...walls, n].sort() });

  return (
    <>
      <Card title="Wymiary wiaty śmietnikowej" subtitle="Cena podstawy jak dla garażu o tych samych wymiarach.">
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </Card>

      <Card title="Dach, drzwi i blacha">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Spad dachu</p>
            <Segmented value={input.roofType} onChange={(roofType) => update({ roofType })} options={BIN_ROOFS.map((r) => ({ value: r, label: pl.roofTypes[r].label }))} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Drzwi</p>
            <Segmented<'single' | 'double'>
              value={doubleLeaf ? 'double' : 'single'}
              onChange={setDoor}
              options={[
                { value: 'single', label: 'Pojedyncze', hint: 'w cenie' },
                { value: 'double', label: 'Dwuskrzydłowe', hint: 'w cenie' },
              ]}
            />
            <div className="mt-2">
              <Checkbox checked={lockChecked} onChange={setLock} label="Zamek kowal (klamka)" hint={formatPln(pl.extras.lockKowal)} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Rodzaj blachy</p>
            <Segmented<SheetColorFamily | 'ocynk'>
              value={colorFamily}
              onChange={setColorFamily}
              options={[
                { value: 'ocynk', label: pl.sheetLabels.ocynk, hint: 'w cenie' },
                { value: 'ral', label: 'Błyszczący RAL', hint: 'dopłata wg wymiarów' },
                { value: 'btx', label: 'Matowy BTX', hint: 'dopłata jak za RAL' },
                { value: 'wood', label: pl.sheetLabels.wood, hint: 'dopłata wg wymiarów' },
              ]}
            />
          </div>
          {colorFamily !== 'ocynk' && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Kolor</p>
              <ColorSelect label="Kolor" options={SHEET_COLORS[colorFamily]} value={normalizedSheetColor(input.sheet, input.sheetColor)} onChange={(sheetColor) => update({ sheetColor })} />
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Ułożenie blachy</p>
            <Segmented<SheetLayout>
              value={sheetLayout(input)}
              onChange={(layout) => update({ sheetLayout: layout, horizontalPanel: layout === 'h' || layout === 'hWide' })}
              options={[
                { value: 'v', label: SHEET_LAYOUT_LABELS.v, hint: 'w cenie' },
                { value: 'h', label: SHEET_LAYOUT_LABELS.h, hint: 'dopłata wg wymiarów' },
              ]}
            />
          </div>
          <Checkbox
            checked={input.flashings ?? true}
            onChange={(flashings) => update({ flashings })}
            label="Obróbka blacharska (okucia pionowe + dachu)"
            hint={`${formatPln(pl.unit.flashingPerMb)}/mb, zależnie od spadu`}
          />
        </div>
      </Card>

      <Card title="Ażury" subtitle={`Wybierz ściany ażurowe: długość ściany × ${formatNum(pl.bin.openworkHeight)} m × ${formatPln(pl.bin.openworkPerM2)}/m². Ściany 1–2 mają ${formatNum(input.width)} m, 3–4 mają ${formatNum(input.length)} m.`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {BIN_WALLS.map((n) => (
            <Checkbox
              key={n}
              checked={walls.includes(n)}
              onChange={() => toggleWall(n)}
              label={`Ściana ${n} (${formatNum(n <= 2 ? input.width : input.length)} m)`}
              hint={formatPln(wallM2(n) * pl.bin.openworkPerM2)}
            />
          ))}
        </div>
      </Card>
    </>
  );
}
