import { test, expect } from '@playwright/test';
import { rutas } from '../support/data';
import { RutasService } from './services/rutas.service';

const { protegidas, publicas } = rutas();

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
