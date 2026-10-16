'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth/LogoutButton';

const LINKS = [
  { href: '/panel', label: 'Wyceny' },
  { href: '/panel/cennik', label: 'Cennik' },
];

export function PanelNav({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-bold text-slate-900">
            BEN-STAL <span className="font-normal text-slate-400">/ panel</span>
          </Link>
          <nav className="flex gap-1">
            {LINKS.map((l) => {
              const active = l.href === '/panel' ? pathname === '/panel' || pathname.startsWith('/panel/wyceny') : pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} className={`rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
            Kalkulator
          </Link>
          {userName && <span className="hidden text-sm text-slate-500 sm:inline">{userName}</span>}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
