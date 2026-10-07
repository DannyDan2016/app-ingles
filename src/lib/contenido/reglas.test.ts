import { describe, it, expect } from 'vitest';
import { validarCatalogo, type ArchivoCargado } from './reglas';

const glos = (terminos: string[], tema = 'qa'): ArchivoCargado => ({
  ruta: `content/a2/glosario-${tema}.yaml`, demo: false,
  datos: { tipo: 'glosario', nivel: 'A2', tema, entradas: terminos.map((t) => ({
    termino: t, categoria: 'noun', traduccion_es: 't', definicion_en: 'd', ejemplo_en: 'e', nivel: 'A2', tema })) },
});
const vf = (id: string) => ({ id, tipo: 'verdadero_falso', enunciado: 'e', explicacion: 'x', afirmacion: 'a', correcta: true });
const lec = (over: Record<string, unknown> = {}): ArchivoCargado => ({
  ruta: 'content/a2/a2-qa-01.yaml', demo: false,
  datos: { tipo: 'leccion', id: 'a2-qa-01', nivel: 'A2', tema: 'qa', orden: 4, titulo: 't', objetivo: 'o', gramatica: 'g',
    lectura: 'A [[bug]].', terminos: ['bug'], ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`)), revisado: true, ...over },
});
const tramo = (over: Record<string, unknown> = {}): ArchivoCargado => ({
  ruta: 'content/a2/a2-qa-t1.yaml', demo: false,
  datos: { tipo: 'tramo', id: 'a2-qa-t1', nivel: 'A2', tema: 'qa', orden: 6,
    fuente: { podcast: 'p', youtubeId: 'Ecu_7juyU0Q', start: 20, end: 80, titulo: 't', canal: 'c' },
    preguntaGuia: 'q', palabrasClave: ['bug'], preguntas: [1, 2, 3].map((n) => vf(`a2-qa-t1-e${n}`)), revisado: true, ...over },
});
const run = (a: ArchivoCargado[], estricto = false) => validarCatalogo(a, { estricto });

describe('validarCatalogo', () => {
  it('catálogo válido sin errores', () => {
    const r = run([glos(['bug']), lec(), tramo()]);
    expect(r.errores).toEqual([]);
    expect(r.catalogo.lecciones).toHaveLength(1);
    expect(r.catalogo.tramos).toHaveLength(1);
  });
  it('error de esquema con archivo y ruta del campo', () => {
    const r = run([glos(['bug']), lec({ titulo: '' })]);
    expect(r.errores[0]).toMatch(/content\/a2\/a2-qa-01\.yaml: titulo/);
  });
  it('ids duplicados', () => {
    const r = run([glos(['bug']), lec(), { ...lec(), ruta: 'otro.yaml' }]);
    expect(r.errores.join('\n')).toMatch(/id duplicado: a2-qa-01/);
  });
  it('orden duplicado en el nivel', () => {
    expect(run([glos(['bug']), lec(), tramo({ orden: 4 })]).errores.join('\n')).toMatch(/orden 4 repetido en A2/);
  });
  it('término de la lectura sin entrada en el glosario de su tema', () => {
    expect(run([glos(['bug']), lec({ lectura: 'A [[fix]].' })]).errores.join('\n')).toMatch(/«fix» no está en el glosario A2\/qa/);
  });
  it('término del glosario de OTRO tema no vale', () => {
    expect(run([glos(['fix'], 'ia'), glos(['bug']), lec({ lectura: 'A [[fix]].' })]).errores.join('\n')).toMatch(/«fix»/);
  });
  it('mismo término en dos temas está permitido; repetido en el mismo tema no', () => {
    expect(run([glos(['bug'], 'ia'), glos(['bug']), lec()]).errores).toEqual([]);
    expect(run([glos(['bug', 'bug']), lec()]).errores.join('\n')).toMatch(/término repetido: bug \(A2\/qa\)/);
  });
  it('opcion_multiple con correcta fuera de rango', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'opcion_multiple', enunciado: 'e', explicacion: 'x', opciones: ['a', 'b'], correcta: 2 };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: correcta fuera de rango/);
  });
  it('completar exige un único ___', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'completar', enunciado: 'e', explicacion: 'x', texto: 'I ___ it ___', respuesta: 'found' };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: el texto debe tener exactamente un ___/);
  });
  it('emparejar con lados repetidos', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'emparejar', enunciado: 'e', explicacion: 'x', pares: [{ a: 'x', b: '1' }, { a: 'x', b: '2' }, { a: 'z', b: '3' }] };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: los lados de emparejar deben ser únicos/);
  });
  it('ejercicio cuyo id no empieza por el de su padre', () => {
    const r = run([glos(['bug']), lec({ ejercicios: [vf('otro-e1'), ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/otro-e1: el id debe empezar por a2-qa-01-/);
  });
  it('id de lección debe empezar por el nivel (salvo demo)', () => {
    expect(run([glos(['bug']), lec({ id: 'qa-01', ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`qa-01-e${n}`)) })]).errores.join('\n'))
      .toMatch(/qa-01: el id debe empezar por a2-/);
  });
  it('tramo: start < end y entre 30 y 120 s', () => {
    expect(run([glos(['bug']), tramo({ fuente: { podcast: 'p', youtubeId: 'Ecu_7juyU0Q', start: 20, end: 40, titulo: 't', canal: 'c' } })]).errores.join('\n'))
      .toMatch(/a2-qa-t1: el tramo debe durar entre 30 y 120 s/);
  });
  it('video de lección con start >= end', () => {
    const r = run([glos(['bug']), lec({ video: { youtubeId: 'Ecu_7juyU0Q', start: 50, end: 50, titulo: 't', canal: 'c' } })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01: video con start >= end/);
  });
  it('revisado: false es aviso en ramas y error en estricto; la demo está exenta', () => {
    const noRev = [glos(['bug']), lec({ revisado: false })];
    expect(run(noRev).errores).toEqual([]);
    expect(run(noRev).avisos.join('\n')).toMatch(/a2-qa-01: revisado: false/);
    expect(run(noRev, true).errores.join('\n')).toMatch(/a2-qa-01: revisado: false/);
    expect(run([glos(['bug']), { ...lec({ revisado: false }), demo: true }], true).errores).toEqual([]);
  });
  it('terminos[] de ejercicios y palabrasClave también se comprueban', () => {
    expect(run([glos(['bug']), tramo({ palabrasClave: ['nada'] })]).errores.join('\n')).toMatch(/«nada»/);
    const ej = { ...vf('a2-qa-01-e1'), terminos: ['zzz'] };
    expect(run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]).errores.join('\n')).toMatch(/«zzz»/);
  });
});
