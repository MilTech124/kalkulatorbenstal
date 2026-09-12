import type { CustomerInfo } from '@/lib/pricing/types';

/** Adres jednym ciagiem - z pol ulica/kod/miasto albo ze starego pola address. */
export function formatAddress(c: Pick<CustomerInfo, 'street' | 'postalCode' | 'city' | 'address'>): string {
  if (c.street || c.city) return [c.street, [c.postalCode, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return c.address ?? '';
}
