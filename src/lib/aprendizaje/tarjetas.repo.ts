import { and, count, eq, lte } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { tarjetas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { diaBogota, finDia, inicioDia, sumarDias } from '@/lib/tiempo/bogota';

export async function agregarTarjetas(db: Db, userId: string, nivel: Nivel, terminos: string[], now: Date): Promise<number> {
  const unicos = [...new Set(terminos)];
  if (!unicos.length) return 0;
  const proximaAt = inicioDia(sumarDias(diaBogota(now), 1));
  const r = await db.insert(tarjetas).values(unicos.map((termino) => ({ userId, termino, nivel, caja: 1, proximaAt })))
    .onConflictDoNothing().returning({ t: tarjetas.termino });
  return r.length;
}
export async function contarPendientes(db: Db, userId: string, now: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(tarjetas).where(and(eq(tarjetas.userId, userId), lte(tarjetas.proximaAt, finDia(diaBogota(now)))));
  return r.n;
}
