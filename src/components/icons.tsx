import type { ReactNode, SVGProps } from 'react';

/** Male ikony liniowe (styl Lucide) - bez zewnetrznej biblioteki. */
const PATHS = {
  ruler: <><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></>,
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  layers: <><path d="m12 2 10 5-10 5L2 7Z" /><path d="m2 12 10 5 10-5" /><path d="m2 17 10 5 10-5" /></>,
  roof: <><path d="M3 12 12 4l9 8" /><path d="M5 10v10h14V10" /></>,
  palette: <><circle cx="13.5" cy="6.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /><circle cx="8.5" cy="7.5" r="1" /><circle cx="6.5" cy="12.5" r="1" /><path d="M12 22a10 10 0 1 1 10-10c0 3-2 4-4.5 4H15a2 2 0 0 0-1.5 3.3c.6.7.4 2.7-1.5 2.7Z" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L21 17l-4 4-5.7-1.3a4 4 0 0 0-5-5L3 7l4-4Z" />,
  door: <><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" /><path d="M3 21h18" /><path d="M15 12h.01" /></>,
  gate: <><path d="M3 21V8l9-5 9 5v13" /><path d="M7 21v-8h10v8" /><path d="M7 15h10" /><path d="M7 18h10" /></>,
  window: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18" /><path d="M3 12h18" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m6 6 1 14h10l1-14" /></>,
  package: <><path d="m7.5 4.3 9 5.2" /><path d="M21 8v8l-9 5-9-5V8l9-5Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  tent: <><path d="m3.5 21 8.5-17 8.5 17" /><path d="M12 21v-6" /><path d="M2 21h20" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></>,
  trashbin: <><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2Z" /><path d="M9 8h6" /><path d="M9 12h6" /></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  check: <path d="m5 12 5 5L20 7" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
