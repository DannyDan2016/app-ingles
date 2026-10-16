import { describe, it, expect } from 'vitest';
import { filtrarPreguntas, leerFiltro } from './filtro';
import type { PreguntaEntrevista } from '@/lib/contenido/esquema';

const p = (id: string, rol: PreguntaEntrevista['rol'], nivel: PreguntaEntrevista['nivel']): PreguntaEntrevista =>
  ({ id, rol, nivel, pregunta: 'Q?', respuesta: 'A.', estructuras: ['a', 'b', 'c', 'd'], vocabulario: [{ termino: 't', traduccion: 'tr' }] });
const lista = [p('ent-qa-01', 'qa', 'B2'), p('ent-qa-02', 'qa', 'B1'), p('ent-backend-01', 'backend', 'B2')];

describe('filtro de entrevistas', () => {
  it('filtra por rol y nivel', () => {
    expect(filtrarPreguntas(lista, { rol: 'qa', nivel: 'B2' }).map((x) => x.id)).toEqual(['ent-qa-01']);
  });
  it('@seguridad ignora valores fuera de las listas cerradas', () => {
    expect(leerFiltro({ rol: '<script>', nivel: 'Z9' })).toEqual({});
    expect(leerFiltro({ rol: 'qa', nivel: 'B2' })).toEqual({ rol: 'qa', nivel: 'B2' });
  });
});
