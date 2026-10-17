'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Icon, type IconName } from '@/components/icons';

const LINKS: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: '/', label: 'Kalkulator', icon: 'calculator', match: (p) => p === '/' },
  { href: '/panel', label: 'Wyceny', icon: 'receipt', match: (p) => p === '/panel' || p.startsWith('/panel/wyceny') },
  { href: '/panel/cennik', label: 'Cennik', icon: 'tag', match: (p) => p.startsWith('/panel/cennik') },
];

/** Jedna nawigacja dla calej aplikacji; zmieniaja sie tylko tytul i aktywna zakladka. */
export function AppNav({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const inPanel = pathname.startsWith('/panel');

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Icon name={inPanel ? 'dashboard' : 'home'} size={22} />
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent-600">BEN-STAL</span>
            <span className="block text-base font-bold text-slate-900">{inPanel ? 'Panel' : 'Kalkulator garaży blaszanych'}</span>
          </span>
        </Link>

        <nav className="order-last flex w-full gap-1 rounded-xl bg-slate-100 p-1 sm:order-none sm:w-auto" aria-label="Nawigacja">
          {LINKS.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition sm:flex-none ${active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Icon name={l.icon} size={17} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden items-center gap-1.5 text-sm text-slate-500 md:inline-flex">
              <Icon name="user" size={16} />
              {userName}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
