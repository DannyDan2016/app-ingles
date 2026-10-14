import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cargarArchivos } from './cargar';

describe('cargarArchivos', () => {
  it('un YAML mal formado no aborta la carga: devuelve el error con la ruta del archivo', () => {
    const raiz = mkdtempSync(join(tmpdir(), 'contenido-'));
    try {
      mkdirSync(join(raiz, 'content', 'a2'), { recursive: true });
      writeFileSync(join(raiz, 'content', 'a2', 'ok.yaml'), 'tipo: glosario\n');
      writeFileSync(join(raiz, 'content', 'a2', 'roto.yaml'), 'a: [1, 2\nb: : :\n');
      const r = cargarArchivos({ incluirDemo: false, raiz });
      const roto = r.find((a) => a.ruta === 'content/a2/roto.yaml');
      expect(roto?.errorLectura).toBeTruthy();
      expect(r.find((a) => a.ruta === 'content/a2/ok.yaml')?.errorLectura).toBeUndefined();
    } finally { rmSync(raiz, { recursive: true, force: true }); }
  });
});
