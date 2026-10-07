import { describe, it, expect } from 'vitest';
import { PUBLIC_PATHS, isPublicPath } from './public-paths';

describe('rutas públicas', () => {
  it('lista fija', () => {
    expect(PUBLIC_PATHS).toEqual(['/login', '/registro', '/api/salud']);
  });
  it.each(['/login', '/registro', '/api/salud'])('%s es pública', (p) => {
    expect(isPublicPath(p)).toBe(true);
  });
  it.each(['/', '/niveles', '/api/cualquiera', '/loginx', '/api/salud-x', '/x/login', '/login/x', '/login/', '/registro/abc', '/api/salud/x'])('%s no es pública', (p) => {
    expect(isPublicPath(p)).toBe(false);
  });
});
