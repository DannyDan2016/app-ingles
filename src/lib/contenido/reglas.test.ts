import { describe, it, expect } from 'vitest';
import { validarCatalogo, type ArchivoCargado } from './reglas';
import { BLOQUES } from './esquema';

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

describe('coherencia con el nombre y la carpeta del archivo', () => {
  it('nivel distinto al de la carpeta', () => {
    const r = run([glos(['bug']), { ...lec({ nivel: 'B1', id: 'b1-qa-01', ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`b1-qa-01-e${n}`)) }), ruta: 'content/a2/b1-qa-01.yaml' }]);
    expect(r.errores.join('\n')).toMatch(/content\/a2\/b1-qa-01\.yaml: nivel B1 no coincide con la carpeta a2/);
  });
  it('tema distinto al del nombre del archivo', () => {
    const r = run([glos(['bug']), lec({ tema: 'ia' })]);
    expect(r.errores.join('\n')).toMatch(/content\/a2\/a2-qa-01\.yaml: tema ia no coincide con el nombre del archivo/);
  });
  it('id distinto al nombre del archivo', () => {
    const r = run([glos(['bug']), { ...lec(), ruta: 'content/a2/a2-qa-09.yaml' }]);
    expect(r.errores.join('\n')).toMatch(/content\/a2\/a2-qa-09\.yaml: el id a2-qa-01 no coincide con el nombre del archivo/);
  });
  it('glosario: nivel y tema deben coincidir con carpeta y nombre', () => {
    const g = glos(['bug']);
    const mal = { ...g, ruta: 'content/b1/glosario-ia.yaml' };
    const e = run([mal]).errores.join('\n');
    expect(e).toMatch(/content\/b1\/glosario-ia\.yaml: nivel A2 no coincide con la carpeta b1/);
    expect(e).toMatch(/content\/b1\/glosario-ia\.yaml: tema qa no coincide con el nombre del archivo/);
  });
  it('el contenido demo está exento', () => {
    const r = run([{ ...lec({ id: 'demo-01', ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`demo-01-e${n}`)) }), ruta: 'content/_demo/demo-01.yaml', demo: true }, glos(['bug'])]);
    expect(r.errores.join('\n')).not.toMatch(/no coincide/);
  });
});

describe('errores de lectura del archivo', () => {
  it('YAML mal formado indica el archivo', () => {
    const r = run([{ ruta: 'content/a2/roto.yaml', demo: false, datos: undefined, errorLectura: 'bad indentation at line 3' }]);
    expect(r.errores).toEqual(['content/a2/roto.yaml: YAML mal formado: bad indentation at line 3']);
  });
});

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

function bancoA2() {
  const recursos = [
    { tipo: 'lectura', id: 'a2-ev-l1', titulo: 'Read me', texto: 'A short text.' },
    { tipo: 'lectura', id: 'a2-ev-l2', titulo: 'Read me too', texto: 'Another short text.' },
    { tipo: 'video', id: 'a2-ev-v1', fuente: { youtubeId: 'AAAAAAAAAAA', start: 0, end: 60, titulo: 'V1', canal: 'C' } },
    { tipo: 'video', id: 'a2-ev-v2', fuente: { youtubeId: 'BBBBBBBBBBB', start: 0, end: 60, titulo: 'V2', canal: 'C' } },
  ];
  let n = 0;
  const preguntas = BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => {
    n += 1;
    const recurso = bloque === 'lectura' ? (i < 5 ? 'a2-ev-l1' : 'a2-ev-l2') : bloque === 'listening' ? (i < 5 ? 'a2-ev-v1' : 'a2-ev-v2') : undefined;
    return { id: `a2-ev-q${String(n).padStart(2, '0')}`, tipo: 'verdadero_falso', enunciado: '¿V o F?', afirmacion: 'It works.', correcta: true, explicacion: 'Porque sí.', bloque, ...(recurso ? { recurso } : {}) };
  }));
  return { tipo: 'evaluacion', nivel: 'A2', revisado: true, recursos, preguntas };
}

describe('banco de evaluación', () => {
  it('acepta un banco válido y lo publica en el catálogo', () => {
    const r = validarCatalogo([{ ruta: 'content/a2/evaluacion-a2.yaml', demo: false, datos: bancoA2() }], { estricto: true });
    expect(r.errores).toEqual([]);
    expect(r.catalogo.evaluaciones).toHaveLength(1);
    expect(r.catalogo.evaluaciones[0].preguntas).toHaveLength(40);
  });

  it('rechaza un banco con un bloque incompleto', () => {
    const b = bancoA2();
    b.preguntas = b.preguntas.filter((p) => p.id !== 'a2-ev-q40');
    const r = validarCatalogo([{ ruta: 'content/a2/evaluacion-a2.yaml', demo: false, datos: b }], { estricto: true });
    expect(r.errores.join('\n')).toMatch(/gramatica tiene 9 preguntas/);
  });
});
