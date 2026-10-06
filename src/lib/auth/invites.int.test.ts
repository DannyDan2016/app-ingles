import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, invites } from '@/lib/db/schema';
import { createInvite, revokeInvite, registerWithInvite, checkInviteCode, listInvites } from './invites';

const now = new Date('2026-10-10T12:00:00Z');
let adminId: string;

beforeEach(async () => {
  await resetDb();
  const [a] = await testDb.insert(users).values({ alias: 'admin', passwordHash: 'x', rol: 'admin' }).returning();
  adminId = a.id;
});
afterAll(() => testPool.end());

describe('invitaciones', () => {
  it('guarda solo el hash del código y caduca a los 7 días', async () => {
    const inv = await createInvite(testDb, adminId, now);
    const [row] = await testDb.select().from(invites).where(eq(invites.id, inv.id));
    expect(row.codeHash).not.toBe(inv.code);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(inv.expiraAt.toISOString()).toBe('2026-10-17T12:00:00.000Z');
  });

  it('registra con código válido y marca la invitación como usada', async () => {
    const { code } = await createInvite(testDb, adminId, now);
    const r = await registerWithInvite(testDb, { code, alias: ' Ana ', password: 'una-clave-larga' }, now);
    expect(r.ok).toBe(true);
    expect(await checkInviteCode(testDb, code, now)).toBe('usada');
    const [u] = await testDb.select().from(users).where(eq(users.alias, 'ana'));
    expect(u.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('rechaza código inexistente, revocado y caducado', async () => {
    expect(await registerWithInvite(testDb, { code: 'nope', alias: 'ana', password: 'una-clave-larga' }, now))
      .toEqual({ ok: false, error: 'inexistente' });
    const inv = await createInvite(testDb, adminId, now);
    await revokeInvite(testDb, inv.id, now);
    expect(await registerWithInvite(testDb, { code: inv.code, alias: 'ana', password: 'una-clave-larga' }, now))
      .toEqual({ ok: false, error: 'revocada' });
    const inv2 = await createInvite(testDb, adminId, now);
    const later = new Date('2026-10-18T00:00:00Z');
    expect(await registerWithInvite(testDb, { code: inv2.code, alias: 'ana', password: 'una-clave-larga' }, later))
      .toEqual({ ok: false, error: 'caducada' });
  });

  it('alias ocupado no consume la invitación', async () => {
    const { code } = await createInvite(testDb, adminId, now);
    expect(await registerWithInvite(testDb, { code, alias: 'ADMIN', password: 'una-clave-larga' }, now))
      .toEqual({ ok: false, error: 'alias_ocupado' });
    expect(await checkInviteCode(testDb, code, now)).toBe('valida');
  });

  it('dos registros simultáneos con el mismo código crean un solo usuario', async () => {
    const { code } = await createInvite(testDb, adminId, now);
    const [a, b] = await Promise.all([
      registerWithInvite(testDb, { code, alias: 'uno', password: 'una-clave-larga' }, now),
      registerWithInvite(testDb, { code, alias: 'dos', password: 'una-clave-larga' }, now),
    ]);
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect(await testDb.select().from(users)).toHaveLength(2); // admin + 1
  });

  it('lista invitaciones sin exponer el hash', async () => {
    await createInvite(testDb, adminId, now);
    const list = await listInvites(testDb);
    expect(list).toHaveLength(1);
    expect(Object.keys(list[0])).not.toContain('codeHash');
  });
});
