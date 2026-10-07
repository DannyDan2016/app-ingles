import { describe, it, expect } from 'vitest';
import { siguienteEstado } from './leitner';

describe('siguienteEstado', () => {
  it.each([
    [1, true, 2, '2026-10-10'], [2, true, 3, '2026-10-14'], [3, true, 4, '2026-10-21'], [4, true, 5, '2026-11-06'], [5, true, 5, '2026-11-06'],
  ] as const)('caja %i + «La sabía» → caja %i', (caja, sabia, nueva, dia) => {
    expect(siguienteEstado(caja, sabia, '2026-10-07')).toEqual({ caja: nueva, proximaDia: dia });
  });
  it('«No la sabía» vuelve a caja 1 y mañana', () => expect(siguienteEstado(4, false, '2026-10-07')).toEqual({ caja: 1, proximaDia: '2026-10-08' }));
});
