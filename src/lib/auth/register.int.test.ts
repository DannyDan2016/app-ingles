import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import { createInvite } from './invites';
import { registerLimited } from './register';
import { hashPassword } from './password';

// Seam: el módulo real envuelto en un spy, para comprobar CUÁNDO se llama a argon2.
vi.mock('./password', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./password')>();
  return { ...orig, hashPassword: vi.fn(orig.hashPassword) };
});

const now = new Date('2026-10-10T12:00:00Z');
const base = { alias: 'ana', password: 'una-clave-larga', ip: '9.9.9.9' };
let adminId: string;

beforeEach(async () => {
  vi.mocked(hashPassword).mockClear();
  await resetDb();
  const [a] = await testDb.insert(users).values({ alias: 'admin', passwordHash: 'x', rol: 'admin' }).returning();
  adminId = a.id;
});
afterAll(() => testPool.end());

describe('registro: no se calcula argon2 sin invitación válida', () => {
  it('código inexistente: error de invitación y hashPassword no se llama', async () => {
    const r = await registerLimited(testDb, { ...base, code: 'x'.repeat(43) }, now);
    expect(r).toEqual({ ok: false, error: 'inexistente' });
    expect(hashPassword).not.toHaveBeenCalled();
  });
  it('con invitación válida sí se hashea una vez', async () => {
    const { code } = await createInvite(testDb, adminId, now);
    expect((await registerLimited(testDb, { ...base, code }, now)).ok).toBe(true);
    expect(hashPassword).toHaveBeenCalledTimes(1);
  });
});

describe('registro: límite por IP', () => {
  it('bloquea al llegar a 20 fallos en 15 min, aunque cambie el alias', async () => {
    for (let i = 0; i < 20; i++) {
      const r = await registerLimited(testDb, { ...base, alias: `u${i}`.padEnd(3, '_'), code: 'y'.repeat(43) }, now);
      expect(r).toEqual({ ok: false, error: 'inexistente' });
    }
    const { code } = await createInvite(testDb, adminId, now);
    expect(await registerLimited(testDb, { ...base, code }, now)).toEqual({ ok: false, error: 'bloqueado' });
    // otra IP no se ve afectada
    expect((await registerLimited(testDb, { ...base, ip: '8.8.8.8', code }, now)).ok).toBe(true);
  });
  it('los fallos caducan a los 15 minutos', async () => {
    for (let i = 0; i < 20; i++) await registerLimited(testDb, { ...base, code: 'z'.repeat(43) }, now);
    const later = new Date(now.getTime() + 16 * 60_000);
    const { code } = await createInvite(testDb, adminId, later);
    expect((await registerLimited(testDb, { ...base, code }, later)).ok).toBe(true);
  });
});
