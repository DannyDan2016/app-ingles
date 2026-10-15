import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import * as repo from './evaluacion.repo';

let userId: string;
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('repo de evaluación', () => {
  it('crea un solo intento abierto, guarda respuestas, cierra y cuenta el nivel como aprobado', async () => {
    const id = await repo.crearIntento(testDb, { userId, nivel: 'A2', preguntas: ['q1', 'q2'] });
    expect(await repo.crearIntento(testDb, { userId, nivel: 'A2', preguntas: ['q3'] })).toBe(id);
    await repo.guardarRespuesta(testDb, id, 'q1', '{"tipo":"verdadero_falso","valor":true}');
    await repo.guardarRespuesta(testDb, id, 'q1', '{"tipo":"verdadero_falso","valor":false}');
    expect((await repo.respuestasDe(testDb, id)).get('q1')).toContain('false');
    await repo.cerrarIntento(testDb, id, { estado: 'aprobado', nota: 85, bloques: { lectura: 80, listening: 80, vocabulario: 100, gramatica: 80 }, ahora: new Date() });
    expect(await repo.nivelesAprobados(testDb, userId)).toEqual(['A2']);
    expect(await repo.intentoAbierto(testDb, userId, 'A2')).toBeNull();
  });
});
