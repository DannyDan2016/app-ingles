// Fisher-Yates con PRNG mulberry32 sembrado por hash de la semilla.
function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function barajar<T>(items: readonly T[], semilla: string): T[] {
  const out = [...items]; const rnd = mulberry32(hash(semilla));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  if (out.length >= 2 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}
