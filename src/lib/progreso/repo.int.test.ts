import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import { setNivelInicial } from './repo';

let userId: string;
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('setNivelInicial', () => {
  it('se elige una sola vez', async () => {
    expect(await setNivelInicial(testDb, userId, 'A2')).toBe('ok');
    expect(await setNivelInicial(testDb, userId, 'B1')).toBe('ya_elegido');
    const [u] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(u.nivelInicial).toBe('A2');
  });
});
