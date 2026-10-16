/** Dozwolone tylko przekierowania w obrębie serwisu (ścieżka zaczynająca się od jednego "/"). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/';
}
