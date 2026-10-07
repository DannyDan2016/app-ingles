export function mismoOrigen(origin: string | null, secFetchSite: string | null, propio: string): boolean {
  if (origin !== null) return origin === propio;
  return secFetchSite === 'same-origin';
}
