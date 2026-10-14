import { count, eq, inArray } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { users, sessions, progress, respuestas, tarjetas, actividadDiaria } from '@/lib/db/schema';
import { NIVEL_POR_DEFECTO } from './niveles';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export type Conteo = {
  usuarios: number;
  progress: number;
  respuestas: number;
  tarjetas: number;
  actividad_diaria: number;
  sessions: number;
};

const TABLAS = { progress, respuestas, tarjetas, actividad_diaria: actividadDiaria, sessions } as const;

async function contar(tx: Tx, ids: string[]): Promise<Conteo> {
  const c = { usuarios: ids.length } as Conteo;
  for (const [nombre, t] of Object.entries(TABLAS)) {
    const [{ n }] = await tx.select({ n: count() }).from(t).where(inArray(t.userId, ids));
    c[nombre as keyof typeof TABLAS] = n;
  }
  return c;
}

/**
 * Deja el avance en cero: vacía progreso, respuestas, tarjetas y actividad, cierra sesiones y fija el nivel
 * inicial en A2. Cuentas, contraseñas, metas e invitaciones no se tocan. Sin `confirmar` solo cuenta.
 */
export async function resetAvance(
  db: Db,
  { confirmar, alias }: { confirmar: boolean; alias?: string },
): Promise<{ aplicado: boolean; antes: Conteo; despues: Conteo }> {
  return db.transaction(async (tx) => {
    const filas = await tx.select({ id: users.id }).from(users).where(alias ? eq(users.alias, alias) : undefined);
    if (alias && !filas.length) throw new Error(`No existe el usuario "${alias}"`);
    const ids = filas.map((f) => f.id);
    const antes = await contar(tx, ids);
    if (!confirmar || !ids.length) return { aplicado: false, antes, despues: antes };

    for (const t of Object.values(TABLAS)) await tx.delete(t).where(inArray(t.userId, ids));
    await tx.update(users).set({ nivelInicial: NIVEL_POR_DEFECTO }).where(inArray(users.id, ids));
    return { aplicado: true, antes, despues: await contar(tx, ids) };
  });
}
