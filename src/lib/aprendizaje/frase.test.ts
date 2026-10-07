import { describe, it, expect } from 'vitest';
import { formasAceptadas, evaluarFrase } from './frase';

describe('formasAceptadas', () => {
  it('flexiona un verbo regular', () => {
    expect(formasAceptadas('test', [])).toEqual(expect.arrayContaining(['test', 'tests', 'tested', 'testing']));
  });
  it('incluye las formas visibles de la lectura', () => {
    expect(formasAceptadas('find', ['found'])).toContain('found');
  });
  it('no infiere irregulares', () => {
    const f = formasAceptadas('write', []);
    expect(f).toEqual(expect.arrayContaining(['writes', 'writing']));
    expect(f).not.toContain('wrote');
  });
  it('trata consonante+y', () => {
    expect(formasAceptadas('query', [])).toEqual(expect.arrayContaining(['queries', 'queried']));
  });
  it('multipalabra: base y plural, sin duplicados', () => {
    const f = formasAceptadas('Test Case', ['test case']);
    expect(f).toEqual(['test case', 'test cases']);
  });
});

describe('evaluarFrase', () => {
  it('acepta forma irregular visible', () => {
    expect(evaluarFrase('I found a bug yesterday.', formasAceptadas('find', ['found']))).toEqual({ usaPalabra: true, palabras: 5, valida: true });
  });
  it('frase corta no es válida', () => {
    expect(evaluarFrase('Bug!', formasAceptadas('bug', []))).toEqual({ usaPalabra: true, palabras: 1, valida: false });
  });
  it('no cuenta subcadenas', () => {
    expect(evaluarFrase('The debugger is open now', formasAceptadas('bug', [])).usaPalabra).toBe(false);
  });
  it('término de varias palabras', () => {
    expect(evaluarFrase('We wrote a test case today', formasAceptadas('test case', [])).usaPalabra).toBe(true);
  });
  it('apóstrofo tipográfico', () => {
    const r = evaluarFrase('I don’t like this API', formasAceptadas('api', []));
    expect(r.usaPalabra).toBe(true);
    expect(r.palabras).toBe(5);
  });
  it('mayúsculas y puntuación', () => {
    expect(evaluarFrase('My PASSWORD, please.', formasAceptadas('password', [])).usaPalabra).toBe(true);
  });
});
