import { isLocalHost } from '@/lib/net/local-host';

/** Origen válido de APP_URL: https, o http solo en hosts locales; sin ruta. Null si no es válida. */
function appOrigin(appUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(appUrl);
  } catch {
    return null;
  }
  const httpsOk = u.protocol === 'https:';
  const httpLocalOk = u.protocol === 'http:' && isLocalHost(u.hostname);
  if (!httpsOk && !httpLocalOk) return null;
  if (u.pathname !== '/' || u.search || u.hash) return null;
  return u.origin;
}

type Base = { appUrl: string | undefined; host: string | null; proto: string | null; vercelEnv?: string | undefined };

/** Primer valor de x-forwarded-proto si es http/https; en cualquier otro caso, https. */
function safeProto(proto: string | null): 'http' | 'https' {
  const first = proto?.split(',')[0]?.trim().toLowerCase();
  return first === 'http' ? 'http' : 'https';
}

/** Mensaje para el admin cuando, en producción, APP_URL falta o no es válida (nunca incluye su valor). */
export const MENSAJE_APP_URL = 'Falta configurar APP_URL';

export function inviteLinkProblem(p: Base): string | null {
  if (p.vercelEnv !== 'production') return null;
  return p.appUrl && appOrigin(p.appUrl) ? null : MENSAJE_APP_URL;
}

/**
 * Enlace de invitación. Con APP_URL (no vacía) se usa siempre y, si es inválida, devuelve null (no se cae al Host).
 * En producción (VERCEL_ENV) APP_URL es obligatoria. Sin APP_URL (solo fuera de producción) se usa Host y
 * el primer valor http/https de x-forwarded-proto.
 */
export function buildInviteLink(p: Base & { code: string }): string | null {
  const path = `/registro?c=${p.code}`;
  if (inviteLinkProblem(p)) return null;
  if (p.appUrl) {
    const origin = appOrigin(p.appUrl);
    return origin ? `${origin}${path}` : null;
  }
  if (!p.host) return null;
  return `${safeProto(p.proto)}://${p.host}${path}`;
}
