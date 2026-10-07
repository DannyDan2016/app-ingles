import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, sessions, loginAttempts } from '@/lib/db/schema';
import { hashPassword } from './password';
import { purgeStale, maybePurgeStale } from './purge';
import { login } from './login';
import { registerLimited } from './register';

const now = new Date('2026-10-10T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);
const DAY = 86_400_000;
let userId: string;

beforeEach(async () => {
  await resetDb();
  const [u] = await testDb.insert(users).values({ alias: 'ana', passwordHash: await hashPassword('una-clave-larga') }).returning();
  userId = u.id;
  await testDb.insert(loginAttempts).values([
    { alias: 'viejo', ipHash: 'h', at: ago(2 * DAY) },
    { alias: 'reciente', ipHash: 'h', at: ago(23 * 3_600_000) },
  ]);
  await testDb.insert(sessions).values([
    { idHash: 'caducada', userId, expiraAt: ago(1000), createdAt: ago(31 * DAY) },
    { idHash: 'vigente', userId, expiraAt: new Date(now.getTime() + DAY), createdAt: ago(DAY) },
  ]);
});
afterAll(() => testPool.end());

describe('purga', () => {
  it('borra intentos de más de 1 día y sesiones caducadas, sin tocar lo vigente', async () => {
    const r = await purgeStale(testDb, now);
    expect(r).toEqual({ intentos: 1, sesiones: 1 });
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).toEqual(['reciente']);
    expect((await testDb.select().from(sessions)).map((s) => s.idHash)).toEqual(['vigente']);
  });
  it('maybePurgeStale respeta la probabilidad inyectada', async () => {
    await maybePurgeStale(testDb, now, { every: 10, random: () => 0.5 });
    expect(await testDb.select().from(sessions)).toHaveLength(2);
    await maybePurgeStale(testDb, now, { every: 10, random: () => 0.05 });
    expect(await testDb.select().from(sessions)).toHaveLength(1);
  });
  it('si la purga falla, registra y no lanza', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      maybePurgeStale(testDb, now, { every: 1, random: () => 0, purge: async () => { throw new Error('boom'); } }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('respeta el límite por ejecución y deja el resto para la siguiente', async () => {
    await testDb.insert(loginAttempts).values(Array.from({ length: 5 }, (_, i) => ({ alias: `v${i}`, ipHash: 'h', at: ago(3 * DAY) })));
    const r = await purgeStale(testDb, now, { limit: 2 });
    expect(r.intentos).toBe(2);
    expect(await testDb.select().from(loginAttempts)).toHaveLength(1 + 5 + 1 - 2); // 'viejo' + 5 + 'reciente' - 2
    const r2 = await purgeStale(testDb, now, { limit: 100 });
    expect(r2.intentos).toBe(4);
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).toEqual(['reciente']);
  });
  it('limita también las sesiones caducadas', async () => {
    await testDb.insert(sessions).values(Array.from({ length: 4 }, (_, i) => ({ idHash: `c${i}`, userId, expiraAt: ago(1000) })));
    expect((await purgeStale(testDb, now, { limit: 3 })).sesiones).toBe(3);
    expect(await testDb.select().from(sessions)).toHaveLength(3); // 6 filas (5 caducadas + 1 vigente) - 3 borradas
  });
  it('un login correcto dispara la purga y sigue devolviendo la sesión', async () => {
    const r = await login(testDb, { alias: 'ana', password: 'una-clave-larga', ip: '1.1.1.1' }, now, { purge: { every: 1, random: () => 0 } });
    expect(r.ok).toBe(true);
    expect((await testDb.select().from(sessions)).map((s) => s.idHash)).not.toContain('caducada');
  });
  it('un login FALLIDO también dispara la purga', async () => {
    const r = await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, now, { purge: { every: 1, random: () => 0 } });
    expect(r).toEqual({ ok: false, error: 'credenciales' });
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).not.toContain('viejo');
  });
  it('un registro fallido también dispara la purga', async () => {
    const r = await registerLimited(testDb, { code: 'x'.repeat(43), alias: 'bea', password: 'una-clave-larga', ip: '3.3.3.3' }, now, {
      purge: { every: 1, random: () => 0 },
    });
    expect(r.ok).toBe(false);
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).not.toContain('viejo');
  });
  it('con schedule, la purga no corre en línea: se programa y corre al invocarla', async () => {
    const programadas: Array<() => Promise<void>> = [];
    await login(testDb, { alias: 'ana', password: 'mala-clave-xx', ip: '1.1.1.1' }, now, {
      purge: { every: 1, random: () => 0, schedule: (fn) => void programadas.push(fn) },
    });
    expect(programadas).toHaveLength(1);
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).toContain('viejo');
    await programadas[0]();
    expect((await testDb.select().from(loginAttempts)).map((a) => a.alias)).not.toContain('viejo');
  });
  it('si la purga programada falla, no lanza', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const programadas: Array<() => Promise<void>> = [];
    await maybePurgeStale(testDb, now, {
      every: 1, random: () => 0, purge: async () => { throw new Error('boom'); }, schedule: (fn) => void programadas.push(fn),
    });
    await expect(programadas[0]()).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
