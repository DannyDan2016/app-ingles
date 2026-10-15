// Incluye manifest e iconos de la PWA: deben servirse sin sesión para poder instalar la app desde /login.
export const PUBLIC_PATHS = ['/login', '/registro', '/api/salud', '/manifest.webmanifest', '/icono-180.png', '/icono-192.png', '/icono-512.png', '/icono-maskable-512.png'];

// Coincidencia exacta: una ruta pública no abre sus subrutas (/login/x sigue protegida).
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}
