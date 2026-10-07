import { describe, it, expect } from 'vitest';
import { segmentarLectura, terminosDeLectura } from './lectura';

describe('segmentarLectura', () => {
  it('separa texto y términos con alias', () => {
    expect(segmentarLectura('I [[tested|test]] the [[login]].')).toEqual([
      { tipo: 'texto', valor: 'I ' },
      { tipo: 'termino', visible: 'tested', base: 'test' },
      { tipo: 'texto', valor: ' the ' },
      { tipo: 'termino', visible: 'login', base: 'login' },
      { tipo: 'texto', valor: '.' },
    ]);
  });
  it('la base se normaliza a minúsculas', () => {
    expect(segmentarLectura('[[API]]')).toEqual([{ tipo: 'termino', visible: 'API', base: 'api' }]);
  });
  it('texto sin marcas', () => expect(segmentarLectura('Hola')).toEqual([{ tipo: 'texto', valor: 'Hola' }]));
});

describe('terminosDeLectura', () => {
  it('devuelve bases únicas', () => expect(terminosDeLectura('[[bug]] and [[bugs|bug]] [[fix]]')).toEqual(['bug', 'fix']));
});
