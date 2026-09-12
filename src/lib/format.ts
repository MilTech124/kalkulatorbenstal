// Formatowanie liczb i kwot (bez 'use client' - uzywane po obu stronach).
export const formatPln = (v: number) => `${v.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`;
export const formatNum = (v: number) => v.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
