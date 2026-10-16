/** Índices (sobre las piezas barajadas de ahora) que reproducen un orden de piezas ya guardado. Soporta repetidas. */
export function indicesDeOrden(barajadas: readonly string[], orden: readonly string[]): number[] {
  const usados = new Set<number>();
  const out: number[] = [];
  for (const pieza of orden) {
    const k = barajadas.findIndex((b, i) => b === pieza && !usados.has(i));
    if (k !== -1) { usados.add(k); out.push(k); }
  }
  return out;
}
