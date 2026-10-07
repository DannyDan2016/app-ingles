export const PUBLIC_PATHS = ['/login', '/registro', '/api/salud'];

// Coincidencia exacta: una ruta pública no abre sus subrutas (/login/x sigue protegida).
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}
