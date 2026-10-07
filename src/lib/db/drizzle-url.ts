import { enforceSslUrl } from './ssl-url';

/** Subcomandos de drizzle-kit que no abren conexión: `generate` solo compara el esquema con los snapshots. */
const SIN_BD = new Set(['generate', 'check']);

/**
 * URL para drizzle.config.ts. Sin DATABASE_URL: vacía si el comando no usa BD; error claro en cualquier otro caso
 * (incluido un comando no reconocido: mejor fallar que conectar a un destino inesperado).
 */
export function drizzleDbUrl(argv: string[], env: Record<string, string | undefined>): string {
  const url = env.DATABASE_URL;
  if (url) return enforceSslUrl(url);
  if (argv.slice(2).some((a) => SIN_BD.has(a))) return '';
  throw new Error('Falta DATABASE_URL: este comando de drizzle-kit necesita conectar a la base de datos');
}
