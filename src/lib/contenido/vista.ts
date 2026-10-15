import type { Ejercicio } from './esquema';
import { barajar } from '@/lib/aprendizaje/barajar';

type Base = { id: string; enunciado: string };
/** Lo único que ve el navegador de un ejercicio: sin solución ni explicación. */
export type EjercicioVista =
  | (Base & { tipo: 'opcion_multiple'; opciones: string[] })
  | (Base & { tipo: 'completar'; texto: string })
  | (Base & { tipo: 'ordenar'; piezas: string[] })
  | (Base & { tipo: 'emparejar'; izquierda: string[]; derecha: string[] })
  | (Base & { tipo: 'verdadero_falso'; afirmacion: string });

export function aVista(e: Ejercicio): EjercicioVista {
  const base = { id: e.id, enunciado: e.enunciado };
  switch (e.tipo) {
    case 'opcion_multiple': return { ...base, tipo: e.tipo, opciones: e.opciones };
    case 'completar': return { ...base, tipo: e.tipo, texto: e.texto };
    case 'ordenar': return { ...base, tipo: e.tipo, piezas: barajar(e.piezas, e.id) };
    case 'emparejar': return { ...base, tipo: e.tipo, izquierda: e.pares.map((p) => p.a), derecha: barajar(e.pares.map((p) => p.b), e.id) };
    case 'verdadero_falso': return { ...base, tipo: e.tipo, afirmacion: e.afirmacion };
  }
}
