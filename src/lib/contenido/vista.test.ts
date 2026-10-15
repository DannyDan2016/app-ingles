import { describe, it, expect } from 'vitest';
import { aVista } from './vista';
import type { Ejercicio } from './esquema';

const ejercicios: Ejercicio[] = [
  { id: 'x-e1', tipo: 'opcion_multiple', enunciado: 'E', explicacion: 'SECRETO', opciones: ['a', 'b'], correcta: 1 },
  { id: 'x-e2', tipo: 'completar', enunciado: 'E', explicacion: 'SECRETO', texto: 'I ___ code.', respuesta: 'write', aceptadas: ['type'] },
  { id: 'x-e3', tipo: 'ordenar', enunciado: 'E', explicacion: 'SECRETO', piezas: ['We', 'ship', 'small', 'changes'] },
  { id: 'x-e4', tipo: 'emparejar', enunciado: 'E', explicacion: 'SECRETO', pares: [{ a: 'bug', b: 'error' }, { a: 'branch', b: 'rama' }, { a: 'merge', b: 'fusionar' }] },
  { id: 'x-e5', tipo: 'verdadero_falso', enunciado: 'E', explicacion: 'SECRETO', afirmacion: 'It works.', correcta: false },
];

describe('aVista', () => {
  it.each(ejercicios.map((e) => [e.tipo, e]))('%s no expone la solución ni la explicación', (_t, e) => {
    const json = JSON.stringify(aVista(e));
    expect(json).not.toMatch(/correcta|respuesta|aceptadas|pares|explicacion|SECRETO|"write"|"type"/);
  });

  it('ordenar y emparejar llegan barajados pero completos', () => {
    const o = aVista(ejercicios[2]);
    const m = aVista(ejercicios[3]);
    if (o.tipo !== 'ordenar' || m.tipo !== 'emparejar') throw new Error('tipo');
    expect(o.piezas).not.toEqual(['We', 'ship', 'small', 'changes']);
    expect([...o.piezas].sort()).toEqual(['We', 'changes', 'ship', 'small'].sort());
    expect(m.izquierda).toEqual(['bug', 'branch', 'merge']);
    expect([...m.derecha].sort()).toEqual(['error', 'fusionar', 'rama']);
  });
});
