import { and, eq, inArray, desc } from 'drizzle-orm';
import type { Db, DbOrTx } from '@/lib/db/client';
import { respuestas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { agregarTarjetas } from './tarjetas.repo';

export type Origen = 'leccion' | 'tramo' | 'repaso';
type NuevaRespuesta = { userId: string; itemId: string; correcta: boolean; origen: Origen; caja?: number; at?: Date };

/** Tope de historial por usuario (H2): al superarlo se descartan las respuestas más antiguas. */
export const MAX_RESPUESTAS_USUARIO = 10_000;

export async function registrarRespuesta(db: DbOrTx, r: NuevaRespuesta) {
  await db.insert(respuestas).values({ userId: r.userId, itemId: r.itemId, correcta: r.correcta, origen: r.origen, caja: r.caja ?? null, ...(r.at ? { at: r.at } : {}) });
  await podarRespuestas(db, r.userId);
}

/** Deja solo las `max` respuestas más recientes del usuario (usa el índice user_id+at). */
export async function podarRespuestas(db: DbOrTx, userId: string, max = MAX_RESPUESTAS_USUARIO) {
  const sobrantes = db.select({ id: respuestas.id }).from(respuestas).where(eq(respuestas.userId, userId))
    .orderBy(desc(respuestas.at), desc(respuestas.id)).offset(max);
  await db.delete(respuestas).where(and(eq(respuestas.userId, userId), inArray(respuestas.id, sobrantes)));
}

/** Respuesta + tarjetas en una transacción: si fallan las tarjetas no queda la fila, y el reintento no duplica `respuestas`. */
export async function registrarRespuestaConTarjetas(db: Db, r: NuevaRespuesta, tarjetas: { nivel: Nivel; terminos: string[]; now: Date }) {
  await db.transaction(async (tx) => {
    await registrarRespuesta(tx, r);
    await agregarTarjetas(tx, r.userId, tarjetas.nivel, tarjetas.terminos, tarjetas.now);
  });
}
