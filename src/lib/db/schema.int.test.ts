import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from './test-utils';
import { users } from './schema';

describe('schema', () => {
  beforeEach(resetDb);
  afterAll(() => testPool.end());

  it('inserta y lee un usuario con rol por defecto aprendiz', async () => {
    const [u] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning();
    expect(u.rol).toBe('aprendiz');
    expect(u.nivelInicial).toBeNull();
  });

  it('rechaza alias duplicado', async () => {
    await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' });
    await expect(testDb.insert(users).values({ alias: 'ana', passwordHash: 'y' })).rejects.toThrow();
  });
});
