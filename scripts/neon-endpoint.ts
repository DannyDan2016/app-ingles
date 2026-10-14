/**
 * Comprobación de que cada entorno de deploy apunta a su rama de Neon (preview -> `preview`, production -> `main`).
 * Compara el ID de endpoint (`ep-xxx-123456`) de la URL con un valor esperado NO secreto guardado como variable
 * del environment de GitHub (`NEON_ENDPOINT_ESPERADO`). Nunca devuelve ni imprime la URL ni el endpoint real.
 */

/** Devuelve el ID de endpoint de una URL de Neon, igual para la URL directa y la del pooler (`-pooler`). */
export function endpointDeUrl(url: string): string {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    throw new Error('URL de base de datos no válida'); // sin el valor: lleva credenciales
  }
  if (!host.endsWith('.neon.tech')) throw new Error('El host de la base de datos no es de Neon');
  return host.split('.')[0].replace(/-pooler$/, '');
}

export function comprobarEndpoint(url: string, esperado: string | undefined): { ok: boolean; motivo?: string } {
  const e = (esperado ?? '').trim().toLowerCase();
  if (!e) return { ok: false, motivo: 'Falta la variable NEON_ENDPOINT_ESPERADO en el environment.' };
  let real: string;
  try {
    real = endpointDeUrl(url);
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : 'URL no válida' };
  }
  const esperadoId = e.split('.')[0].replace(/-pooler$/, '');
  if (real !== esperadoId) return { ok: false, motivo: 'La base de datos no es la rama de Neon esperada para este entorno.' };
  return { ok: true };
}

/** Lee una variable de un archivo .env (formato de `vercel pull`), con o sin comillas. */
export function urlDeArchivoEnv(contenido: string, nombre: string): string | undefined {
  for (const linea of contenido.split(/\r?\n/)) {
    const m = new RegExp(`^${nombre}=(.*)$`).exec(linea);
    if (m) return m[1].replace(/^(["'])(.*)\1$/, '$2');
  }
  return undefined;
}
