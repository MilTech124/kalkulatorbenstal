import type { ReactNode } from 'react';
import { PanelNav } from '@/components/panel/PanelNav';

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PanelNav />
      <main className="w-full min-w-0 flex-1 px-4 py-6">{children}</main>
    </>
  );
}
