import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';

const ATTEMPTS_TTL_MS = 86_400_000; // 1 día (la ventana de rate limit es de 15 min)
export const PURGE_EVERY = 20;
export const PURGE_LIMIT = 1000;

/** Borrado acotado (máx. `limit` filas por tabla y ejecución), apoyado en los índices por `at` y `expira_at`. */
export async function purgeStale(
  db: Db,
  now: Date,
  opts: { limit?: number } = {},
): Promise<{ intentos: number; sesiones: number }> {
  const limit = opts.limit ?? PURGE_LIMIT;
  const corte = new Date(now.getTime() - ATTEMPTS_TTL_MS);
  const intentos = await db.execute(
    sql`DELETE FROM login_attempts WHERE id IN (SELECT id FROM login_attempts WHERE at < ${corte} LIMIT ${limit})`,
  );
  const sesiones = await db.execute(
    sql`DELETE FROM sessions WHERE id_hash IN (SELECT id_hash FROM sessions WHERE expira_at < ${now} LIMIT ${limit})`,
  );
  return { intentos: intentos.rowCount ?? 0, sesiones: sesiones.rowCount ?? 0 };
}

export type PurgeOpts = {
  every?: number;
  random?: () => number;
  purge?: typeof purgeStale;
  /** Para sacar la purga del camino crítico (p. ej. `after` de next/server). Sin él se espera en línea. */
  schedule?: (fn: () => Promise<void>) => void;
};

/** Purga oportunista: en ~1 de cada `every` llamadas. Nunca lanza: si falla, registra y sigue. */
export async function maybePurgeStale(db: Db, now: Date, opts: PurgeOpts = {}): Promise<void> {
  const { every = PURGE_EVERY, random = Math.random, purge = purgeStale, schedule } = opts;
  if (random() * every >= 1) return;
  const run = async () => {
    try {
      await purge(db, now);
    } catch (e) {
      console.error('purga oportunista fallida', e instanceof Error ? e.message : 'error');
    }
  };
  if (schedule) schedule(run);
  else await run();
}
