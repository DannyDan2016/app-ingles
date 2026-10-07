import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, tarjetas, actividadDiaria, respuestas } from '@/lib/db/schema';
import { completarItem, itemsCompletados, completadosEntre } from './progreso.repo';
import { registrarRespuesta } from './respuestas.repo';
import { agregarTarjetas, contarPendientes } from './tarjetas.repo';
import { sumarActividad, MAX_SEGUNDOS_DIA } from './actividad.repo';

let userId: string;
const now = new Date('2026-10-07T15:00:00Z'); // 10:00 en Bogotá
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('progreso', () => {
  it('completarItem es idempotente', async () => {
    expect(await completarItem(testDb, userId, 'A2', 'a2-qa-01')).toBe('nuevo');
    expect(await completarItem(testDb, userId, 'A2', 'a2-qa-01')).toBe('ya');
    expect([...(await itemsCompletados(testDb, userId, 'A2'))]).toEqual(['a2-qa-01']);
    expect(await completadosEntre(testDb, userId, new Date(0), new Date(Date.now() + 1000))).toBe(1);
  });
});

describe('tarjetas', () => {
  it('agregar no duplica y deja la tarjeta para mañana en caja 1', async () => {
    expect(await agregarTarjetas(testDb, userId, 'A2', ['bug', 'fix', 'bug'], now)).toBe(2);
    expect(await agregarTarjetas(testDb, userId, 'A2', ['bug'], now)).toBe(0);
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect(t.caja).toBe(1);
    expect(t.proximaAt.toISOString()).toBe('2026-10-08T05:00:00.000Z');
  });
  it('contarPendientes: vencen hoy (Bogotá) o antes', async () => {
    await agregarTarjetas(testDb, userId, 'A2', ['bug'], now);
    expect(await contarPendientes(testDb, userId, now)).toBe(0);
    expect(await contarPendientes(testDb, userId, new Date('2026-10-08T15:00:00Z'))).toBe(1);
  });
  it('lista vacía no consulta y devuelve 0', async () => expect(await agregarTarjetas(testDb, userId, 'A2', [], now)).toBe(0));
});

describe('respuestas', () => {
  it('registra con origen y caja', async () => {
    await registrarRespuesta(testDb, { userId, itemId: 'a2-qa-01-e1', correcta: false, origen: 'leccion' });
    await registrarRespuesta(testDb, { userId, itemId: 'bug', correcta: true, origen: 'repaso', caja: 3 });
    const filas = await testDb.select().from(respuestas);
    expect(filas.map((f) => [f.origen, f.caja])).toEqual(expect.arrayContaining([['leccion', null], ['repaso', 3]]));
  });
});

describe('actividad', () => {
  it('suma por día con tope de 4 h', async () => {
    await sumarActividad(testDb, userId, '2026-10-07', 600);
    await sumarActividad(testDb, userId, '2026-10-07', 120);
    let [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(720);
    for (let i = 0; i < 30; i++) await sumarActividad(testDb, userId, '2026-10-07', 600);
    [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(MAX_SEGUNDOS_DIA);
  });
});

describe('users.meta_diaria_min', () => {
  it('por defecto 10 y rechaza valores fuera de 5/10/15', async () => {
    const [u] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(u.metaDiariaMin).toBe(10);
    await expect(testDb.update(users).set({ metaDiariaMin: 7 }).where(eq(users.id, userId))).rejects.toThrow();
  });
});
