function normalizar(s: string): string {
  return s.normalize('NFC').replace(/[’‘]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Formas aceptadas de un término: la base, las formas visibles que aparecen en la lectura con ese término
 *  ([[found|find]] → 'found') y flexiones regulares simples. Todo en minúsculas. */
export function formasAceptadas(base: string, visiblesEnLectura: string[]): string[] {
  const b = normalizar(base);
  const formas: string[] = [b];
  if (b.includes(' ')) {
    formas.push(`${b}s`);
  } else {
    formas.push(`${b}s`, `${b}es`, `${b}ed`, `${b}ing`);
    if (b.endsWith('e')) formas.push(`${b}d`, `${b.slice(0, -1)}ing`);
    if (/[^aeiou]y$/.test(b)) formas.push(`${b.slice(0, -1)}ies`, `${b.slice(0, -1)}ied`);
  }
  formas.push(...visiblesEnLectura.map(normalizar));
  return [...new Set(formas.filter(Boolean))];
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
