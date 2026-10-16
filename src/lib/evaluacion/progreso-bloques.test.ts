import { describe, it, expect } from 'vitest';
import { progresoPorBloque } from './progreso-bloques';

describe('progresoPorBloque', () => {
  it('cuenta guardadas y total por bloque en orden fijo', () => {
    const ps = [
      { id: 'g1', bloque: 'gramatica' as const }, { id: 'l1', bloque: 'lectura' as const },
      { id: 'l2', bloque: 'lectura' as const }, { id: 'v1', bloque: 'vocabulario' as const },
    ];
    expect(progresoPorBloque(ps, new Set(['l1', 'g1']))).toEqual([
      { bloque: 'lectura', guardadas: 1, total: 2 },
      { bloque: 'vocabulario', guardadas: 0, total: 1 },
      { bloque: 'gramatica', guardadas: 1, total: 1 },
    ]);
  });
});
