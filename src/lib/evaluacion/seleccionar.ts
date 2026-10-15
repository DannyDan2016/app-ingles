import { BLOQUES, type Pregunta } from '@/lib/contenido/esquema';

export const POR_BLOQUE = 5;
export const aleatorio = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

function mezclar<T>(xs: T[], rnd: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/**
 * 5 preguntas por bloque. Las que comparten recurso (lectura/video) salen juntas. Primero los grupos y las
 * preguntas que no salieron en el intento anterior, así un reintento repite lo mínimo posible.
 */
export function seleccionarPreguntas(banco: readonly Pregunta[], anterior: readonly string[], rnd: () => number = aleatorio): string[] {
  const usadas = new Set(anterior);
  const usado = (g: Pregunta[]) => g.filter((p) => usadas.has(p.id)).length / g.length;
  const out: string[] = [];
  for (const b of BLOQUES) {
    const grupos = new Map<string, Pregunta[]>();
    for (const p of banco) if (p.bloque === b) grupos.set(p.recurso ?? p.id, [...(grupos.get(p.recurso ?? p.id) ?? []), p]);
    const lista = mezclar([...grupos.values()], rnd)
      .map((g) => [...g].sort((x, y) => Number(usadas.has(x.id)) - Number(usadas.has(y.id))))
      .sort((g1, g2) => usado(g1) - usado(g2));
    let n = 0;
    for (const g of lista) {
      if (n >= POR_BLOQUE) break;
      const toma = g.slice(0, POR_BLOQUE - n);
      out.push(...toma.map((p) => p.id));
      n += toma.length;
    }
  }
  return out;
}
