import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, actividadDiaria, respuestas, tarjetas, progress } from '@/lib/db/schema';
import { datosExportacion } from './exportar.repo';
import { serializarProgreso } from './serializar';

let ana: string;
let beto: string;
beforeEach(async () => {
  await resetDb();
  [{ id: ana }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'hash-secreto-ana', nivelInicial: 'A2', metaDiariaMin: 15 }).returning({ id: users.id });
  [{ id: beto }] = await testDb.insert(users).values({ alias: 'beto', passwordHash: 'hash-secreto-beto' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('datosExportacion', () => {
  it('devuelve solo los datos del usuario pedido', async () => {
    await testDb.insert(progress).values([
      { userId: ana, nivel: 'A2', leccionId: 'l-ana', completadaAt: new Date('2026-10-06T15:00:00Z') },
      { userId: beto, nivel: 'A2', leccionId: 'l-beto' },
    ]);
    await testDb.insert(tarjetas).values([
      { userId: ana, termino: 'api', nivel: 'A2', caja: 2, proximaAt: new Date('2026-10-10T12:00:00Z') },
      { userId: beto, termino: 'solo-beto', nivel: 'A2', proximaAt: new Date() },
    ]);
    await testDb.insert(actividadDiaria).values([{ userId: ana, fecha: '2026-10-06', segundos: 90 }, { userId: beto, fecha: '2026-10-06', segundos: 999 }]);
    await testDb.insert(respuestas).values([
      { userId: ana, itemId: 'a', correcta: true, origen: 'repaso', caja: 1 },
      { userId: ana, itemId: 'b', correcta: false, origen: 'repaso', caja: 1 },
      { userId: ana, itemId: 'c', correcta: true, origen: 'leccion' },
      { userId: beto, itemId: 'x', correcta: true, origen: 'leccion' },
    ]);
    const d = await datosExportacion(testDb, ana);
    expect(d).not.toBeNull();
    expect(d).toMatchObject({ alias: 'ana', nivelInicial: 'A2', metaDiariaMin: 15 });
    expect(d!.lecciones.map((l) => l.leccionId)).toEqual(['l-ana']);
    expect(d!.tarjetas.map((t) => t.termino)).toEqual(['api']);
    expect(d!.actividad).toEqual([{ fecha: '2026-10-06', segundos: 90 }]);
    expect(d!.respuestas).toEqual([
      { origen: 'leccion', total: 1, correctas: 1 },
      { origen: 'repaso', total: 2, correctas: 1 },
    ]);
    const json = JSON.stringify(serializarProgreso(d!, new Date()));
    expect(json).not.toMatch(/beto|hash-secreto|solo-beto/);
  });
  it('usuario inexistente → null', async () => {
    expect(await datosExportacion(testDb, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
  it('usuario sin actividad → listas vacías', async () => {
    const d = await datosExportacion(testDb, beto);
    expect(d).toMatchObject({ alias: 'beto', lecciones: [], tarjetas: [], actividad: [], respuestas: [] });
  });
});
