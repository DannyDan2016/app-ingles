import { describe, it, expect } from 'vitest';
import { indicesDeOrden } from './restaurar';

describe('indicesDeOrden', () => {
  it('mapea el orden guardado a índices de la lista barajada actual', () => {
    expect(indicesDeOrden(['is', 'She', 'happy'], ['She', 'is', 'happy'])).toEqual([1, 0, 2]);
  });
  it('soporta piezas repetidas sin reutilizar índices', () => {
    expect(indicesDeOrden(['a', 'b', 'a'], ['a', 'a', 'b'])).toEqual([0, 2, 1]);
  });
  it('descarta lo que ya no existe en las piezas', () => {
    expect(indicesDeOrden(['a', 'b'], ['a', 'zzz'])).toEqual([0]);
  });
});
