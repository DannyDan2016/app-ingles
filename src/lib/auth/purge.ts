import { lt } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { loginAttempts, sessions } from '@/lib/db/schema';

const ATTEMPTS_TTL_MS = 86_400_000; // 1 día (la ventana de rate limit es de 15 min)
export const PURGE_EVERY = 50;

export async function purgeStale(db: Db, now: Date): Promise<{ intentos: number; sesiones: number }> {
  const intentos = await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(now.getTime() - ATTEMPTS_TTL_MS))).returning({ id: loginAttempts.id });
  const sesiones = await db.delete(sessions).where(lt(sessions.expiraAt, now)).returning({ id: sessions.idHash });
  return { intentos: intentos.length, sesiones: sesiones.length };
}

/** Purga oportunista: en ~1 de cada `every` llamadas. Nunca lanza: si falla, registra y sigue. */
export async function maybePurgeStale(
  db: Db,
  now: Date,
  opts: { every?: number; random?: () => number; purge?: typeof purgeStale } = {},
): Promise<void> {
  const { every = PURGE_EVERY, random = Math.random, purge = purgeStale } = opts;
  if (random() * every >= 1) return;
  try {
    await purge(db, now);
  } catch (e) {
    console.error('purga oportunista fallida', e instanceof Error ? e.message : 'error');
  }
}
