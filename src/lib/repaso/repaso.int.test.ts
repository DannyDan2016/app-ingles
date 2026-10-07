import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, tarjetas, respuestas } from '@/lib/db/schema';
import { tarjetasPendientes, responderTarjeta } from './repaso.repo';

let userId: string;
const now = new Date('2026-10-07T15:00:00Z');
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
  await testDb.insert(tarjetas).values([
    { userId, termino: 'bug', nivel: 'A2', caja: 3, proximaAt: new Date('2026-10-01T05:00:00Z') },
    { userId, termino: 'fix', nivel: 'A2', caja: 1, proximaAt: new Date('2026-10-07T05:00:00Z') },
    { userId, termino: 'api', nivel: 'A2', caja: 1, proximaAt: new Date('2026-10-08T05:00:00Z') },
  ]);
});
afterAll(() => testPool.end());

describe('repaso', () => {
  it('pendientes: vencidas, más atrasadas primero, con límite', async () => {
    expect((await tarjetasPendientes(testDb, userId, now)).map((t) => t.termino)).toEqual(['bug', 'fix']);
    expect(await tarjetasPendientes(testDb, userId, now, 1)).toHaveLength(1);
  });
  it('«La sabía» sube de caja y registra la caja anterior', async () => {
    expect(await responderTarjeta(testDb, userId, 'bug', 'A2', true, now)).toEqual({ caja: 4 });
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect(t.proximaAt.toISOString()).toBe('2026-10-21T05:00:00.000Z');
    expect(t.aciertos).toBe(1);
    const [r] = await testDb.select().from(respuestas);
    expect([r.origen, r.itemId, r.caja, r.correcta]).toEqual(['repaso', 'bug', 3, true]);
  });
  it('«No la sabía» → caja 1 mañana', async () => {
    expect(await responderTarjeta(testDb, userId, 'bug', 'A2', false, now)).toEqual({ caja: 1 });
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect([t.caja, t.fallos, t.proximaAt.toISOString()]).toEqual([1, 1, '2026-10-08T05:00:00.000Z']);
  });
  it('tarjeta inexistente → null', async () => {
    expect(await responderTarjeta(testDb, userId, 'nada', 'A2', true, now)).toBeNull();
    expect(await testDb.select().from(respuestas)).toHaveLength(0);
  });
});
