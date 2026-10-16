import { describe, it, expect } from 'vitest';
import { BLOQUES, type Pregunta } from '@/lib/contenido/esquema';
import { calcularNota } from './nota';
import { seleccionarPreguntas } from './seleccionar';
import { caducaEn, elegibilidad, ESPERA_MS } from './elegibilidad';
import { armarRefuerzo } from './refuerzo';
import { parsearRespuesta } from './respuesta';

/** Banco realista: lectura y listening con 2 recursos de 4 y 6 preguntas; vocabulario y gramática sueltas. */
function banco(): Pregunta[] {
  return BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => ({
    id: `a2-ev-${bloque}-${i}`, tipo: 'verdadero_falso' as const, enunciado: 'E', afirmacion: 'A', correcta: true, explicacion: 'X', bloque,
    recurso: bloque === 'lectura' || bloque === 'listening' ? `${bloque}-${i < 4 ? 'r1' : 'r2'}` : undefined,
  })));
}
function semilla(n: number) { let s = n; return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31); }

describe('calcularNota', () => {
  it('16 de 20 aprueba y marca el bloque flojo', () => {
    const ps = banco().filter((_, i) => i % 2 === 0); // 5 por bloque
    const fallos = new Set(['a2-ev-gramatica-0', 'a2-ev-gramatica-2', 'a2-ev-gramatica-4', 'a2-ev-gramatica-6']);
    const aciertos = new Set(ps.filter((p) => !fallos.has(p.id)).map((p) => p.id));
    const r = calcularNota(ps, aciertos);
    expect(r.nota).toBe(80);
    expect(r.aprobado).toBe(true);
    expect(r.aReforzar).toEqual(['gramatica']);
  });
});

describe('caducaEn', () => {
  it('caduca 48 h después de iniciar', () => {
    expect(caducaEn(new Date('2026-10-14T10:00:00Z')).toISOString()).toBe('2026-10-16T10:00:00.000Z');
  });
});

describe('seleccionarPreguntas', () => {
  it('elige 5 por bloque y al reintentar al menos 10 de 20 son distintas (200 semillas)', () => {
    const b = banco();
    for (let s = 1; s <= 200; s++) {
      const primero = seleccionarPreguntas(b, [], semilla(s));
      expect(primero).toHaveLength(20);
      for (const bl of BLOQUES) expect(primero.filter((id) => id.includes(`-${bl}-`))).toHaveLength(5);
      const segundo = seleccionarPreguntas(b, primero, semilla(s + 1000));
      expect(segundo.filter((id) => !primero.includes(id)).length).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('elegibilidad', () => {
  const base = { estadoNivel: 'en_curso' as const, hayBanco: true, lecciones: 8, hechas: 8, abierto: null, aprobado: null, ultimo: null, ahora: new Date('2026-10-14T12:00:00Z') };
  it('con todas las lecciones hechas puede presentar', () => expect(elegibilidad(base).tipo).toBe('puede'));
  it('con lecciones pendientes dice cuántas faltan', () => expect(elegibilidad({ ...base, hechas: 5 })).toEqual({ tipo: 'faltan_lecciones', faltan: 3 }));
  it('tras suspender exige refuerzo y luego 24 h', () => {
    const terminadoAt = new Date(base.ahora.getTime() - 60_000);
    const ultimo = { id: 'i1', estado: 'suspendido' as const, iniciadoAt: terminadoAt, terminadoAt, refuerzoCompletadoAt: null };
    expect(elegibilidad({ ...base, ultimo }).tipo).toBe('falta_refuerzo');
    const conRefuerzo = { ...ultimo, refuerzoCompletadoAt: base.ahora };
    expect(elegibilidad({ ...base, ultimo: conRefuerzo })).toEqual({ tipo: 'espera', hasta: new Date(terminadoAt.getTime() + ESPERA_MS) });
  });
});

describe('armarRefuerzo y respuestas', () => {
  it('arma hasta 12 ejercicios solo de los bloques flojos', () => {
    const fuente = Array.from({ length: 30 }, (_, i) => ({ origen: 'leccion' as const, ejercicio: { id: `l-e${i}`, tipo: 'completar' as const, enunciado: 'E', explicacion: 'X', texto: 'a ___ b', respuesta: 'x' } }));
    const r = armarRefuerzo(fuente, ['gramatica'], 'intento-1');
    expect(r).toHaveLength(12);
    expect(armarRefuerzo(fuente, ['vocabulario'], 'intento-1')).toHaveLength(0);
  });
  it('parsea una respuesta válida y rechaza basura', () => {
    expect(parsearRespuesta('{"tipo":"verdadero_falso","valor":true}')).toEqual({ tipo: 'verdadero_falso', valor: true });
    expect(parsearRespuesta('no json')).toBeNull();
  });
});
