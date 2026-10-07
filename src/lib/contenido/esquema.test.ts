import { describe, it, expect } from 'vitest';
import { archivoSchema } from './esquema';

const ej = { id: 'a2-qa-01-e1', enunciado: 'Elige', explicacion: 'Porque…' };
const leccion = {
  tipo: 'leccion', id: 'a2-qa-01', nivel: 'A2', tema: 'qa', orden: 4, titulo: 'A Bug', objetivo: 'Puedo…',
  gramatica: 'Past simple', lectura: 'I [[tested|test]] it.', terminos: ['test'],
  ejercicios: Array.from({ length: 5 }, (_, i) => ({ ...ej, id: `a2-qa-01-e${i + 1}`, tipo: 'verdadero_falso', afirmacion: 'x', correcta: true })),
  revisado: false,
};

describe('archivoSchema', () => {
  it('acepta una lección válida', () => expect(archivoSchema.safeParse(leccion).success).toBe(true));
  it('rechaza menos de 5 ejercicios', () => {
    expect(archivoSchema.safeParse({ ...leccion, ejercicios: leccion.ejercicios.slice(0, 4) }).success).toBe(false);
  });
  it('rechaza un tipo de ejercicio desconocido', () => {
    const malos = [...leccion.ejercicios.slice(0, 4), { ...ej, id: 'x-e9', tipo: 'dictado' }];
    expect(archivoSchema.safeParse({ ...leccion, ejercicios: malos }).success).toBe(false);
  });
  it('rechaza youtubeId mal formado', () => {
    const r = archivoSchema.safeParse({ ...leccion, video: { youtubeId: 'corto', start: 0, end: 10, titulo: 't', canal: 'c' } });
    expect(r.success).toBe(false);
  });
  it('acepta un glosario', () => {
    const g = { tipo: 'glosario', nivel: 'A2', tema: 'qa', entradas: [
      { termino: 'bug', categoria: 'noun', traduccion_es: 'error', definicion_en: 'A problem in software.', ejemplo_en: 'I found a bug.', nivel: 'A2', tema: 'qa' },
    ] };
    expect(archivoSchema.safeParse(g).success).toBe(true);
  });
  it('rechaza termino con mayúsculas', () => {
    const g = { tipo: 'glosario', nivel: 'A2', tema: 'qa', entradas: [
      { termino: 'Bug', categoria: 'noun', traduccion_es: 'e', definicion_en: 'd', ejemplo_en: 'e', nivel: 'A2', tema: 'qa' },
    ] };
    expect(archivoSchema.safeParse(g).success).toBe(false);
  });
});
