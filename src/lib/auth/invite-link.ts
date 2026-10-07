const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/** Origen válido de APP_URL: https, o http solo en localhost/127.0.0.1; sin ruta. Null si no es válida. */
function appOrigin(appUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(appUrl);
  } catch {
    return null;
  }
  const httpsOk = u.protocol === 'https:';
  const httpLocalOk = u.protocol === 'http:' && LOCAL_HOSTS.has(u.hostname);
  if (!httpsOk && !httpLocalOk) return null;
  if (u.pathname !== '/' || u.search || u.hash) return null;
  return u.origin;
}

/**
 * Enlace de invitación. Con APP_URL (no vacía) se usa siempre y, si es inválida, devuelve null (no se cae al Host).
 * Sin APP_URL se mantiene el comportamiento anterior basado en Host / x-forwarded-proto.
 */
export function buildInviteLink(p: { appUrl: string | undefined; host: string | null; proto: string | null; code: string }): string | null {
  const path = `/registro?c=${p.code}`;
  if (p.appUrl) {
    const origin = appOrigin(p.appUrl);
    return origin ? `${origin}${path}` : null;
  }
  if (!p.host) return null;
  return `${p.proto ?? 'https'}://${p.host}${path}`;
}
