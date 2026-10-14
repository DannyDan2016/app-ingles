import { readFileSync } from 'node:fs';
import { comprobarEndpoint, urlDeArchivoEnv } from './neon-endpoint';

// Uso en CI (con tsx):
//   tsx scripts/comprobar-neon.ts var DATABASE_URL_UNPOOLED     -> lee la URL de esa variable de entorno
//   tsx scripts/comprobar-neon.ts archivo .vercel/.env.preview.local  -> lee DATABASE_URL de ese archivo
// El valor esperado viene de NEON_ENDPOINT_ESPERADO. Nunca imprime la URL ni el endpoint.
const [modo, origen] = process.argv.slice(2);
let url: string | undefined;
if (modo === 'var' && origen) url = process.env[origen];
else if (modo === 'archivo' && origen) {
  try { url = urlDeArchivoEnv(readFileSync(origen, 'utf8'), 'DATABASE_URL'); } catch { url = undefined; }
} else {
  console.error('Uso: comprobar-neon.ts var <NOMBRE_VARIABLE> | archivo <ruta>');
  process.exit(2);
}
if (!url) {
  console.error(`::error::No se encontró la URL de la base de datos (${modo} ${origen}).`);
  process.exit(1);
}
const r = comprobarEndpoint(url, process.env.NEON_ENDPOINT_ESPERADO);
if (!r.ok) {
  console.error(`::error::${r.motivo}`);
  process.exit(1);
}
console.log('Neon: el endpoint coincide con el esperado para este entorno.');
