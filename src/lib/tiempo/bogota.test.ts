import { describe, it, expect } from 'vitest';
import { diaBogota, inicioDia, finDia, sumarDias, lunesDe } from './bogota';

describe('tiempo en America/Bogota', () => {
  it('23:30 de Bogotá (04:30Z del día siguiente) es aún el mismo día', () => {
    expect(diaBogota(new Date('2026-10-08T04:30:00Z'))).toBe('2026-10-07');
  });
  it('00:10 de Bogotá ya es el día nuevo', () => expect(diaBogota(new Date('2026-10-08T05:10:00Z'))).toBe('2026-10-08'));
  it('inicio y fin del día', () => {
    expect(inicioDia('2026-10-07').toISOString()).toBe('2026-10-07T05:00:00.000Z');
    expect(finDia('2026-10-07').toISOString()).toBe('2026-10-08T04:59:59.999Z');
  });
  it('sumarDias cruza meses', () => expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02'));
  it('lunesDe: el lunes es inicio de semana y el domingo pertenece a la semana anterior', () => {
    expect(lunesDe('2026-10-05')).toBe('2026-10-05'); // lunes
    expect(lunesDe('2026-10-07')).toBe('2026-10-05'); // miércoles
    expect(lunesDe('2026-10-11')).toBe('2026-10-05'); // domingo
  });
});
