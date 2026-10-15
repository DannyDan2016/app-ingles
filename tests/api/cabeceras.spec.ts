import { test, expect } from '@playwright/test';
import { rutas } from '../support/data';

const { publicas } = rutas();
// Manifest e iconos de la PWA son estáticos (force-static): la CDN de Vercel los sirve con ACAO `*`.
// Públicos y sin datos de usuario; ver docs/seguridad.md (10098).
const ESTATICOS_PWA = ['/manifest.webmanifest', '/icono-180.png', '/icono-192.png', '/icono-512.png', '/icono-maskable-512.png'];

test.describe('@api @seguridad cabeceras de seguridad', () => {
  for (const ruta of publicas) {
    test(`cabeceras en ${ruta}`, async ({ request }) => {
      const h = (await request.get(ruta)).headers();
      const csp = h['content-security-policy'] ?? '';
      expect(csp, `CSP ausente en ${ruta}`).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      // YouTube solo en modo privacidad ampliada y miniaturas de i.ytimg.com (nunca COEP).
      expect(csp).toContain('frame-src https://www.youtube-nocookie.com');
      expect(csp).toContain("img-src 'self' data: https://i.ytimg.com");
      expect(h['strict-transport-security'], ruta).toContain('max-age=');
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(h['permissions-policy']).toContain('microphone=()');
      expect(h['cross-origin-opener-policy'], ruta).toBe('same-origin');
      expect(h['cross-origin-resource-policy'], ruta).toBe('same-origin');
      expect(h['cross-origin-embedder-policy'], ruta).toBeUndefined();
      expect(h['x-powered-by']).toBeUndefined();
      // Sin CORS abierto en rutas propias (ZAP 10098 está en WARN por los estáticos de la CDN de Vercel).
      if (ESTATICOS_PWA.includes(ruta)) expect([undefined, '*'], `CORS en ${ruta}`).toContain(h['access-control-allow-origin']);
      else expect(h['access-control-allow-origin'], `CORS en ${ruta}`).toBeUndefined();
    });
  }
});
