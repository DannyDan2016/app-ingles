import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { ArchivoCargado } from '../../src/lib/contenido/reglas';

export function cargarArchivos({ incluirDemo }: { incluirDemo: boolean }): ArchivoCargado[] {
  const raiz = process.cwd();
  const dirs = readdirSync(join(raiz, 'content'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && (d.name !== '_demo' || incluirDemo))
    .map((d) => d.name);
  return dirs.flatMap((dir) =>
    readdirSync(join(raiz, 'content', dir)).filter((f) => f.endsWith('.yaml')).map((f) => {
      const ruta = `content/${dir}/${f}`;
      return { ruta, demo: dir === '_demo', datos: parse(readFileSync(join(raiz, ruta), 'utf8')) };
    }),
  );
}
