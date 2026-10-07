import { describe, it, expect } from 'vitest';
import { buildCsp, STATIC_SECURITY_HEADERS } from './csp';

describe('buildCsp', () => {
  const prod = buildCsp('abc', { dev: false, https: true });
  it('usa nonce y strict-dynamic, sin unsafe-eval en producción', () => {
    expect(prod).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(prod).not.toContain('unsafe-eval');
  });
  it('bloquea framing y objetos', () => {
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
  });
  it('permite solo el iframe de youtube-nocookie y las miniaturas de i.ytimg.com', () => {
    expect(prod).toContain('frame-src https://www.youtube-nocookie.com');
    expect(prod).not.toContain("frame-src 'none'");
    expect(prod).toContain("img-src 'self' data: https://i.ytimg.com");
  });
  it('script-src sigue sin hosts (strict-dynamic propaga la confianza al script de la IFrame API cargado tras el clic)', () => {
    expect(prod).toMatch(/script-src 'self' 'nonce-abc' 'strict-dynamic'(;|$)/);
  });
  it('upgrade-insecure-requests solo con https', () => {
    expect(prod).toContain('upgrade-insecure-requests');
    expect(buildCsp('abc', { dev: false, https: false })).not.toContain('upgrade-insecure-requests');
  });
  it('dev permite unsafe-eval (necesario para el HMR de Next)', () => {
    expect(buildCsp('abc', { dev: true, https: false })).toContain("'unsafe-eval'");
  });
});

describe('cabeceras estáticas', () => {
  const keys = STATIC_SECURITY_HEADERS.map((h) => h.key);
  it.each([
    'Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options',
    'Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy',
  ])('incluye %s', (k) => expect(keys).toContain(k));
  it('COOP y CORP en same-origin y sin COEP', () => {
    const v = (k: string) => STATIC_SECURITY_HEADERS.find((h) => h.key === k)?.value;
    expect(v('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(v('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(keys).not.toContain('Cross-Origin-Embedder-Policy');
  });
});
