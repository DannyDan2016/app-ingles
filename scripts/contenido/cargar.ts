import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { ArchivoCargado } from '../../src/lib/contenido/reglas';

export function cargarArchivos({ incluirDemo, raiz = process.cwd() }: { incluirDemo: boolean; raiz?: string }): ArchivoCargado[] {
  const dirs = readdirSync(join(raiz, 'content'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && (d.name !== '_demo' || incluirDemo))
    .map((d) => d.name);
  return dirs.flatMap((dir) =>
    readdirSync(join(raiz, 'content', dir)).filter((f) => f.endsWith('.yaml')).map((f): ArchivoCargado => {
      const ruta = `content/${dir}/${f}`;
      const demo = dir === '_demo';
      try {
        return { ruta, demo, datos: parse(readFileSync(join(raiz, ruta), 'utf8')) };
      } catch (e) {
        // El compilador reporta el archivo (en vez de abortar con un stack sin contexto).
        return { ruta, demo, datos: undefined, errorLectura: e instanceof Error ? e.message.split(/\r?\n/)[0] : String(e) };
      }
    }),
  );
}
