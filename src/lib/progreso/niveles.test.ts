import { describe, it, expect } from 'vitest';
import { estadoNiveles, isNivel, NIVELES } from './niveles';
import { nivelEnum } from '@/lib/db/schema';

const estados = (r: ReturnType<typeof estadoNiveles>) => r.map((x) => `${x.nivel}:${x.estado}`);

describe('estadoNiveles', () => {
  it('inicio en A2 sin aprobados: A1 omitido, A2 en curso, resto bloqueado', () => {
    expect(estados(estadoNiveles({ nivelInicial: 'A2', aprobados: [] }))).toEqual([
      'A1:omitido', 'A2:en_curso', 'B1:bloqueado', 'B2:bloqueado', 'C1:bloqueado', 'C2:bloqueado',
    ]);
  });
  it('inicio en A1 con A1 aprobado: A2 en curso', () => {
    expect(estados(estadoNiveles({ nivelInicial: 'A1', aprobados: ['A1'] })).slice(0, 3)).toEqual([
      'A1:aprobado', 'A2:en_curso', 'B1:bloqueado',
    ]);
  });
  it('todo aprobado: ninguno en curso', () => {
    const r = estadoNiveles({ nivelInicial: 'A1', aprobados: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] });
    expect(r.every((x) => x.estado === 'aprobado')).toBe(true);
  });
  it('isNivel valida entradas externas', () => {
    expect(isNivel('B1')).toBe(true);
    expect(isNivel('b1')).toBe(false);
    expect(isNivel('Z9')).toBe(false);
  });
});

describe('nivelEnum consistency', () => {
  it('nivelEnum.enumValues debe coincidir con NIVELES', () => {
    expect(nivelEnum.enumValues).toEqual(NIVELES);
  });
});
