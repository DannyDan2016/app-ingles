import type { Ejercicio } from '@/lib/contenido/esquema';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

const vf = (v: boolean) => (v ? 'Verdadero' : 'Falso');

export function textoRespuesta(e: Ejercicio, r: RespuestaUsuario | null): string {
  if (!r || r.tipo !== e.tipo) return 'Sin respuesta';
  switch (r.tipo) {
    case 'opcion_multiple': return e.tipo === 'opcion_multiple' ? (e.opciones[r.indice] ?? 'Sin respuesta') : 'Sin respuesta';
    case 'completar': return r.texto;
    case 'ordenar': return r.orden.join(' ');
    case 'emparejar': return Object.entries(r.asignacion).map(([a, b]) => `${a} → ${b}`).join(' · ');
    case 'verdadero_falso': return vf(r.valor);
  }
}

export function textoCorrecta(e: Ejercicio): string {
  switch (e.tipo) {
    case 'opcion_multiple': return e.opciones[e.correcta];
    case 'completar': return e.respuesta;
    case 'ordenar': return e.piezas.join(' ');
    case 'emparejar': return e.pares.map((p) => `${p.a} → ${p.b}`).join(' · ');
    case 'verdadero_falso': return vf(e.correcta);
  }
}
