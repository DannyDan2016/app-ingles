import { test as base, expect, request as pwRequest } from '@playwright/test';
import { env } from '../support/env';
import { rutas } from '../support/data';
import { RutasService } from './services/rutas.service';

const { protegidas, publicas } = rutas();

// Contexto propio, sin cookies y solo con `x-vercel-protection-bypass`: con `x-vercel-set-bypass-cookie`
// (playwright.config) Vercel responde 307 a la misma URL para poner su cookie, y con maxRedirects: 0
// el test vería ese 307 en lugar de la respuesta de la app.
const test = base.extend({
  request: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({
      baseURL,
      extraHTTPHeaders: env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined,
    });
    await use(ctx);
    await ctx.dispose();
  },
});

test.describe('@api @seguridad rutas protegidas sin sesión', () => {
  for (const { ruta, tipo } of protegidas) {
    test(`${ruta} → ${tipo === 'api' ? '401' : 'redirección a /login'}`, async ({ request }) => {
      const r = await new RutasService(request).sinSesion(ruta);
      if (tipo === 'api') {
        expect(r.status()).toBe(401);
        expect(await r.json()).toEqual({ error: 'no_autenticado' });
      } else {
        expect([302, 303, 307, 308]).toContain(r.status());
        expect(new URL(r.headers()['location'], 'http://x').pathname).toBe('/login');
      }
    });
  }
  for (const ruta of publicas) {
    test(`${ruta} es pública`, async ({ request }) => {
      expect((await new RutasService(request).sinSesion(ruta)).status()).toBe(200);
    });
  }
});
