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

// Cookie inventada: el nombre depende del entorno (`sesion` en local por http, `__Host-sesion` con https); se envían ambas
// para que, sea cual sea el nombre que lea la app, llegue a validateSession y no solo al filtro optimista del proxy.
const COOKIE_INVENTADA = 'sesion=x; __Host-sesion=x';

// Marcadores de datos protegidos que NO pueden aparecer en la respuesta de una página protegida sin sesión válida.
// (El layout sí se sirve: la nav estática «Inglés técnico» / «Salir» no es un dato protegido.)
const MARCADORES = [
  'Tus niveles',
  'Elige tu nivel',
  'Generar invitación',
  'data-testid="enlace-invitacion"',
  'href="/admin/invitaciones"',
  />Invitaciones</,
  env.E2E_ADMIN_ALIAS,
];

test.describe('@api @seguridad cookie de sesión inventada', () => {
  for (const { ruta } of protegidas.filter((p) => p.tipo === 'pagina')) {
    test(`${ruta} con cookie inventada: redirige a /login y no filtra datos`, async ({ request }) => {
      const r = await request.get(ruta, { maxRedirects: 0, headers: { cookie: COOKIE_INVENTADA } });
      const cuerpo = await r.text();
      if ([302, 303, 307, 308].includes(r.status())) {
        expect(new URL(r.headers()['location'], 'http://x').pathname).toBe('/login');
      } else {
        // Next hace streaming (loading.tsx): el 200 ya salió, y la redirección viaja como meta refresh + NEXT_REDIRECT.
        expect(r.status()).toBe(200);
        expect(cuerpo).toMatch(/http-equiv="refresh" content="\d+;url=\/login"/);
      }
      for (const m of MARCADORES) {
        if (typeof m === 'string') expect(cuerpo, `marcador «${m}»`).not.toContain(m);
        else expect(cuerpo, `marcador ${m}`).not.toMatch(m);
      }
    });
  }
});

test.describe('@api @seguridad enlace de administración', () => {
  test('el admin ve el enlace «Invitaciones» en la navegación', async ({ browser, baseURL }) => {
    // Contexto del admin (storageState del setup) con las mismas cabeceras de bypass que el resto.
    const ctx = await browser.newContext({
      storageState: '.auth/admin.json',
      baseURL,
      extraHTTPHeaders: env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined,
    });
    const page = await ctx.newPage();
    await page.goto('/niveles');
    const enlace = page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Invitaciones' });
    await expect(enlace).toBeVisible();
    await expect(enlace).toHaveAttribute('href', '/admin/invitaciones');
    await ctx.close();
  });
});
