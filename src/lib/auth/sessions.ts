import { and, eq, gt } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { sessions, users, nivelEnum } from '@/lib/db/schema';
import { generateToken, hashToken } from './tokens';

export const SESSION_TTL_DAYS = 30;

type Nivel = (typeof nivelEnum.enumValues)[number];

export async function createSession(db: Db, userId: string, now: Date): Promise<{ token: string; expiraAt: Date }> {
  const token = generateToken();
  const expiraAt = new Date(now.getTime() + SESSION_TTL_DAYS * 86_400_000);
  await db.insert(sessions).values({ idHash: hashToken(token), userId, expiraAt, createdAt: now });
  return { token, expiraAt };
}

export async function validateSession(
  db: Db,
  token: string,
  now: Date,
): Promise<{ userId: string; alias: string; rol: 'admin' | 'aprendiz'; nivelInicial: Nivel | null } | null> {
  const [row] = await db
    .select({ userId: users.id, alias: users.alias, rol: users.rol, nivelInicial: users.nivelInicial })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.idHash, hashToken(token)), gt(sessions.expiraAt, now)));
  return row ?? null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.idHash, hashToken(token)));
}
