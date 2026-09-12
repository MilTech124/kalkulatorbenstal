'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/panel', label: 'Wyceny' },
  { href: '/panel/cennik', label: 'Cennik' },
];

export function PanelNav() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === '/panel/login') return null;

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/panel/login');
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
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
          <button type="button" onClick={logout} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
