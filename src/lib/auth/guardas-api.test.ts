import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Todo route handler (salvo /api/salud) comprueba la sesión dentro del handler: el proxy solo mira que exista la cookie. */
const RAIZ = join(process.cwd(), 'src', 'app', 'api');
const GUARDA = /\b(getCurrentUser|requireUser|requireAdmin)\(/;

function rutas(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return rutas(ruta);
    return e.name === 'route.ts' ? [ruta] : [];
  });
}
const rel = (f: string) => relative(RAIZ, f).split(sep).join('/');
const handlers = rutas(RAIZ).filter((f) => rel(f) !== 'salud/route.ts');

describe('guardas de auth en route handlers', () => {
  it('encuentra handlers (no puede quedarse vacío)', () => {
    expect(handlers.length).toBeGreaterThan(0);
    expect(handlers.map(rel)).toContain('actividad/route.ts');
  });
  it.each(handlers.map((f) => [rel(f), f]))('%s comprueba la sesión', (_n, f) => {
    expect(readFileSync(f, 'utf8')).toMatch(GUARDA);
  });
});
