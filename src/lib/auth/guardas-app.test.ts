import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Regla (docs/seguridad.md): el layout de (app) NO protege nada. Toda page.tsx y toda server action exportada
 * de src/app/(app) debe llamar a requireUser() o requireAdmin() ella misma.
 */
const RAIZ = join(process.cwd(), 'src', 'app', '(app)');
const GUARDA = /\brequire(User|Admin)\(/;

/** Excepciones explícitas. salir/actions.ts: cerrar sesión debe funcionar aunque la sesión ya no sea válida
 *  (borra la cookie y redirige a /login); exigir requireUser() aquí impediría limpiar una cookie caducada. */
const EXCEPCIONES = new Set(['salir/actions.ts']);

function archivos(dir: string, nombre: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return archivos(ruta, nombre);
    return nombre.test(e.name) ? [ruta] : [];
  });
}
const rel = (f: string) => relative(RAIZ, f).split(sep).join('/');
const leer = (f: string) => readFileSync(f, 'utf8');

/** Cuerpo de cada `export async function` (hasta el siguiente `export` a nivel de módulo o el final). */
export function accionesExportadas(src: string): Array<{ nombre: string; cuerpo: string }> {
  const partes = src.split(/^(?=export )/m);
  return partes.flatMap((p) => {
    const m = p.match(/^export async function (\w+)/);
    return m ? [{ nombre: m[1], cuerpo: p }] : [];
  });
}

describe('guardas de auth en (app)', () => {
  const pages = archivos(RAIZ, /^page\.tsx$/);
  const actions = archivos(RAIZ, /^actions\.ts$/);

  it('encuentra páginas y acciones (el test no puede quedarse vacío)', () => {
    expect(pages.length).toBeGreaterThanOrEqual(4);
    expect(actions.length).toBeGreaterThanOrEqual(3);
  });

  it.each(pages.map((f) => [rel(f), f]))('page %s llama a requireUser/requireAdmin', (_n, f) => {
    expect(leer(f)).toMatch(GUARDA);
  });

  describe.each(actions.filter((f) => !EXCEPCIONES.has(rel(f))).map((f) => [rel(f), f]))('acciones de %s', (_n, f) => {
    const src = leer(f);
    it('solo exporta funciones async (o tipos), para poder auditarlas', () => {
      const raros = src.match(/^export (?!async function|type |interface )\w+.*/gm) ?? [];
      expect(raros).toEqual([]);
    });
    const acc = accionesExportadas(src);
    it('exporta al menos una acción', () => expect(acc.length).toBeGreaterThan(0));
    it.each(acc.map((a) => [a.nombre, a.cuerpo]))('%s llama a requireUser/requireAdmin', (_a, cuerpo) => {
      expect(cuerpo).toMatch(GUARDA);
    });
  });

  it('la única excepción es salir/actions.ts y existe', () => {
    expect([...EXCEPCIONES]).toEqual(['salir/actions.ts']);
    expect(actions.map(rel)).toContain('salir/actions.ts');
  });
});
