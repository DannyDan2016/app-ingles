import { describe, it, expect } from 'vitest';
import { formasAceptadas, evaluarFrase, ejemplosDeFormas } from './frase';

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
    expect(formasAceptadas('query', [])).toEqual(expect.arrayContaining(['queries', 'queried', 'querying']));
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

describe('ortografía de las formas (R20)', () => {
  it('bug: plural sin formas inexistentes', () => {
    const f = formasAceptadas('bug', []);
    expect(f).toContain('bugs');
    expect(f).not.toContain('bugses');
  });
  it('find: regulares y visible irregular, sin findes', () => {
    const f = formasAceptadas('find', ['found']);
    expect(f).toEqual(expect.arrayContaining(['finds', 'finding', 'found']));
    expect(f).not.toContain('findes');
  });
  it('write: sin writeed ni writees', () => {
    const f = formasAceptadas('write', []);
    expect(f).toEqual(expect.arrayContaining(['writes', 'writing']));
    expect(f).not.toContain('writeed');
    expect(f).not.toContain('writees');
    expect(f).not.toContain('wrote');
  });
  it('fix: es / ed / ing', () => {
    expect(formasAceptadas('fix', [])).toEqual(expect.arrayContaining(['fixes', 'fixed', 'fixing']));
  });
  it('see/die: reglas de -e', () => {
    expect(formasAceptadas('see', [])).toContain('seeing');
    expect(formasAceptadas('die', [])).toContain('dying');
  });
  it('test case plural', () => {
    expect(formasAceptadas('test case', [])).toContain('test cases');
  });
});

describe('ejemplosDeFormas', () => {
  it('visibles primero, luego -s e -ing, nunca la base', () => {
    expect(ejemplosDeFormas('find', ['found'])).toEqual(['found', 'finds', 'finding']);
    expect(ejemplosDeFormas('test', ['test'])).toEqual(['tests', 'testing']);
  });
});

describe('evaluarFrase: casos límite', () => {
  it('escapa caracteres de regex', () => {
    expect(evaluarFrase('We love c++ a lot', formasAceptadas('c++', [])).usaPalabra).toBe(true);
    expect(evaluarFrase('We use node.js daily now', formasAceptadas('node.js', [])).usaPalabra).toBe(true);
    expect(evaluarFrase('We use nodexjs daily now', formasAceptadas('node.js', [])).usaPalabra).toBe(false);
  });
  it("posesivo user's cuenta", () => {
    expect(evaluarFrase("The user's name is here", formasAceptadas('user', [])).usaPalabra).toBe(true);
  });
  it('bug-free cuenta', () => {
    expect(evaluarFrase('This code is bug-free now', formasAceptadas('bug', [])).usaPalabra).toBe(true);
  });
});
