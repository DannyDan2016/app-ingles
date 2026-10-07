import type { Db } from '@/lib/db/client';
import { respuestas } from '@/lib/db/schema';

export type Origen = 'leccion' | 'tramo' | 'repaso';
export async function registrarRespuesta(db: Db, r: { userId: string; itemId: string; correcta: boolean; origen: Origen; caja?: number; at?: Date }) {
  await db.insert(respuestas).values({ userId: r.userId, itemId: r.itemId, correcta: r.correcta, origen: r.origen, caja: r.caja ?? null, ...(r.at ? { at: r.at } : {}) });
}
