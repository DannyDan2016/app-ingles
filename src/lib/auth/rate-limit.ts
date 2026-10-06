import { and, eq, gt, count } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { loginAttempts } from '@/lib/db/schema';

export const WINDOW_MINUTES = 15;
const MAX_ALIAS = 5;
const MAX_IP = 20;

export function isBlocked(c: { alias: number; ip: number }): boolean {
  return c.alias >= MAX_ALIAS || c.ip >= MAX_IP;
}

export async function countRecentFailures(db: Db, alias: string, ipHash: string, now: Date) {
  const since = new Date(now.getTime() - WINDOW_MINUTES * 60_000);
  const [a] = await db.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.alias, alias), gt(loginAttempts.at, since)));
  const [i] = await db.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.ipHash, ipHash), gt(loginAttempts.at, since)));
  return { alias: a.n, ip: i.n };
}

export async function recordFailure(db: Db, alias: string, ipHash: string, now: Date): Promise<void> {
  await db.insert(loginAttempts).values({ alias, ipHash, at: now });
}

export async function clearFailures(db: Db, alias: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.alias, alias));
}
