import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { validarCatalogo } from './reglas';

describe('content/_demo (lección golden)', () => {
  const dir = join(process.cwd(), 'content', '_demo');
  const archivos = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ ruta: `content/_demo/${f}`, demo: true, datos: parse(readFileSync(join(dir, f), 'utf8')) }));
  const r = validarCatalogo(archivos, { estricto: true });
  it('es válida incluso en modo estricto', () => expect(r.errores).toEqual([]));
  it('cubre los 5 tipos de ejercicio', () => {
    expect(new Set(r.catalogo.lecciones[0].ejercicios.map((e) => e.tipo)).size).toBe(5);
  });
  it('tiene un tramo', () => expect(r.catalogo.tramos.map((t) => t.id)).toEqual(['demo-t1']));
});
