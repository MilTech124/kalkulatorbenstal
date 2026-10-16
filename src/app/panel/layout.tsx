import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { PanelNav } from '@/components/panel/PanelNav';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <>
      <PanelNav userName={session?.name} />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
