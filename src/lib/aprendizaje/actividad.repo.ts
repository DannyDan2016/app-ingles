import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { actividadDiaria } from '@/lib/db/schema';

export const MAX_SEGUNDOS_DIA = 14_400;
export async function sumarActividad(db: Db, userId: string, dia: string, segundos: number): Promise<void> {
  await db.insert(actividadDiaria).values({ userId, fecha: dia, segundos: Math.min(segundos, MAX_SEGUNDOS_DIA) })
    .onConflictDoUpdate({
      target: [actividadDiaria.userId, actividadDiaria.fecha],
      set: { segundos: sql`least(${actividadDiaria.segundos} + ${segundos}, ${MAX_SEGUNDOS_DIA})` },
    });
}
