import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, actividadDiaria, respuestas, tarjetas, progress } from '@/lib/db/schema';
import { datosSemana, tarjetasPorCaja } from './avance.repo';
import { setMetaDiaria } from '@/lib/progreso/repo';

let userId: string;
// Miércoles 2026-10-07, 10:00 en Bogotá. Semana actual: 2026-10-05 .. 2026-10-11.
const NOW = new Date('2026-10-07T15:00:00Z');
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('datosSemana', () => {
  it('solo devuelve lo de la semana actual (lunes-domingo, hora de Bogotá)', async () => {
    await testDb.insert(actividadDiaria).values([
      { userId, fecha: '2026-10-04', segundos: 500 }, // domingo anterior
      { userId, fecha: '2026-10-05', segundos: 120 },
      { userId, fecha: '2026-10-07', segundos: 300 },
    ]);
    await testDb.insert(respuestas).values([
      { userId, itemId: 'a', correcta: true, origen: 'repaso', caja: 3, at: new Date('2026-10-05T04:59:00Z') }, // dom 23:59 Bogotá: semana pasada
      { userId, itemId: 'b', correcta: true, origen: 'repaso', caja: 3, at: new Date('2026-10-05T05:00:00Z') }, // lun 00:00 Bogotá
      { userId, itemId: 'c', correcta: false, origen: 'repaso', caja: 4, at: new Date('2026-10-07T14:00:00Z') },
      { userId, itemId: 'd', correcta: true, origen: 'leccion', at: new Date('2026-10-07T14:00:00Z') }, // no es repaso
    ]);
    await testDb.insert(tarjetas).values([
      { userId, termino: 't1', nivel: 'A2', caja: 4, proximaAt: NOW },
      { userId, termino: 't2', nivel: 'A2', caja: 2, proximaAt: NOW },
    ]);
    await testDb.insert(progress).values([
      { userId, nivel: 'A2', leccionId: 'l1', completadaAt: new Date('2026-10-06T15:00:00Z') },
      { userId, nivel: 'A2', leccionId: 'l0', completadaAt: new Date('2026-10-01T15:00:00Z') },
    ]);
    const d = await datosSemana(testDb, userId, NOW);
    expect(d.hoy).toBe('2026-10-07');
    expect(d.actividad.map((a) => a.fecha).sort()).toEqual(['2026-10-05', '2026-10-07']);
    expect(d.repasos).toHaveLength(2);
    expect(d.consolidadasTotal).toBe(1);
    expect(d.leccionesSemana).toBe(1);
    expect(d.metaDiariaMin).toBe(10);
  });
});

describe('tarjetasPorCaja', () => {
  it('incluye ceros', async () => {
    expect(await tarjetasPorCaja(testDb, userId)).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    await testDb.insert(tarjetas).values([
      { userId, termino: 'a', nivel: 'A2', caja: 1, proximaAt: NOW },
      { userId, termino: 'b', nivel: 'A2', caja: 1, proximaAt: NOW },
      { userId, termino: 'c', nivel: 'A2', caja: 5, proximaAt: NOW },
    ]);
    expect(await tarjetasPorCaja(testDb, userId)).toEqual({ 1: 2, 2: 0, 3: 0, 4: 0, 5: 1 });
  });
});

describe('setMetaDiaria', () => {
  it('guarda 15', async () => {
    await setMetaDiaria(testDb, userId, 15);
    const [u] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(u.metaDiariaMin).toBe(15);
  });
});
