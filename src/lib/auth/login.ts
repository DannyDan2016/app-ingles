import { eq } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifyPassword, DUMMY_HASH } from './password';
import { hashToken } from './tokens';
import { normalizeAlias } from './alias';
import { createSession } from './sessions';
import { maybePurgeStale } from './purge';
import { countRecentFailures, isBlocked, recordFailure, clearFailures } from './rate-limit';

export async function login(
  db: Db,
  input: { alias: string; password: string; ip: string },
  now: Date,
  opts: { purgeEvery?: number } = {},
): Promise<{ ok: true; token: string; expiraAt: Date } | { ok: false; error: 'credenciales' | 'bloqueado' }> {
  const parsed = normalizeAlias(input.alias);
  // Alias inválido: no se consulta el usuario; la clave de rate limit es el texto normalizado y acotado.
  const key = parsed.ok ? parsed.alias : input.alias.trim().toLowerCase().slice(0, 64);
  const ipHash = hashToken(input.ip);
  if (isBlocked(await countRecentFailures(db, key, ipHash, now))) return { ok: false, error: 'bloqueado' };

  const [u] = parsed.ok ? await db.select().from(users).where(eq(users.alias, parsed.alias)) : [];
  const valid = await verifyPassword(u?.passwordHash ?? (await DUMMY_HASH), input.password.slice(0, 128));
  if (!u || !valid) {
    await recordFailure(db, key, ipHash, now);
    return { ok: false, error: 'credenciales' };
  }
  await clearFailures(db, key);
  const s = await createSession(db, u.id, now);
  await maybePurgeStale(db, now, { every: opts.purgeEvery });
  return { ok: true, ...s };
}
