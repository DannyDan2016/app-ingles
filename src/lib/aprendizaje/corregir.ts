import type { Ejercicio } from '@/lib/contenido/esquema';

export type RespuestaUsuario =
  | { tipo: 'opcion_multiple'; indice: number }
  | { tipo: 'completar'; texto: string }
  | { tipo: 'ordenar'; orden: string[] }
  | { tipo: 'emparejar'; asignacion: Record<string, string> }
  | { tipo: 'verdadero_falso'; valor: boolean };

export const normalizarRespuesta = (s: string) => s.normalize('NFC').replace(/[’‘]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase();

export function corregir(e: Ejercicio, r: RespuestaUsuario): boolean {
  if (e.tipo !== r.tipo) return false;
  switch (e.tipo) {
    case 'opcion_multiple': return (r as { indice: number }).indice === e.correcta;
    case 'completar': {
      const t = normalizarRespuesta((r as { texto: string }).texto);
      return t.length > 0 && [e.respuesta, ...(e.aceptadas ?? [])].some((ok) => normalizarRespuesta(ok) === t);
    }
    case 'ordenar': {
      const o = (r as { orden: string[] }).orden;
      return o.length === e.piezas.length && o.every((p, i) => p === e.piezas[i]);
    }
    case 'emparejar': {
      const a = (r as { asignacion: Record<string, string> }).asignacion;
      return e.pares.every((p) => a[p.a] === p.b);
    }
    case 'verdadero_falso': return (r as { valor: boolean }).valor === e.correcta;
  }
}
