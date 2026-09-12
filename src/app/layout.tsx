import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kalkulator garaży BEN-STAL',
  description: 'Wycena garażu blaszanego online: wymiary, dach, blacha, brama, okna i dodatki.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
