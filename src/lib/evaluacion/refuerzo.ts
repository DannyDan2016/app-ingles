import type { Bloque, Ejercicio } from '@/lib/contenido/esquema';
import { barajar } from '@/lib/aprendizaje/barajar';

export const TAMANO_REFUERZO = 12;

/** Bloque de un ejercicio de práctica: el explícito o la regla por defecto del spec (§5.3). */
export function bloqueDe(e: Ejercicio, origen: 'leccion' | 'tramo'): Bloque {
  if (e.bloque) return e.bloque;
  if (origen === 'tramo') return 'listening';
  if (e.terminos?.length) return 'vocabulario';
  if (e.tipo === 'completar' || e.tipo === 'ordenar') return 'gramatica';
  return 'lectura';
}

export function armarRefuerzo(fuente: readonly { ejercicio: Ejercicio; origen: 'leccion' | 'tramo' }[], bloques: readonly Bloque[], semilla: string): Ejercicio[] {
  const flojos = new Set(bloques);
  const candidatos = fuente.filter((f) => flojos.has(bloqueDe(f.ejercicio, f.origen))).map((f) => f.ejercicio);
  return barajar(candidatos, semilla).slice(0, TAMANO_REFUERZO);
}
