export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'termino'; visible: string; base: string };
const MARCA = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function segmentarLectura(texto: string): Segmento[] {
  const out: Segmento[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(MARCA)) {
    if (m.index > ultimo) out.push({ tipo: 'texto', valor: texto.slice(ultimo, m.index) });
    const visible = m[1].trim();
    out.push({ tipo: 'termino', visible, base: (m[2] ?? m[1]).trim().toLowerCase() });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) out.push({ tipo: 'texto', valor: texto.slice(ultimo) });
  return out;
}

export function terminosDeLectura(texto: string): string[] {
  return [...new Set(segmentarLectura(texto).flatMap((s) => (s.tipo === 'termino' ? [s.base] : [])))];
}
