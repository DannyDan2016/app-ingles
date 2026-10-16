import { BLOQUES, type Bloque } from '@/lib/contenido/esquema';

export type ProgresoBloque = { bloque: Bloque; guardadas: number; total: number };

/** Preguntas guardadas por bloque, en el orden fijo de BLOQUES (los bloques sin preguntas no aparecen). */
export function progresoPorBloque(preguntas: readonly { id: string; bloque: Bloque }[], guardadas: ReadonlySet<string>): ProgresoBloque[] {
  return BLOQUES
    .map((bloque) => {
      const delBloque = preguntas.filter((p) => p.bloque === bloque);
      return { bloque, guardadas: delBloque.filter((p) => guardadas.has(p.id)).length, total: delBloque.length };
    })
    .filter((b) => b.total > 0);
}
