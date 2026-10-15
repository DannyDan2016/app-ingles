import { describe, it, expect } from 'vitest';
import { PUBLIC_PATHS, isPublicPath } from './public-paths';

const PUBLICAS = ['/login', '/registro', '/api/salud', '/manifest.webmanifest', '/icono-180.png', '/icono-192.png', '/icono-512.png', '/icono-maskable-512.png'];

describe('rutas públicas', () => {
  it('lista fija', () => {
    expect(PUBLIC_PATHS).toEqual(PUBLICAS);
  });
  it.each(PUBLICAS)('%s es pública', (p) => {
    expect(isPublicPath(p)).toBe(true);
  });
  it.each(['/', '/niveles', '/api/cualquiera', '/loginx', '/api/salud-x', '/x/login', '/login/x', '/login/', '/registro/abc', '/api/salud/x', '/manifest.webmanifest/x', '/icono-192.png/', '/icono-1920.png'])('%s no es pública', (p) => {
    expect(isPublicPath(p)).toBe(false);
  });
});
