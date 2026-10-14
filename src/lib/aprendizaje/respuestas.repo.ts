import type { Db, DbOrTx } from '@/lib/db/client';
import { respuestas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { agregarTarjetas } from './tarjetas.repo';

export type Origen = 'leccion' | 'tramo' | 'repaso';
type NuevaRespuesta = { userId: string; itemId: string; correcta: boolean; origen: Origen; caja?: number; at?: Date };

export async function registrarRespuesta(db: DbOrTx, r: NuevaRespuesta) {
  await db.insert(respuestas).values({ userId: r.userId, itemId: r.itemId, correcta: r.correcta, origen: r.origen, caja: r.caja ?? null, ...(r.at ? { at: r.at } : {}) });
}

/** Respuesta + tarjetas en una transacción: si fallan las tarjetas no queda la fila, y el reintento no duplica `respuestas`. */
export async function registrarRespuestaConTarjetas(db: Db, r: NuevaRespuesta, tarjetas: { nivel: Nivel; terminos: string[]; now: Date }) {
  await db.transaction(async (tx) => {
    await registrarRespuesta(tx, r);
    await agregarTarjetas(tx, r.userId, tarjetas.nivel, tarjetas.terminos, tarjetas.now);
  });
}
