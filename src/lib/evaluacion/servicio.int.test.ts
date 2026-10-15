import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import { BLOQUES, type Evaluacion } from '@/lib/contenido/esquema';
import { iniciarIntento, responder, finalizar } from './servicio';
import { getIntento, nivelesAprobados } from './evaluacion.repo';

const banco: Evaluacion = {
  tipo: 'evaluacion', nivel: 'A2', revisado: true, recursos: [],
  preguntas: BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => ({
    id: `a2-ev-${bloque}-${i}`, tipo: 'verdadero_falso' as const, enunciado: 'E', afirmacion: 'A', correcta: true, explicacion: 'X', bloque,
  }))),
};
let ana: string; let beto: string;
beforeEach(async () => {
  await resetDb();
  [{ id: ana }, { id: beto }] = await testDb.insert(users).values([{ alias: 'ana', passwordHash: 'x' }, { alias: 'beto', passwordHash: 'x' }]).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('servicio de evaluación', () => {
  it('responder todo bien aprueba A2', async () => {
    const ahora = new Date();
    const id = await iniciarIntento(testDb, ana, banco);
    const intento = await getIntento(testDb, ana, id);
    for (const p of intento!.preguntas) expect(await responder(testDb, ana, banco, id, p, { tipo: 'verdadero_falso', valor: true }, ahora)).toBe(true);
    expect(await finalizar(testDb, ana, banco, id, ahora)).toEqual({ ok: true, intentoId: id });
    expect((await getIntento(testDb, ana, id))!.nota).toBe(100);
    expect(await nivelesAprobados(testDb, ana)).toEqual(['A2']);
  });

  it('nadie puede responder ni finalizar el intento de otro', async () => {
    const ahora = new Date();
    const id = await iniciarIntento(testDb, ana, banco);
    const [p] = (await getIntento(testDb, ana, id))!.preguntas;
    expect(await responder(testDb, beto, banco, id, p, { tipo: 'verdadero_falso', valor: true }, ahora)).toBe(false);
    expect(await finalizar(testDb, beto, banco, id, ahora)).toEqual({ ok: false, motivo: 'no_existe' });
  });
});
