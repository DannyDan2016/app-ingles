import { test, expect } from '@playwright/test';
import { rutas } from '../support/data';

const { publicas } = rutas();

test.describe('@api @seguridad cabeceras de seguridad', () => {
  for (const ruta of publicas) {
    test(`cabeceras en ${ruta}`, async ({ request }) => {
      const h = (await request.get(ruta)).headers();
      const csp = h['content-security-policy'] ?? '';
      expect(csp, `CSP ausente en ${ruta}`).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(h['strict-transport-security'], ruta).toContain('max-age=');
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(h['permissions-policy']).toContain('microphone=()');
      expect(h['cross-origin-opener-policy'], ruta).toBe('same-origin');
      expect(h['cross-origin-resource-policy'], ruta).toBe('same-origin');
      expect(h['cross-origin-embedder-policy'], ruta).toBeUndefined();
      expect(h['x-powered-by']).toBeUndefined();
      // Sin CORS abierto en rutas propias (ZAP 10098 está en WARN por los estáticos de la CDN de Vercel).
      expect(h['access-control-allow-origin'], `CORS en ${ruta}`).toBeUndefined();
    });
  }
});
