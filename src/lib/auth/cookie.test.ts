import { describe, it, expect, afterEach, vi } from 'vitest';
import { sessionCookieName, sessionCookieOptions, sessionCookieClearOptions } from './cookie';

afterEach(() => vi.unstubAllEnvs());

describe('cookie de sesión', () => {
  it('por defecto __Host- y Secure', () => {
    expect(sessionCookieName()).toBe('__Host-sesion');
    expect(sessionCookieOptions(new Date(0))).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  });
  it('COOKIE_INSECURE=true (solo stack local) quita Secure y el prefijo', () => {
    vi.stubEnv('COOKIE_INSECURE', 'true');
    expect(sessionCookieName()).toBe('sesion');
    expect(sessionCookieOptions(new Date(0)).secure).toBe(false);
  });
  it('COOKIE_INSECURE se ignora dentro de Vercel', () => {
    vi.stubEnv('COOKIE_INSECURE', 'true');
    vi.stubEnv('VERCEL', '1');
    expect(sessionCookieName()).toBe('__Host-sesion');
  });
});

describe('borrado de la cookie de sesión', () => {
  it('mismas opciones que la cookie (Secure, path /) con maxAge 0', () => {
    expect(sessionCookieClearOptions()).toEqual({
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0,
    });
  });
  it('sin Secure cuando COOKIE_INSECURE=true', () => {
    vi.stubEnv('COOKIE_INSECURE', 'true');
    expect(sessionCookieClearOptions().secure).toBe(false);
  });
});
