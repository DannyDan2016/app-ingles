import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { actividadDiaria } from '@/lib/db/schema';

export const MAX_SEGUNDOS_DIA = 14_400;
/** Rate limit por usuario: como máximo N envíos aceptados por ventana (el cliente envía ~1 cada 2 min). */
export const VENTANA_ACTIVIDAD_S = 60;
export const MAX_ENVIOS_VENTANA = 20;

/**
 * Suma segundos al día. Devuelve false (sin sumar) si el usuario superó el límite de envíos de la ventana.
 * El contador vive en la propia fila (`ventana_*`) y se actualiza en la misma sentencia atómica, así que
 * funciona entre instancias serverless sin memoria compartida ni servicios externos.
 */
export async function sumarActividad(db: Db, userId: string, dia: string, segundos: number, opts: { maxPorVentana?: number } = {}): Promise<boolean> {
  const max = opts.maxPorVentana ?? MAX_ENVIOS_VENTANA;
  const t = actividadDiaria;
  const ventanaVencida = sql`(${t.ventanaInicio} is null or now() - ${t.ventanaInicio} >= make_interval(secs => ${VENTANA_ACTIVIDAD_S}))`;
  const r = await db.insert(t).values({ userId, fecha: dia, segundos: Math.min(segundos, MAX_SEGUNDOS_DIA), ventanaInicio: sql`now()`, ventanaN: 1 })
    .onConflictDoUpdate({
      target: [t.userId, t.fecha],
      set: {
        segundos: sql`least(${t.segundos} + ${segundos}, ${MAX_SEGUNDOS_DIA})`,
        ventanaN: sql`case when ${ventanaVencida} then 1 else ${t.ventanaN} + 1 end`,
        ventanaInicio: sql`case when ${ventanaVencida} then now() else ${t.ventanaInicio} end`,
      },
      setWhere: sql`${ventanaVencida} or ${t.ventanaN} < ${max}`,
    })
    .returning({ u: t.userId });
  return r.length > 0;
}
