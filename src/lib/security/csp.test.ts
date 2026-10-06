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
    expect(prod).toContain("frame-src 'none'");
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
  ])('incluye %s', (k) => expect(keys).toContain(k));
});
