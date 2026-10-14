import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, tarjetas, actividadDiaria, respuestas } from '@/lib/db/schema';
import { completarItem, itemsCompletados, completadosEntre } from './progreso.repo';
import { registrarRespuesta, registrarRespuestaConTarjetas, podarRespuestas } from './respuestas.repo';
import { agregarTarjetas, contarPendientes } from './tarjetas.repo';
import { sumarActividad, MAX_SEGUNDOS_DIA, VENTANA_ACTIVIDAD_S } from './actividad.repo';

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
  it('tope por usuario: no crea más tarjetas de las permitidas y no afecta a otro usuario', async () => {
    expect(await agregarTarjetas(testDb, userId, 'A2', ['a', 'b'], now, 3)).toBe(2);
    expect(await agregarTarjetas(testDb, userId, 'A2', ['c', 'd', 'e'], now, 3)).toBe(1);
    expect(await agregarTarjetas(testDb, userId, 'A2', ['f'], now, 3)).toBe(0);
    expect(await testDb.select().from(tarjetas).where(eq(tarjetas.userId, userId))).toHaveLength(3);
    const [otro] = await testDb.insert(users).values({ alias: 'luis', passwordHash: 'x' }).returning({ id: users.id });
    expect(await agregarTarjetas(testDb, otro.id, 'A2', ['a'], now, 3)).toBe(1);
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

describe('podarRespuestas', () => {
  it('conserva solo las N más recientes del usuario y no toca a otros', async () => {
    const [otro] = await testDb.insert(users).values({ alias: 'luis', passwordHash: 'x' }).returning({ id: users.id });
    for (let i = 1; i <= 5; i++) await registrarRespuesta(testDb, { userId, itemId: `e${i}`, correcta: true, origen: 'leccion', at: new Date(2026, 9, i) });
    await registrarRespuesta(testDb, { userId: otro.id, itemId: 'x', correcta: true, origen: 'leccion', at: new Date(2020, 0, 1) });
    await podarRespuestas(testDb, userId, 3);
    const mias = await testDb.select().from(respuestas).where(eq(respuestas.userId, userId));
    expect(mias.map((f) => f.itemId).sort()).toEqual(['e3', 'e4', 'e5']);
    expect(await testDb.select().from(respuestas).where(eq(respuestas.userId, otro.id))).toHaveLength(1);
  });
});

describe('registrarRespuestaConTarjetas (atómico)', () => {
  it('guarda la respuesta y las tarjetas juntas', async () => {
    await registrarRespuestaConTarjetas(testDb, { userId, itemId: 'a2-qa-01-e1', correcta: false, origen: 'leccion' }, { nivel: 'A2', terminos: ['bug'], now });
    expect(await testDb.select().from(respuestas)).toHaveLength(1);
    expect(await testDb.select().from(tarjetas)).toHaveLength(1);
  });
  it('si fallan las tarjetas no queda la respuesta: el reintento no duplica filas', async () => {
    const malas = { nivel: 'ZZ' as never, terminos: ['bug'], now };
    const intento = () => registrarRespuestaConTarjetas(testDb, { userId, itemId: 'a2-qa-01-e1', correcta: false, origen: 'leccion' }, malas);
    await expect(intento()).rejects.toThrow();
    await expect(intento()).rejects.toThrow();
    expect(await testDb.select().from(respuestas)).toHaveLength(0);
    await registrarRespuestaConTarjetas(testDb, { userId, itemId: 'a2-qa-01-e1', correcta: false, origen: 'leccion' }, { nivel: 'A2', terminos: ['bug'], now });
    expect(await testDb.select().from(respuestas)).toHaveLength(1);
  });
});

describe('actividad', () => {
  it('suma por día con tope de 4 h', async () => {
    await sumarActividad(testDb, userId, '2026-10-07', 600);
    await sumarActividad(testDb, userId, '2026-10-07', 120);
    let [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(720);
    for (let i = 0; i < 30; i++) await sumarActividad(testDb, userId, '2026-10-07', 600, { maxPorVentana: 1000 });
    [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(MAX_SEGUNDOS_DIA);
  });
});

describe('actividad: rate limit por ventana', () => {
  const fila = async () => (await testDb.select().from(actividadDiaria))[0];
  it('rechaza (false) al pasar de N envíos por ventana y no suma esos segundos', async () => {
    const r = [];
    for (let i = 0; i < 4; i++) r.push(await sumarActividad(testDb, userId, '2026-10-07', 10, { maxPorVentana: 3 }));
    expect(r).toEqual([true, true, true, false]);
    expect((await fila()).segundos).toBe(30);
  });
  it('al terminar la ventana vuelve a aceptar', async () => {
    for (let i = 0; i < 3; i++) await sumarActividad(testDb, userId, '2026-10-07', 10, { maxPorVentana: 3 });
    expect(await sumarActividad(testDb, userId, '2026-10-07', 10, { maxPorVentana: 3 })).toBe(false);
    await testDb.update(actividadDiaria).set({ ventanaInicio: new Date(Date.now() - 2 * VENTANA_ACTIVIDAD_S * 1000) });
    expect(await sumarActividad(testDb, userId, '2026-10-07', 10, { maxPorVentana: 3 })).toBe(true);
    expect((await fila()).segundos).toBe(40);
  });
  it('es por usuario', async () => {
    const [otro] = await testDb.insert(users).values({ alias: 'luis', passwordHash: 'x' }).returning({ id: users.id });
    for (let i = 0; i < 3; i++) await sumarActividad(testDb, userId, '2026-10-07', 10, { maxPorVentana: 3 });
    expect(await sumarActividad(testDb, otro.id, '2026-10-07', 10, { maxPorVentana: 3 })).toBe(true);
  });
});

describe('users.meta_diaria_min', () => {
  it('por defecto 10 y rechaza valores fuera de 5/10/15', async () => {
    const [u] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(u.metaDiariaMin).toBe(10);
    await expect(testDb.update(users).set({ metaDiariaMin: 7 }).where(eq(users.id, userId))).rejects.toThrow();
  });
});
