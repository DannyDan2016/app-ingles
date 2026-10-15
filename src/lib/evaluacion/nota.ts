import { BLOQUES, type Bloque } from '@/lib/contenido/esquema';

export const UMBRAL = 80;
export type ResultadoNota = { nota: number; bloques: Record<Bloque, number>; aprobado: boolean; aReforzar: Bloque[] };

export function calcularNota(preguntas: readonly { id: string; bloque: Bloque }[], aciertos: ReadonlySet<string>): ResultadoNota {
  const pct = (ps: readonly { id: string }[]) => (ps.length ? Math.round((ps.filter((p) => aciertos.has(p.id)).length * 100) / ps.length) : 0);
  const bloques = Object.fromEntries(BLOQUES.map((b) => [b, pct(preguntas.filter((p) => p.bloque === b))])) as Record<Bloque, number>;
  const nota = pct(preguntas);
  return { nota, bloques, aprobado: nota >= UMBRAL, aReforzar: BLOQUES.filter((b) => bloques[b] < UMBRAL) };
}
