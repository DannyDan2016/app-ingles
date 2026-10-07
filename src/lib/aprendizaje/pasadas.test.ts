import { describe, expect, it } from 'vitest';
import { PASADAS, siguientePaso } from './pasadas';

describe('pasadas', () => {
  it('encadena los pasos hasta hecho', () => {
    expect(siguientePaso('pasada-1')).toBe('pasada-2');
    expect(siguientePaso('pasada-2')).toBe('pasada-3');
    expect(siguientePaso('pasada-3')).toBe('preguntas');
    expect(siguientePaso('preguntas')).toBe('hecho');
    expect(siguientePaso('hecho')).toBe('hecho');
  });
  it('la pasada 2 va a 0,75x con ayuda', () => {
    expect(PASADAS).toHaveLength(3);
    expect(PASADAS[1]).toMatchObject({ n: 2, velocidad: 0.75, ayuda: true });
    expect(PASADAS[0].velocidad).toBe(1);
    expect(PASADAS[2].ayuda).toBe(false);
  });
});
