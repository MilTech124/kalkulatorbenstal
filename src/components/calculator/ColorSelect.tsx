'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface ColorOption {
  key: string;
  label: string;
  swatch: string;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-6 w-6 shrink-0 rounded-md border border-black/15 shadow-inner"
      style={color.startsWith('repeating-') ? { backgroundImage: color } : { backgroundColor: color }}
    />
  );
}

export function ColorSelect({ options, value, onChange, label = 'Kolor blachy' }: { options: readonly ColorOption[]; value?: string; onChange: (key: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();
  const selected = options.find((option) => option.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const choose = (key: string) => {
    onChange(key);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => optionRefs.current[options.findIndex((option) => option.key === selected.key)]?.focus());
      return;
    }
    const current = optionRefs.current.findIndex((option) => option === document.activeElement);
    const next = current < 0 ? options.findIndex((option) => option.key === selected.key) : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    optionRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm outline-none hover:border-slate-400 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-100"
      >
        <Swatch color={selected.swatch} />
        <span className="flex-1">{selected.label}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div id={listId} role="listbox" aria-label={label} className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((option, index) => (
            <button
              key={option.key}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              role="option"
              aria-selected={option.key === selected.key}
              onClick={() => choose(option.key)}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none hover:bg-slate-100 focus-visible:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-200 ${option.key === selected.key ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-800'}`}
            >
              <Swatch color={option.swatch} />
              <span className="flex-1">{option.label}</span>
              {option.key === selected.key && <span aria-hidden="true" className="text-brand-700">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
