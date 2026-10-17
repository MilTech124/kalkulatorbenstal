import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';
import { AppNav } from '@/components/AppNav';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return (
    <>
      <AppNav userName={session?.name} />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
