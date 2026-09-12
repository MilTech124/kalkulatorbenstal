import type { ReactNode } from 'react';
import { PanelNav } from '@/components/panel/PanelNav';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PanelNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
