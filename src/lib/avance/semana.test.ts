import { describe, it, expect } from 'vitest';
import { resumenSemana } from './semana';

const base = { hoy: '2026-10-07', actividad: [], repasos: [], consolidadasTotal: 0, leccionesSemana: 0, metaDiariaMin: 10 };
describe('resumenSemana', () => {
  it('7 días de lunes a domingo, futuros marcados', () => {
    const r = resumenSemana(base);
    expect(r.dias.map((d) => d.fecha)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(r.dias.map((d) => d.futuro)).toEqual([false, false, false, true, true, true, true]);
  });
  it('día activo con ≥ 60 s; minutos de la semana y de hoy', () => {
    const r = resumenSemana({ ...base, actividad: [{ fecha: '2026-10-05', segundos: 59 }, { fecha: '2026-10-06', segundos: 60 }, { fecha: '2026-10-07', segundos: 300 }] });
    expect(r.diasActivos).toBe(2);
    expect(r.minutosSemana).toBe(6); // 419 s → floor = 6 min
    expect(r.minutosHoy).toBe(5);
    expect(r.metaHoyPct).toBe(50);
  });
  it('aciertos en repasos maduros = % «La sabía» con caja anterior ≥ 3; null si no hay', () => {
    expect(resumenSemana(base).aciertosMadurosPct).toBeNull();
    const r = resumenSemana({ ...base, repasos: [{ correcta: true, caja: 3 }, { correcta: false, caja: 4 }, { correcta: true, caja: 1 }] });
    expect(r.aciertosMadurosPct).toBe(50);
  });
  it('consolidadas nuevas = aciertos con caja anterior 3 (pasan a 4)', () => {
    const r = resumenSemana({ ...base, consolidadasTotal: 7, repasos: [{ correcta: true, caja: 3 }, { correcta: true, caja: 3 }, { correcta: false, caja: 3 }] });
    expect([r.consolidadasTotal, r.consolidadasNuevas]).toEqual([7, 2]);
  });
  it('meta de días: 5 y gracia de 2', () => expect([resumenSemana(base).metaDias, resumenSemana(base).diasGracia]).toEqual([5, 2]));
  it('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(resumenSemana({ ...base, hoy: '2026-10-11' }).dias[0].fecha).toBe('2026-10-05');
  });
});
