'use client';

import type { GateType, HeightRule, PriceList, RoofType, SheetType } from '@/lib/pricing/types';
import { GATE_LABELS } from '@/lib/pricing/engine';
import { NullableNumberInput, NumberInput, TextInput } from '@/components/ui';

export interface EditorProps {
  pl: PriceList;
  setPl: (updater: (prev: PriceList) => PriceList) => void;
}

/* ---------- pomocnicze ---------- */

function NumField({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (v: number) => void; step?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <NumberInput value={value} step={step} onChange={onChange} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Group({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mb-3 text-sm text-slate-500">{description}</p>}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Panel({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mb-3 text-sm text-slate-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const cellClass = 'w-full min-w-[72px] rounded border border-slate-200 px-1.5 py-1 text-right text-sm tabular-nums outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100';

function Cell({ value, onChange, allowEmpty = false }: { value: number | null; onChange: (v: number | null) => void; allowEmpty?: boolean }) {
  const className = `${cellClass} ${value === null ? 'bg-slate-100' : ''}`;
  if (allowEmpty) return <NullableNumberInput unstyled className={className} value={value} onChange={onChange} />;
  return <NumberInput unstyled className={className} value={value ?? 0} onChange={onChange} />;
}

/* ---------- Garaże blaszane: tabela bazowa, wysokość, konstrukcja ---------- */

const BASE_COLS: { key: keyof PriceList['baseTable'][number]; label: string }[] = [
  { key: 'rear', label: 'Spad do tyłu' },
  { key: 'gable', label: 'Dwuspad / na bok' },
  { key: 'color', label: 'Dopłata RAL / BTX' },
  { key: 'colorPer10', label: 'RAL / BTX +10 cm' },
  { key: 'wood', label: 'Dopłata drewnopodobna' },
  { key: 'woodPer10', label: 'Drewnopodobna +10 cm' },
  { key: 'heightPer10', label: 'Wysokość +10 cm' },
  { key: 'horizontalPanel', label: 'Blacha poziomo' },
];

export function SteelEditor({ pl, setPl }: EditorProps) {
  const set = (i: number, key: keyof PriceList['baseTable'][number], v: number) =>
    setPl((p) => ({ ...p, baseTable: p.baseTable.map((r, j) => (j === i ? { ...r, [key]: v } : r)) }));

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">Ceny bazowe garaży blaszanych (szerokość × długość)</h3>
          <p className="text-sm text-slate-500">Ceny w zł brutto. Kolumny „+10 cm” to dopłata za każde rozpoczęte 10 cm ponad wysokość standardową.</p>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2 text-left">Szer.</th>
                <th className="px-2 py-2 text-left">Dł.</th>
                {BASE_COLS.map((c) => (
                  <th key={c.key} className="px-2 py-2 text-right">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pl.baseTable.map((row, i) => (
                <tr key={`${row.width}-${row.length}`} className={i % 2 ? 'bg-slate-50/50' : ''}>
                  <td className="whitespace-nowrap px-2 py-1 font-medium">{row.width} m</td>
                  <td className="whitespace-nowrap px-2 py-1 font-medium">{row.length} m</td>
                  {BASE_COLS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <Cell value={row[c.key]} onChange={(v) => set(i, c.key, v ?? 0)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Group title="Wysokość garażu" description="Wysokość standardowa jest w cenie bazowej; każdy kolejny krok to dopłata z kolumny „Wysokość +10 cm”.">
        <NumField label="Wysokość standardowa [m]" value={pl.standardHeight} step={0.01} onChange={(v) => setPl((p) => ({ ...p, standardHeight: v }))} />
        <NumField label="Krok podwyższenia [m]" value={pl.heightStep} step={0.01} onChange={(v) => setPl((p) => ({ ...p, heightStep: v }))} hint="0,1 = co 10 cm" />
        <NumField label="Ile kroków do wyboru" value={pl.maxHeightSteps} onChange={(v) => setPl((p) => ({ ...p, maxHeightSteps: Math.round(v) }))} hint="Maksymalna liczba podwyższeń w kalkulatorze" />
      </Group>

      <Panel
        title="Konstrukcja (rodzaj profilu)"
        description="Kątownik jest w cenie. Inne profile = narzut % od ceny bazowej garażu i elementów konstrukcyjnych (wysokość, kolor, ułożenie blachy, bramy, okna, drzwi, wiata, ściany, ażury); bez okuć, rynien, filcu, blachodachówki i drobnych dodatków."
      >
        <div className="space-y-2">
          {(pl.structures ?? []).map((o, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr_90px_auto] items-end gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Klucz</span>
                <TextInput value={o.key} onChange={(e) => setPl((p) => ({ ...p, structures: p.structures.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) }))} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Nazwa w kalkulatorze</span>
                <TextInput value={o.label} onChange={(e) => setPl((p) => ({ ...p, structures: p.structures.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
              </label>
              <NumField label="Narzut [%]" value={o.pct} onChange={(v) => setPl((p) => ({ ...p, structures: p.structures.map((x, j) => (j === i ? { ...x, pct: v } : x)) }))} />
              <button type="button" className="pb-2 text-xs text-red-600 hover:underline" onClick={() => setPl((p) => ({ ...p, structures: p.structures.filter((_, j) => j !== i) }))}>
                usuń
              </button>
            </div>
          ))}
          <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setPl((p) => ({ ...p, structures: [...(p.structures ?? []), { key: `profil${(p.structures?.length ?? 0) + 1}`, label: 'Nowy profil', pct: 10 }] }))}>
            + dodaj profil
          </button>
        </div>
      </Panel>

      <Group title="Wymiary spoza tabeli (wycena z m³)" description="Gdy wymiarów nie ma w tabeli powyżej: szer. × dł. × wys. (w najwyższym punkcie) × stawka, plus dopłata za kolor liczona tak samo.">
        <NumField label="Stawka podstawowa [zł/m³]" value={pl.custom?.pricePerM3 ?? 0} onChange={(v) => setPl((p) => ({ ...p, custom: { ...p.custom, pricePerM3: v } }))} />
        <NumField label="Dopłata RAL / BTX [zł/m³]" value={pl.custom?.colorPerM3.ral ?? 0} onChange={(v) => setPl((p) => ({ ...p, custom: { ...p.custom, colorPerM3: { ...p.custom.colorPerM3, ral: v } } }))} />
        <NumField label="Dopłata drewnopodobna [zł/m³]" value={pl.custom?.colorPerM3.wood ?? 0} onChange={(v) => setPl((p) => ({ ...p, custom: { ...p.custom, colorPerM3: { ...p.custom.colorPerM3, wood: v } } }))} />
      </Group>
    </div>
  );
}

/* ---------- Dach, okucia i poszycie ---------- */

export function RoofEditor({ pl, setPl }: EditorProps) {
  const u = pl.unit;
  const setUnit = (k: keyof PriceList['unit'], v: number) => setPl((p) => ({ ...p, unit: { ...p.unit, [k]: v } }));
  const setRoof = (rt: RoofType, patch: Partial<PriceList['roofTypes'][RoofType]>) =>
    setPl((p) => ({ ...p, roofTypes: { ...p.roofTypes, [rt]: { ...p.roofTypes[rt], ...patch } } }));

  return (
    <div className="space-y-5">
      <Group title="Ceny jednostkowe pokrycia i obróbek" description="Okucia i rynny liczone z metrów bieżących (wzory niżej), filc i blachodachówka z metrów kwadratowych dachu.">
        <NumField label="Okucia [zł/mb]" value={u.flashingPerMb} onChange={(v) => setUnit('flashingPerMb', v)} />
        <NumField label="Rynny [zł/mb]" value={u.gutterPerMb} onChange={(v) => setUnit('gutterPerMb', v)} />
        <NumField label="Rura spustowa [zł/szt.]" value={u.downpipePrice ?? 0} onChange={(v) => setUnit('downpipePrice', v)} hint="Doliczana razem z rynnami; liczba rur zależy od rodzaju dachu (niżej)" />
        <NumField label="Filc [zł/m²]" value={u.feltPerM2} onChange={(v) => setUnit('feltPerM2', v)} />
        <NumField label="Filc – wypust poza obrys [m]" value={u.feltOverhangM ?? 0} step={0.05} onChange={(v) => setUnit('feltOverhangM', v)} hint="Na każdą stronę, np. 0,3 = +30 cm" />
        <NumField label="Blachodachówka [zł/m²]" value={u.tilePerM2} onChange={(v) => setUnit('tilePerM2', v)} />
        <NumField label="Zapas powierzchni dachu (×)" value={u.roofAreaFactor} step={0.01} onChange={(v) => setUnit('roofAreaFactor', v)} hint="1,0 = szer. × dł.; np. 1,05 uwzględnia spadek i okap" />
        <NumField label="Okucia pionowe – mb na 1 m wysokości" value={pl.verticalFlashingPerHeight} onChange={(v) => setPl((p) => ({ ...p, verticalFlashingPerHeight: v }))} hint="4 = cztery narożniki garażu" />
      </Group>

      <Panel
        title="Rodzaje dachu – nazwy i wzory na metry bieżące"
        description="Metry bieżące = mnożnik × szerokość + mnożnik × długość. Okucia dachu: spad = krawędzie ze spadkiem (boki), dwuspad = przód i tył. Grupa cenowa wskazuje kolumnę tabeli cen bazowych."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {(['rear', 'side', 'gable'] as RoofType[]).map((rt) => {
            const r = pl.roofTypes[rt];
            return (
              <div key={rt} className="space-y-3 rounded-lg border border-slate-200 p-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Nazwa w kalkulatorze</span>
                  <TextInput value={r.label} onChange={(e) => setRoof(rt, { label: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Cena bazowa wg kolumny</span>
                  <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={r.priceGroup} onChange={(e) => setRoof(rt, { priceGroup: e.target.value as 'rear' | 'gable' })}>
                    <option value="rear">Spad do tyłu</option>
                    <option value="gable">Dwuspad / na bok</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Rynny × szerokość" value={r.gutter.s} step={0.5} onChange={(v) => setRoof(rt, { gutter: { ...r.gutter, s: v } })} />
                  <NumField label="Rynny × długość" value={r.gutter.d} step={0.5} onChange={(v) => setRoof(rt, { gutter: { ...r.gutter, d: v } })} />
                  <NumField label="Okucia dachu × szerokość" value={r.roofFlashing.s} step={0.5} onChange={(v) => setRoof(rt, { roofFlashing: { ...r.roofFlashing, s: v } })} />
                  <NumField label="Okucia dachu × długość" value={r.roofFlashing.d} step={0.5} onChange={(v) => setRoof(rt, { roofFlashing: { ...r.roofFlashing, d: v } })} />
                  <NumField label="Rury spustowe [szt.]" value={r.downpipes ?? 0} onChange={(v) => setRoof(rt, { downpipes: Math.max(0, Math.round(v)) })} />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Group title="Nazwy rodzajów blachy" description="Teksty widoczne w kalkulatorze oraz w ofertach PDF i Word.">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Ocynkowana</span>
          <TextInput value={pl.sheetLabels.ocynk} onChange={(e) => setPl((p) => ({ ...p, sheetLabels: { ...p.sheetLabels, ocynk: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">W kolorze (RAL / BTX)</span>
          <TextInput value={pl.sheetLabels.ral} onChange={(e) => setPl((p) => ({ ...p, sheetLabels: { ...p.sheetLabels, ral: e.target.value } }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Drewnopodobna</span>
          <TextInput value={pl.sheetLabels.wood} onChange={(e) => setPl((p) => ({ ...p, sheetLabels: { ...p.sheetLabels, wood: e.target.value } }))} />
        </label>
      </Group>
    </div>
  );
}

/* ---------- Bramy ---------- */

const ALL_GATES: GateType[] = ['tilt', 'double', 'sectional'];
const ALL_ROOFS: RoofType[] = ['rear', 'side', 'gable'];

export function GatesEditor({ pl, setPl }: EditorProps) {
  const t = pl.gate.tilt;
  const s = pl.gate.sectional;
  const setTilt = (k: keyof PriceList['gate']['tilt'], v: number) => setPl((p) => ({ ...p, gate: { ...p.gate, tilt: { ...p.gate.tilt, [k]: v } } }));
  const setGate = (k: 'doubleLeafExtra' | 'automat' | 'horizontalPanelOnGateOrDoor', v: number) => setPl((p) => ({ ...p, gate: { ...p.gate, [k]: v } }));
  const setSec = (k: 'vatMultiplier' | 'marginMultiplier' | 'winchesterPerM2' | 'doorInGate', v: number) =>
    setPl((p) => ({ ...p, gate: { ...p.gate, sectional: { ...p.gate.sectional, [k]: v } } }));
  const setNet = (hi: number, wi: number, v: number | null) =>
    setPl((p) => ({
      ...p,
      gate: { ...p.gate, sectional: { ...p.gate.sectional, net: p.gate.sectional.net.map((row, i) => (i === hi ? row.map((c, j) => (j === wi ? v : c)) : row)) } },
    }));
  const setRule = (i: number, patch: Partial<HeightRule>) =>
    setPl((p) => ({ ...p, gate: { ...p.gate, heightRules: p.gate.heightRules.map((r, j) => (j === i ? { ...r, ...patch } : r)) } }));

  return (
    <div className="space-y-5">
      <Group title="Brama uchylna i dwuskrzydłowa" description="W cenie garażu jest 1× brama dwuskrzydłowa lub 1× drzwi; każda kolejna sztuka = cena z zakładki „Okna, drzwi i dodatki”. Brama uchylna jest zawsze płatna. Dopłaty naliczane za każde rozpoczęte 50 cm szerokości i 10 cm wysokości ponad wymiar bazowy.">
        <NumField label="Szerokość bazowa [m]" value={t.baseWidth} step={0.1} onChange={(v) => setTilt('baseWidth', v)} />
        <NumField label="Wysokość bazowa [m]" value={t.baseHeight} step={0.1} onChange={(v) => setTilt('baseHeight', v)} />
        <NumField label="Dopłata za 50 cm szerokości [zł]" value={t.per50cmWidth} onChange={(v) => setTilt('per50cmWidth', v)} />
        <NumField label="Dopłata za 10 cm wysokości [zł]" value={t.per10cmHeight} onChange={(v) => setTilt('per10cmHeight', v)} />
        <NumField label="Uchylna – cena do wysokości granicznej [zł]" value={t.priceLow} onChange={(v) => setTilt('priceLow', v)} hint="Uchylna jest zawsze płatna (standard = dwuskrzydłowa)" />
        <NumField label="Uchylna – wysokość graniczna [m]" value={t.lowMaxHeight} step={0.1} onChange={(v) => setTilt('lowMaxHeight', v)} />
        <NumField label="Uchylna – cena powyżej granicy [zł]" value={t.priceHigh} onChange={(v) => setTilt('priceHigh', v)} />
        <NumField label="Dwuskrzydłowa – dopłata [zł]" value={pl.gate.doubleLeafExtra} onChange={(v) => setGate('doubleLeafExtra', v)} />
        <NumField label="Automat do bramy [zł]" value={pl.gate.automat} onChange={(v) => setGate('automat', v)} />
        <NumField label="Blacha poziomo na bramie / drzwiach [zł]" value={pl.gate.horizontalPanelOnGateOrDoor} onChange={(v) => setGate('horizontalPanelOnGateOrDoor', v)} />
      </Group>

      <Group title="Brama segmentowa – przeliczniki" description="Cena = wartość netto z tabeli poniżej × VAT × marża. Winchester liczony za m² bramy (netto, z tymi samymi mnożnikami).">
        <NumField label="Mnożnik VAT" value={s.vatMultiplier} step={0.01} onChange={(v) => setSec('vatMultiplier', v)} hint="1,23 = VAT 23%" />
        <NumField label="Mnożnik marży" value={s.marginMultiplier} step={0.01} onChange={(v) => setSec('marginMultiplier', v)} />
        <NumField label="Winchester [zł/m² netto]" value={s.winchesterPerM2} onChange={(v) => setSec('winchesterPerM2', v)} />
        <NumField label="Drzwi w bramie [zł brutto]" value={s.doorInGate} onChange={(v) => setSec('doorInGate', v)} />
      </Group>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">Brama segmentowa – cennik producenta (netto)</h3>
          <p className="text-sm text-slate-500">Wiersze = wysokość [mm], kolumny = szerokość [mm]. Puste pole = rozmiar niedostępny (wycena indywidualna).</p>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="sticky left-0 bg-slate-50 px-2 py-2 text-left">wys. \ szer.</th>
                {s.widths.map((w) => (
                  <th key={w} className="px-1 py-2 text-right font-semibold">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.heights.map((h, hi) => (
                <tr key={h}>
                  <td className="sticky left-0 whitespace-nowrap bg-white px-2 py-1 font-semibold">{h}</td>
                  {s.widths.map((w, wi) => (
                    <td key={w} className="px-0.5 py-0.5">
                      <Cell value={s.net[hi]?.[wi] ?? null} onChange={(v) => setNet(hi, wi, v)} allowEmpty />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Panel
        title="Reguły podwyższenia garażu przy bramie"
        description="Minimalna wysokość garażu = wysokość bramy + zapas [cm]. Gdy pasuje kilka reguł, brany jest największy zapas. Kalkulator podnosi wysokość automatycznie i dolicza dopłatę."
      >
        <div className="space-y-3">
          {pl.gate.heightRules.map((r, i) => (
            <div key={i} className="grid gap-3 rounded-lg border border-slate-200 p-3 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Opis</span>
                <TextInput value={r.label} onChange={(e) => setRule(i, { label: e.target.value })} />
              </label>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">Bramy</span>
                <div className="flex gap-2">
                  {ALL_GATES.map((g) => (
                    <label key={g} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={r.gates.includes(g)}
                        onChange={(e) => setRule(i, { gates: e.target.checked ? [...r.gates, g] : r.gates.filter((x) => x !== g) })}
                      />
                      {GATE_LABELS[g].split(' ')[0]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">Dachy</span>
                <div className="flex gap-2">
                  {ALL_ROOFS.map((rt) => (
                    <label key={rt} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={r.roofs.includes(rt)}
                        onChange={(e) => setRule(i, { roofs: e.target.checked ? [...r.roofs, rt] : r.roofs.filter((x) => x !== rt) })}
                      />
                      {pl.roofTypes[rt].label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Brama szersza niż [m]</span>
                <NullableNumberInput
                  unstyled
                  className={cellClass}
                  value={r.minGateWidth ?? null}
                  onChange={(v) => setRule(i, { minGateWidth: v ?? undefined })}
                  placeholder="dowolna"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Automat</span>
                <select
                  className="rounded border border-slate-200 px-1.5 py-1 text-sm"
                  value={r.automat === undefined ? 'any' : r.automat ? 'yes' : 'no'}
                  onChange={(e) => setRule(i, { automat: e.target.value === 'any' ? undefined : e.target.value === 'yes' })}
                >
                  <option value="any">dowolnie</option>
                  <option value="yes">tylko z automatem</option>
                  <option value="no">tylko bez</option>
                </select>
              </label>
              <div className="flex items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Zapas [cm]</span>
                  <NumberInput unstyled className={cellClass} value={r.addCm} onChange={(addCm) => setRule(i, { addCm })} />
                </label>
                <button
                  type="button"
                  className="pb-1.5 text-xs text-red-600 hover:underline"
                  onClick={() => setPl((p) => ({ ...p, gate: { ...p.gate, heightRules: p.gate.heightRules.filter((_, j) => j !== i) } }))}
                >
                  usuń
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-brand-600 hover:underline"
            onClick={() => setPl((p) => ({ ...p, gate: { ...p.gate, heightRules: [...p.gate.heightRules, { gates: ['sectional'], roofs: ['rear'], addCm: 0, label: 'Nowa reguła' }] } }))}
          >
            + dodaj regułę
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Okna, drzwi i dodatki ---------- */

export function AddonsEditor({ pl, setPl }: EditorProps) {
  const setWindow = (k: keyof PriceList['windows'], v: number) => setPl((p) => ({ ...p, windows: { ...p.windows, [k]: { ...p.windows[k], price: v } } }));
  const setExtra = (k: 'lockKowal' | 'padlockHolder' | 'ventGrille', v: number) => setPl((p) => ({ ...p, extras: { ...p.extras, [k]: v } }));
  const setAnchor = (i: number, k: 'maxWidth' | 'price', v: number) =>
    setPl((p) => ({ ...p, extras: { ...p.extras, anchoring: p.extras.anchoring.map((t, j) => (j === i ? { ...t, [k]: v } : t)) } }));

  return (
    <div className="space-y-5">
      <Group title="Okna i drzwi" description="Nazwa okna jest widoczna w kalkulatorze oraz w ofertach PDF i Word.">
        {(Object.keys(pl.windows) as (keyof PriceList['windows'])[]).map((k) => (
          <div key={k} className="grid grid-cols-[1fr_100px] gap-2 rounded-lg border border-slate-200 p-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Nazwa</span>
              <TextInput value={pl.windows[k].label} onChange={(e) => setPl((p) => ({ ...p, windows: { ...p.windows, [k]: { ...p.windows[k], label: e.target.value } } }))} />
            </label>
            <NumField label="zł/szt." value={pl.windows[k].price} onChange={(v) => setWindow(k, v)} />
          </div>
        ))}
        <NumField label="Kolejne drzwi lub brama [zł/szt.]" value={pl.door} onChange={(v) => setPl((p) => ({ ...p, door: v }))} hint="Pierwsze drzwi lub brama dwuskrzydłowa są w cenie garażu" />
      </Group>

      <Group title="Drobne dodatki">
        <NumField label="Zamek kowal (klamka) [zł/szt.]" value={pl.extras.lockKowal} onChange={(v) => setExtra('lockKowal', v)} hint="Doliczany do bramy lub drzwi" />
        <NumField label="Uchwyt na kłódkę [zł]" value={pl.extras.padlockHolder} onChange={(v) => setExtra('padlockHolder', v)} />
        <NumField label="Kratka wentylacyjna [zł/szt.]" value={pl.extras.ventGrille} onChange={(v) => setExtra('ventGrille', v)} />
      </Group>

      <Panel title="Kotwiczenie – progi cenowe wg szerokości garażu" description="Brana jest pierwsza pozycja, której szerokość nie jest mniejsza od szerokości garażu.">
        <div className="flex flex-wrap gap-3">
          {pl.extras.anchoring.map((t, i) => (
            <div key={i} className="flex items-end gap-2 rounded-lg border border-slate-200 p-2">
              <NumField label="do szer. [m]" value={t.maxWidth} step={0.5} onChange={(v) => setAnchor(i, 'maxWidth', v)} />
              <NumField label="cena [zł]" value={t.price} onChange={(v) => setAnchor(i, 'price', v)} />
              <button
                type="button"
                className="pb-2 text-xs text-red-600 hover:underline"
                onClick={() => setPl((p) => ({ ...p, extras: { ...p.extras, anchoring: p.extras.anchoring.filter((_, j) => j !== i) } }))}
              >
                usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            className="self-center text-sm font-medium text-brand-600 hover:underline"
            onClick={() => setPl((p) => ({ ...p, extras: { ...p.extras, anchoring: [...p.extras.anchoring, { maxWidth: 10, price: 500 }] } }))}
          >
            + próg
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* ---------- Garaże warstwowe ---------- */

export function SandwichEditor({ pl, setPl }: EditorProps) {
  const panels = pl.sandwich?.panels ?? [];
  const setPanels = (next: typeof panels) => setPl((p) => ({ ...p, sandwich: { ...p.sandwich, panels: next } }));
  return (
    <div className="space-y-5">
    <Panel
      title="Garaże warstwowe – rodzaje płyty"
      description="Cena bazowa = szerokość × długość × wysokość × stawka wybranej płyty. Dodatki (bramy, okna, drzwi, zamek, kratka, kotwiczenie, wiata) liczone jak w garażach blaszanych."
    >
      <div className="space-y-2">
        {panels.map((o, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr_130px_auto] items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Klucz</span>
              <TextInput value={o.key} onChange={(e) => setPanels(panels.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Nazwa w kalkulatorze</span>
              <TextInput value={o.label} onChange={(e) => setPanels(panels.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            </label>
            <NumField label="Stawka [zł/m³]" value={o.pricePerM3} onChange={(v) => setPanels(panels.map((x, j) => (j === i ? { ...x, pricePerM3: v } : x)))} />
            <button type="button" className="pb-2 text-xs text-red-600 hover:underline" onClick={() => setPanels(panels.filter((_, j) => j !== i))}>
              usuń
            </button>
          </div>
        ))}
        <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setPanels([...panels, { key: `p${panels.length + 1}`, label: 'Nowa płyta', pricePerM3: 400 }])}>
          + dodaj płytę
        </button>
      </div>
    </Panel>

    <Group title="Garaże warstwowe – dodatki" description="Pozycje dostępne w kalkulatorze tylko przy garażu warstwowym.">
      <NumField
        label="Drzwi ocieplane [zł/szt.]"
        value={pl.sandwich?.insulatedDoor ?? 0}
        onChange={(v) => setPl((p) => ({ ...p, sandwich: { ...p.sandwich, insulatedDoor: v } }))}
        hint="Każda sztuka płatna (nie wchodzi w „1 szt. w cenie garażu”)"
      />
    </Group>
    </div>
  );
}

/* ---------- Wiata, ściany i ażury ---------- */

export function CarportEditor({ pl, setPl }: EditorProps) {
  const entries = Object.entries(pl.carport.ratePerMbByWidth)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => a[0] - b[0]);
  const setRates = (rates: (readonly [number, number])[]) =>
    setPl((p) => ({ ...p, carport: { ...p.carport, ratePerMbByWidth: Object.fromEntries(rates.map(([k, v]) => [String(k), v])) } }));
  const setColor = (k: SheetType, v: number) => setPl((p) => ({ ...p, carport: { ...p.carport, colorPerMb: { ...p.carport.colorPerMb, [k]: v } } }));
  const setWall = (k: SheetType, v: number) => setPl((p) => ({ ...p, partitionWallPerM2: { ...p.partitionWallPerM2, [k]: v } }));

  return (
    <div className="space-y-5">
      <Panel title="Wiata – cena za metr bieżący długości wg szerokości" description="Cena wiaty = stawka dla szerokości × długość wiaty [mb].">
        <div className="flex flex-wrap gap-3">
          {entries.map(([w, rate], i) => (
            <div key={i} className="flex items-end gap-2 rounded-lg border border-slate-200 p-2">
              <NumField label="szer. [m]" value={w} step={0.5} onChange={(v) => setRates(entries.map((e, j) => (j === i ? [v, e[1]] : e)))} />
              <NumField label="zł/mb" value={rate} onChange={(v) => setRates(entries.map((e, j) => (j === i ? [e[0], v] : e)))} />
              <button type="button" className="pb-2 text-xs text-red-600 hover:underline" onClick={() => setRates(entries.filter((_, j) => j !== i))}>
                usuń
              </button>
            </div>
          ))}
          <button type="button" className="self-center text-sm font-medium text-brand-600 hover:underline" onClick={() => setRates([...entries, [(entries.at(-1)?.[0] ?? 1) + 1, 1800]])}>
            + szerokość
          </button>
        </div>
      </Panel>

      <Group title="Wiata – dopłata za kolor blachy [zł/mb]">
        <NumField label="Ocynkowana" value={pl.carport.colorPerMb.ocynk} onChange={(v) => setColor('ocynk', v)} />
        <NumField label="RAL / BTX" value={pl.carport.colorPerMb.ral} onChange={(v) => setColor('ral', v)} />
        <NumField label="Drewnopodobna" value={pl.carport.colorPerMb.wood} onChange={(v) => setColor('wood', v)} />
      </Group>

      <Group title="Ściany działowe i oblachowane [zł/m²]" description="Liczone jako szerokość × wysokość ściany.">
        <NumField label="Ocynkowana" value={pl.partitionWallPerM2.ocynk} onChange={(v) => setWall('ocynk', v)} />
        <NumField label="RAL / BTX" value={pl.partitionWallPerM2.ral} onChange={(v) => setWall('ral', v)} />
        <NumField label="Drewnopodobna" value={pl.partitionWallPerM2.wood} onChange={(v) => setWall('wood', v)} />
      </Group>

      <Group title="Ażury [zł/m²]">
        <NumField label="Ściana ażurowa RAL / BTX" value={pl.openwork.wallPerM2.ral} onChange={(v) => setPl((p) => ({ ...p, openwork: { ...p.openwork, wallPerM2: { ...p.openwork.wallPerM2, ral: v } } }))} />
        <NumField label="Ściana ażurowa drewnopodobna" value={pl.openwork.wallPerM2.wood} onChange={(v) => setPl((p) => ({ ...p, openwork: { ...p.openwork, wallPerM2: { ...p.openwork.wallPerM2, wood: v } } }))} />
        <NumField label="Cały garaż w ażurach" value={pl.openwork.wholeGaragePerM2} onChange={(v) => setPl((p) => ({ ...p, openwork: { ...p.openwork, wholeGaragePerM2: v } }))} hint="× (2 × szer. + 2 × dł.) × wysokość" />
      </Group>
    </div>
  );
}

/* ---------- Waluty ---------- */

export function CurrenciesEditor({ pl, setPl }: EditorProps) {
  return (
    <Panel
      title="Waluty i kursy"
      description="Kurs = ile złotych za 1 jednostkę waluty. Osobne pozycje mogą mieć ten sam kod ISO (np. euro dla Niemiec i Słowacji z różnym kursem) – klucz musi być unikalny. Klient wybiera pozycję przy wycenie, a oferta przelicza ją po kursie z chwili zapisu."
    >
      <div className="space-y-2">
        {(pl.currencies ?? []).map((c, i) => (
          <div key={i} className="grid grid-cols-[90px_70px_1fr_120px_auto] items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Klucz</span>
              <TextInput value={c.key ?? c.code} onChange={(e) => setPl((p) => ({ ...p, currencies: p.currencies.map((x, j) => (j === i ? { ...x, key: e.target.value.toUpperCase().replace(/\s+/g, '_') } : x)) }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Kod ISO</span>
              <TextInput value={c.code} maxLength={3} onChange={(e) => setPl((p) => ({ ...p, currencies: p.currencies.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)) }))} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Nazwa w kalkulatorze</span>
              <TextInput value={c.label} onChange={(e) => setPl((p) => ({ ...p, currencies: p.currencies.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
            </label>
            <NumField label="Kurs [PLN]" value={c.rate} step={0.0001} onChange={(v) => setPl((p) => ({ ...p, currencies: p.currencies.map((x, j) => (j === i ? { ...x, rate: v } : x)) }))} />
            <button type="button" className="pb-2 text-xs text-red-600 hover:underline" onClick={() => setPl((p) => ({ ...p, currencies: p.currencies.filter((_, j) => j !== i) }))}>
              usuń
            </button>
          </div>
        ))}
        <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setPl((p) => ({ ...p, currencies: [...(p.currencies ?? []), { key: `EUR_${(p.currencies?.length ?? 0) + 1}`, code: 'EUR', label: 'Nowy kraj – euro (EUR)', rate: 4.3 }] }))}>
          + dodaj walutę
        </button>
      </div>
    </Panel>
  );
}
