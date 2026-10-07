import { describe, it, expect } from 'vitest';
import { corregir, normalizarRespuesta } from './corregir';
import type { Ejercicio } from '@/lib/contenido/esquema';

const base = { id: 'x-e1', enunciado: 'e', explicacion: 'x' };
describe('normalizarRespuesta', () => {
  it.each([['  I  Found ', 'i found'], ['don’t', "don't"], ['Tab\tand\nline', 'tab and line']])('%j → %j', (a, b) => expect(normalizarRespuesta(a)).toBe(b));
});
describe('corregir', () => {
  it('opcion_multiple', () => {
    const e: Ejercicio = { ...base, tipo: 'opcion_multiple', opciones: ['a', 'b'], correcta: 1 };
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 1 })).toBe(true);
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 0 })).toBe(false);
  });
  it('completar acepta respuesta y aceptadas tras normalizar', () => {
    const e: Ejercicio = { ...base, tipo: 'completar', texto: 'I ___ it', respuesta: 'found', aceptadas: ['have found'] };
    expect(corregir(e, { tipo: 'completar', texto: ' Found ' })).toBe(true);
    expect(corregir(e, { tipo: 'completar', texto: 'have  found' })).toBe(true);
    expect(corregir(e, { tipo: 'completar', texto: 'find' })).toBe(false);
    expect(corregir(e, { tipo: 'completar', texto: '' })).toBe(false);
  });
  it('ordenar', () => {
    const e: Ejercicio = { ...base, tipo: 'ordenar', piezas: ['They', 'merge', 'it'] };
    expect(corregir(e, { tipo: 'ordenar', orden: ['They', 'merge', 'it'] })).toBe(true);
    expect(corregir(e, { tipo: 'ordenar', orden: ['merge', 'They', 'it'] })).toBe(false);
    expect(corregir(e, { tipo: 'ordenar', orden: ['They', 'merge'] })).toBe(false);
  });
  it('emparejar exige todos los pares', () => {
    const e: Ejercicio = { ...base, tipo: 'emparejar', pares: [{ a: 'x', b: '1' }, { a: 'y', b: '2' }, { a: 'z', b: '3' }] };
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '2', z: '3' } })).toBe(true);
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '3', z: '2' } })).toBe(false);
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '2' } })).toBe(false);
  });
  it('verdadero_falso', () => {
    const e: Ejercicio = { ...base, tipo: 'verdadero_falso', afirmacion: 'a', correcta: false };
    expect(corregir(e, { tipo: 'verdadero_falso', valor: false })).toBe(true);
  });
  it('respuesta de otro tipo es incorrecta', () => {
    const e: Ejercicio = { ...base, tipo: 'verdadero_falso', afirmacion: 'a', correcta: true };
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 0 })).toBe(false);
  });
});
