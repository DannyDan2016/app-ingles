import { describe, it, expect } from 'vitest';
import { estadoCamino, type ItemCamino } from './camino';

const it_ = (id: string, orden: number, tipo: 'leccion' | 'tramo' = 'leccion'): ItemCamino =>
  ({ id, tipo, titulo: id, orden, tema: 'qa', nivel: 'A2' });
const items = [it_('l1', 1), it_('l2', 2), it_('t1', 3, 'tramo'), it_('l3', 4)];

describe('estadoCamino', () => {
  it('sin progreso: la primera lección es actual, el resto bloqueadas, los tramos disponibles', () => {
    const r = estadoCamino(items, new Set());
    expect(r.items.map((i) => i.estado)).toEqual(['actual', 'bloqueado', 'disponible', 'bloqueado']);
    expect(r.siguiente?.id).toBe('l1');
    expect(r.porcentaje).toBe(0);
  });
  it('lineal: completar l1 desbloquea l2; el tramo cuenta para el porcentaje', () => {
    const r = estadoCamino(items, new Set(['l1', 't1']));
    expect(r.items.map((i) => i.estado)).toEqual(['hecho', 'actual', 'hecho', 'bloqueado']);
    expect(r.porcentaje).toBe(50);
  });
  it('todo hecho: siguiente es null y 100 %', () => {
    const r = estadoCamino(items, new Set(['l1', 'l2', 't1', 'l3']));
    expect(r.siguiente).toBeNull();
    expect(r.porcentaje).toBe(100);
  });
  it('nivel sin contenido: vacío, 0 % y sin siguiente', () => {
    expect(estadoCamino([], new Set())).toEqual({ items: [], porcentaje: 0, siguiente: null });
  });
});
