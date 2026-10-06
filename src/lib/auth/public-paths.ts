export const PUBLIC_PATHS = ['/login', '/registro', '/api/salud'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
