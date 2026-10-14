import { comprobarEndpoint } from './neon-endpoint';

// Uso en CI (con tsx): tsx scripts/comprobar-neon.ts var DATABASE_URL_UNPOOLED -> lee la URL de esa variable de entorno.
// El valor esperado viene de NEON_ENDPOINT_ESPERADO. Nunca imprime la URL ni el endpoint.
const [modo, origen] = process.argv.slice(2);
if (modo !== 'var' || !origen) {
  console.error('Uso: comprobar-neon.ts var <NOMBRE_VARIABLE>');
  process.exit(2);
}
const url = process.env[origen];
if (!url) {
  console.error(`::error::No se encontró la URL de la base de datos (${origen}).`);
  process.exit(1);
}
const r = comprobarEndpoint(url, process.env.NEON_ENDPOINT_ESPERADO);
if (!r.ok) {
  console.error(`::error::${r.motivo}`);
  process.exit(1);
}
console.log('Neon: el endpoint coincide con el esperado para este entorno.');
