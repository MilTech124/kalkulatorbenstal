'use client';

import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400';

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

type NumericProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'> & {
  min?: number;
  max?: number;
  /** Skok wartosci - podpowiedz dla klawiatury i strzalek gora/dol. */
  step?: number;
  /** true = bez domyslnego stylu pola (np. ciasna komorka tabeli w panelu). */
  unstyled?: boolean;
};

/**
 * Pole liczbowe odporne na wpisywanie ulamkow: trzyma tekst wpisany przez uzytkownika
 * (dopuszcza przecinek i chwilowo puste pole), a liczbe oddaje w gore, gdy tylko da sie ja sparsowac.
 * Dzieki temu "12,5" albo wyczyszczenie pola nie gubi wpisywanej ceny.
 */
function NumericField({
  value,
  onChange,
  allowEmpty = false,
  min,
  max,
  step = 1,
  unstyled,
  className,
  onBlur,
  onKeyDown,
  ...rest
}: NumericProps & { value: number | null; onChange: (v: number | null) => void; allowEmpty?: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (value === null || !Number.isFinite(value) ? '' : String(value));

  const parse = (raw: string): number | null => {
    if (raw === '' || raw === '-' || raw === ',' || raw === '.') return null;
    const v = Number(raw.replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  };
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(/\s/g, '');
        if (raw !== '' && !/^-?\d*[.,]?\d*$/.test(raw)) return;
        setDraft(raw);
        const parsed = parse(raw);
        if (parsed !== null) onChange(parsed);
        else if (allowEmpty) onChange(null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          // Zaokraglenie do dokladnosci kroku eliminuje bledy zmiennoprzecinkowe (0,1 + 0,2).
          const decimals = (String(step).split('.')[1] ?? '').length;
          const next = Number(clamp((parse(text) ?? 0) + (e.key === 'ArrowUp' ? step : -step)).toFixed(decimals));
          setDraft(String(next));
          onChange(next);
        }
        onKeyDown?.(e);
      }}
      onBlur={(e) => {
        setDraft(null);
        const parsed = parse(text);
        if (parsed === null) onChange(allowEmpty ? null : 0);
        else if (clamp(parsed) !== parsed) onChange(clamp(parsed));
        onBlur?.(e);
      }}
      className={`${unstyled ? '' : inputClass} ${className ?? ''}`}
    />
  );
}

/** Pole liczbowe zawsze z wartoscia (puste pole = 0 po jego opuszczeniu). */
export function NumberInput({ value, onChange, ...rest }: NumericProps & { value: number; onChange: (v: number) => void }) {
  return <NumericField {...rest} value={value} onChange={(v) => onChange(v ?? 0)} />;
}

/** Pole liczbowe, ktore moze zostac puste (null = brak wartosci, np. rozmiar niedostepny). */
export function NullableNumberInput({ value, onChange, ...rest }: NumericProps & { value: number | null; onChange: (v: number | null) => void }) {
  return <NumericField {...rest} allowEmpty value={value} onChange={onChange} />;
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-600"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-2.5 text-left transition ${active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <span className={`block text-sm font-medium ${active ? 'text-brand-700' : 'text-slate-800'}`}>{o.label}</span>
            {o.hint && <span className="block text-xs text-slate-500">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  ...rest
}: { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
    secondary: 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}
