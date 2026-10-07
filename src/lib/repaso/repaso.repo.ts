import { and, asc, eq, lte, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { tarjetas, respuestas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { diaBogota, finDia, inicioDia } from '@/lib/tiempo/bogota';
import { MAX_SESION, siguienteEstado, type Caja } from './leitner';

export async function tarjetasPendientes(db: Db, userId: string, now: Date, limite = MAX_SESION) {
  return db.select({ termino: tarjetas.termino, nivel: tarjetas.nivel, caja: tarjetas.caja }).from(tarjetas)
    .where(and(eq(tarjetas.userId, userId), lte(tarjetas.proximaAt, finDia(diaBogota(now)))))
    .orderBy(asc(tarjetas.proximaAt), asc(tarjetas.termino)).limit(limite);
}

export async function responderTarjeta(db: Db, userId: string, termino: string, nivel: Nivel, sabia: boolean, now: Date, cajaEsperada: Caja): Promise<{ caja: Caja } | null> {
  return db.transaction(async (tx) => {
    const clave = and(eq(tarjetas.userId, userId), eq(tarjetas.termino, termino), eq(tarjetas.nivel, nivel));
    const [t] = await tx.select({ caja: tarjetas.caja }).from(tarjetas).where(clave).for('update');
    if (!t) return null;
    // Reintento ya aplicado (la caja cambió desde la que vio el cliente): no se mueve dos veces.
    if (t.caja !== cajaEsperada) return { caja: t.caja as Caja };
    const sig = siguienteEstado(t.caja as Caja, sabia, diaBogota(now));
    await tx.update(tarjetas).set({
      caja: sig.caja, proximaAt: inicioDia(sig.proximaDia), ultimaAt: now,
      ...(sabia ? { aciertos: sql`${tarjetas.aciertos} + 1` } : { fallos: sql`${tarjetas.fallos} + 1` }),
    }).where(clave);
    await tx.insert(respuestas).values({ userId, itemId: termino, correcta: sabia, origen: 'repaso', caja: t.caja, at: now });
    return { caja: sig.caja };
  });
}
