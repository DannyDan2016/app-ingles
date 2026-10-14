import { and, count, eq, lte } from 'drizzle-orm';
import type { DbOrTx } from '@/lib/db/client';
import { tarjetas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { diaBogota, finDia, inicioDia, sumarDias } from '@/lib/tiempo/bogota';

/** Tope de tarjetas por usuario (H2): evita crecimiento sin límite desde `guardarTerminoAction`. */
export const MAX_TARJETAS_USUARIO = 5000;

/** Devuelve cuántas tarjetas nuevas se crearon; nunca deja al usuario por encima de `max`. */
export async function agregarTarjetas(db: DbOrTx, userId: string, nivel: Nivel, terminos: string[], now: Date, max = MAX_TARJETAS_USUARIO): Promise<number> {
  const unicos = [...new Set(terminos)];
  if (!unicos.length) return 0;
  const [{ n }] = await db.select({ n: count() }).from(tarjetas).where(eq(tarjetas.userId, userId));
  const hueco = max - n;
  if (hueco <= 0) return 0;
  unicos.splice(hueco);
  const proximaAt = inicioDia(sumarDias(diaBogota(now), 1));
  const r = await db.insert(tarjetas).values(unicos.map((termino) => ({ userId, termino, nivel, caja: 1, proximaAt })))
    .onConflictDoNothing().returning({ t: tarjetas.termino });
  return r.length;
}
export async function contarPendientes(db: DbOrTx, userId: string, now: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(tarjetas).where(and(eq(tarjetas.userId, userId), lte(tarjetas.proximaAt, finDia(diaBogota(now)))));
  return r.n;
}
