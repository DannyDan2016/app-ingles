import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, invites, sessions, progress, respuestas, tarjetas, actividadDiaria } from '@/lib/db/schema';
import { resetAvance } from './reset';

let ana: string;
let beto: string;

async function sembrar(userId: string, sufijo: string) {
  await testDb.insert(progress).values({ userId, nivel: 'A2', leccionId: `a2-qa-01-${sufijo}` });
  await testDb.insert(respuestas).values({ userId, itemId: `i-${sufijo}`, correcta: true, origen: 'leccion' });
  await testDb.insert(tarjetas).values({ userId, termino: `bug-${sufijo}`, nivel: 'A2', proximaAt: new Date() });
  await testDb.insert(actividadDiaria).values({ userId, fecha: '2026-10-10', segundos: 60 });
  await testDb.insert(sessions).values({ idHash: `s-${sufijo}`, userId, expiraAt: new Date(Date.now() + 3_600_000) });
}

beforeEach(async () => {
  await resetDb();
  [{ id: ana }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x', nivelInicial: 'B1', metaDiariaMin: 15 }).returning({ id: users.id });
  [{ id: beto }] = await testDb.insert(users).values({ alias: 'beto', passwordHash: 'y' }).returning({ id: users.id });
  await testDb.insert(invites).values({ codeHash: 'h', creadoPor: ana, expiraAt: new Date(Date.now() + 3_600_000) });
  await sembrar(ana, 'a');
  await sembrar(beto, 'b');
});
afterAll(() => testPool.end());

describe('resetAvance', () => {
  it('sin confirmar solo cuenta y no borra nada', async () => {
    const r = await resetAvance(testDb, { confirmar: false });
    expect(r.aplicado).toBe(false);
    expect(r.antes).toEqual({ usuarios: 2, progress: 2, respuestas: 2, tarjetas: 2, actividad_diaria: 2, sessions: 2 });
    expect(await testDb.select().from(progress)).toHaveLength(2);
  });

  it('confirmado vacía el avance, cierra sesiones y deja a todos en A2 sin tocar cuentas ni invitaciones', async () => {
    const r = await resetAvance(testDb, { confirmar: true });
    expect(r.aplicado).toBe(true);
    expect(r.despues).toEqual({ usuarios: 2, progress: 0, respuestas: 0, tarjetas: 0, actividad_diaria: 0, sessions: 0 });
    const us = await testDb.select().from(users);
    expect(us.map((u) => u.nivelInicial)).toEqual(['A2', 'A2']);
    expect(us.find((u) => u.alias === 'ana')?.passwordHash).toBe('x');
    expect(us.find((u) => u.alias === 'ana')?.metaDiariaMin).toBe(15);
    expect(await testDb.select().from(invites)).toHaveLength(1);
  });

  it('con alias solo resetea a ese usuario', async () => {
    const r = await resetAvance(testDb, { confirmar: true, alias: 'beto' });
    expect(r.despues).toEqual({ usuarios: 1, progress: 0, respuestas: 0, tarjetas: 0, actividad_diaria: 0, sessions: 0 });
    expect(await testDb.select().from(progress).where(eq(progress.userId, ana))).toHaveLength(1);
    const [a] = await testDb.select().from(users).where(eq(users.id, ana));
    expect(a.nivelInicial).toBe('B1');
  });

  it('con alias inexistente falla sin borrar', async () => {
    await expect(resetAvance(testDb, { confirmar: true, alias: 'nadie' })).rejects.toThrow('No existe el usuario "nadie"');
    expect(await testDb.select().from(progress)).toHaveLength(2);
  });
});
