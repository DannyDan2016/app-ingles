function normalizar(s: string): string {
  return s.normalize('NFC').replace(/[’‘]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Formas aceptadas de un término: la base, las formas visibles que aparecen en la lectura con ese término
 *  ([[found|find]] → 'found') y flexiones regulares simples. Todo en minúsculas. */
export function formasAceptadas(base: string, visiblesEnLectura: string[]): string[] {
  const b = normalizar(base);
  const formas: string[] = [b, ...generadas(b), ...visiblesEnLectura.map(normalizar)];
  return [...new Set(formas.filter(Boolean))];
}

/** Flexiones regulares reales: [tercera persona/plural, -ing, pasado] (solo plural para varias palabras). */
function generadas(b: string): string[] {
  if (b.includes(' ')) return [`${b}s`];
  const consY = /[^aeiou]y$/.test(b);
  const plural = /(s|x|z|ch|sh)$/.test(b) || /[^aeiou]o$/.test(b) ? `${b}es` : consY ? `${b.slice(0, -1)}ies` : `${b}s`;
  const ing = b.endsWith('ie') ? `${b.slice(0, -2)}ying` : b.endsWith('e') && !/(ee|ye|oe)$/.test(b) ? `${b.slice(0, -1)}ing` : `${b}ing`;
  const pasado = b.endsWith('e') ? `${b}d` : consY ? `${b.slice(0, -1)}ied` : `${b}ed`;
  return [plural, ing, pasado];
}

/** Ejemplos para el mensaje de ayuda: primero las formas visibles de la lectura, luego como mucho 2 generadas (-s y -ing). */
export function ejemplosDeFormas(base: string, visiblesEnLectura: string[]): string[] {
  const b = normalizar(base);
  const vis = visiblesEnLectura.map(normalizar);
  return [...new Set([...vis, ...generadas(b).slice(0, 2)])].filter((f) => f && f !== b);
}

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Normaliza y evalúa: usa alguna forma como palabra completa (límites de palabra; para términos de varias
 *  palabras como «test case», como secuencia), cuenta palabras (≥ 4). */
export function evaluarFrase(frase: string, formas: string[]): { usaPalabra: boolean; palabras: number; valida: boolean } {
  const f = normalizar(frase);
  const palabras = f.split(' ').filter((t) => /\p{L}/u.test(t)).length;
  const usaPalabra = formas.some((forma) => {
    const x = normalizar(forma);
    if (!x) return false;
    return new RegExp(`(?<![\\p{L}\\p{N}])${escapar(x).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`, 'u').test(f);
  });
  return { usaPalabra, palabras, valida: usaPalabra && palabras >= 4 };
}
