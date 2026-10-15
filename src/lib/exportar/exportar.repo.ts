import { asc, count, eq, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { actividadDiaria, evaluacionIntentos, progress, respuestas, tarjetas, users } from '@/lib/db/schema';
import type { DatosExportacion } from './serializar';

/** Lee SOLO las filas de `userId`; selecciona columnas concretas (nunca password_hash ni ids). */
export async function datosExportacion(db: Db, userId: string): Promise<DatosExportacion | null> {
  const [[u], lecciones, cartas, actividad, resp, evals] = await Promise.all([
    db.select({ alias: users.alias, nivelInicial: users.nivelInicial, metaDiariaMin: users.metaDiariaMin }).from(users).where(eq(users.id, userId)),
    db.select({ leccionId: progress.leccionId, nivel: progress.nivel, completadaAt: progress.completadaAt }).from(progress)
      .where(eq(progress.userId, userId)).orderBy(asc(progress.completadaAt), asc(progress.leccionId)),
    db.select({ termino: tarjetas.termino, nivel: tarjetas.nivel, caja: tarjetas.caja, proximaAt: tarjetas.proximaAt, aciertos: tarjetas.aciertos, fallos: tarjetas.fallos })
      .from(tarjetas).where(eq(tarjetas.userId, userId)).orderBy(asc(tarjetas.nivel), asc(tarjetas.termino)),
    db.select({ fecha: actividadDiaria.fecha, segundos: actividadDiaria.segundos }).from(actividadDiaria)
      .where(eq(actividadDiaria.userId, userId)).orderBy(asc(actividadDiaria.fecha)),
    db.select({ origen: respuestas.origen, total: count(), correctas: sql<number>`count(*) filter (where ${respuestas.correcta})`.mapWith(Number) })
      .from(respuestas).where(eq(respuestas.userId, userId)).groupBy(respuestas.origen).orderBy(asc(respuestas.origen)),
    db.select({ nivel: evaluacionIntentos.nivel, estado: evaluacionIntentos.estado, nota: evaluacionIntentos.nota, iniciadoAt: evaluacionIntentos.iniciadoAt, terminadoAt: evaluacionIntentos.terminadoAt })
      .from(evaluacionIntentos).where(eq(evaluacionIntentos.userId, userId)).orderBy(asc(evaluacionIntentos.iniciadoAt)),
  ]);
  if (!u) return null;
  return { ...u, lecciones, tarjetas: cartas, actividad, respuestas: resp, evaluaciones: evals };
}
