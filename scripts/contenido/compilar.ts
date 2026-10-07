import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validarCatalogo } from '../../src/lib/contenido/reglas';
import { opcionesCompilacion } from '../../src/lib/contenido/opciones';
import { cargarArchivos } from './cargar';

const RAIZ = process.cwd();
const opts = opcionesCompilacion(process.env);
const archivos = cargarArchivos({ incluirDemo: opts.incluirDemo });

const { errores, avisos, catalogo } = validarCatalogo(archivos, { estricto: opts.estricto });
for (const a of avisos) console.warn(`aviso: ${a}`);
if (errores.length) {
  for (const e of errores) console.error(`error: ${e}`);
  console.error(`\n${errores.length} error(es) de contenido. El build se detiene.`);
  process.exit(1);
}
const salida = join(RAIZ, 'src', 'content', 'generado');
if (!existsSync(salida)) mkdirSync(salida, { recursive: true });
writeFileSync(join(salida, 'catalogo.ts'),
  `// GENERADO por scripts/contenido/compilar.ts. No editar.\nimport 'server-only';\nimport type { Catalogo } from '@/lib/contenido/esquema';\n\nexport const catalogo: Catalogo = ${JSON.stringify(catalogo, null, 2)};\n`);
console.log(`contenido: ${catalogo.lecciones.length} lecciones, ${catalogo.tramos.length} tramos, ${catalogo.glosario.length} entradas${opts.incluirDemo ? ' (con demo)' : ''}${opts.estricto ? ' [estricto]' : ''}`);
