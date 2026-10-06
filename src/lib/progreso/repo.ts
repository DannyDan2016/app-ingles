import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import type { Nivel } from './niveles';

export async function setNivelInicial(db: Db, userId: string, nivel: Nivel): Promise<'ok' | 'ya_elegido'> {
  const r = await db
    .update(users)
    .set({ nivelInicial: nivel })
    .where(and(eq(users.id, userId), isNull(users.nivelInicial)))
    .returning({ id: users.id });
  return r.length ? 'ok' : 'ya_elegido';
}
