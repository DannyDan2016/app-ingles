/**
 * Fuerza TLS verificado en las URLs de Postgres remotas.
 * pg 8 trata `sslmode=require` como verify-full, pero pg 9 dejará de verificar el certificado;
 * por eso se fija `verify-full` explícitamente. Los hosts locales no se tocan.
 */
import { isLocalHost } from '../net/local-host';

export function enforceSslUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Sin el valor original: la URL lleva credenciales.
    throw new Error('URL de base de datos no válida');
  }
  if (isLocalHost(parsed.hostname)) return url;
  if (parsed.searchParams.get('sslmode') === 'disable') {
    throw new Error('sslmode=disable no está permitido en una base de datos remota');
  }
  if (parsed.searchParams.get('sslmode') === 'verify-full') return url;
  parsed.searchParams.set('sslmode', 'verify-full');
  return parsed.toString();
}
