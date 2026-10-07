import { validarCatalogo } from '../../src/lib/contenido/reglas';
import { comprobarVideos, idsDeVideo } from '../../src/lib/contenido/videos';
import { cargarArchivos } from './cargar';

async function main() {
  const { errores, catalogo } = validarCatalogo(cargarArchivos({ incluirDemo: false }), { estricto: false });
  if (errores.length) {
    for (const e of errores) console.error(`error: ${e}`);
    process.exit(1);
  }
  const ids = idsDeVideo(catalogo);
  const fallos = await comprobarVideos(ids, fetch);
  for (const f of fallos) console.error(`video caído: ${f.id} (${f.status})`);
  console.log(`videos: ${ids.length} comprobados, ${fallos.length} caídos`);
  if (fallos.length) process.exit(1);
}
main();
