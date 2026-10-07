export function mismoOrigen(origin: string | null, secFetchSite: string | null, propio: string): boolean {
  if (origin !== null) return origin === propio;
  return secFetchSite === 'same-origin';
}

const primero = (v: string | null) => v?.split(',')[0]?.trim() || null;

/**
 * Orígenes que se consideran propios: el que indica la petición (x-forwarded-proto/host o Host),
 * el de `req.nextUrl` y APP_URL normalizada. Tras un proxy o en un contenedor standalone
 * el origen interno de Next standalone (HOSTNAME de bind) no coincide con el Host público.
 */
export function origenesPropios(headers: Pick<Headers, 'get'>, nextUrlOrigin: string, appUrl?: string | null): string[] {
  const out = new Set<string>([nextUrlOrigin]);
  const host = primero(headers.get('x-forwarded-host')) ?? primero(headers.get('host'));
  if (host) {
    const proto = primero(headers.get('x-forwarded-proto'))?.toLowerCase() ?? new URL(nextUrlOrigin).protocol.replace(':', '');
    if (proto === 'http' || proto === 'https') {
      try { out.add(new URL(`${proto}://${host}`).origin); } catch { /* host inválido: se ignora */ }
    }
  }
  const app = appUrl?.trim().replace(/\/+$/, '');
  if (app) out.add(app);
  return [...out];
}
