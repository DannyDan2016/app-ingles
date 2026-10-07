import { and, between, count, eq, gte } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { actividadDiaria, respuestas, tarjetas, users } from '@/lib/db/schema';
import { completadosEntre } from '@/lib/aprendizaje/progreso.repo';
import { diaBogota, finDia, inicioDia, lunesDe, sumarDias } from '@/lib/tiempo/bogota';
import type { DatosSemana } from './semana';

export async function datosSemana(db: Db, userId: string, now: Date): Promise<DatosSemana> {
  const hoy = diaBogota(now);
  const lunes = lunesDe(hoy);
  const domingo = sumarDias(lunes, 6);
  const desde = inicioDia(lunes);
  const hasta = finDia(domingo);
  const [actividad, repasos, [cons], leccionesSemana, [u]] = await Promise.all([
    db.select({ fecha: actividadDiaria.fecha, segundos: actividadDiaria.segundos }).from(actividadDiaria)
      .where(and(eq(actividadDiaria.userId, userId), between(actividadDiaria.fecha, lunes, domingo))),
    db.select({ correcta: respuestas.correcta, caja: respuestas.caja }).from(respuestas)
      .where(and(eq(respuestas.userId, userId), eq(respuestas.origen, 'repaso'), between(respuestas.at, desde, hasta))),
    db.select({ n: count() }).from(tarjetas).where(and(eq(tarjetas.userId, userId), gte(tarjetas.caja, 4))),
    completadosEntre(db, userId, desde, hasta),
    db.select({ meta: users.metaDiariaMin }).from(users).where(eq(users.id, userId)),
  ]);
  return { hoy, metaDiariaMin: u?.meta ?? 10, actividad, repasos, consolidadasTotal: cons.n, leccionesSemana };
}

export async function tarjetasPorCaja(db: Db, userId: string): Promise<Record<1 | 2 | 3 | 4 | 5, number>> {
  const filas = await db.select({ caja: tarjetas.caja, n: count() }).from(tarjetas).where(eq(tarjetas.userId, userId)).groupBy(tarjetas.caja);
  const r: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const f of filas) if (f.caja >= 1 && f.caja <= 5) r[f.caja as 1 | 2 | 3 | 4 | 5] = f.n;
  return r;
}
