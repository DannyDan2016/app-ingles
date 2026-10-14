import { test as base, expect, request as pwRequest } from '@playwright/test';
import { env } from '../support/env';

const bypass = env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined;

const test = base.extend<{ sesion: Awaited<ReturnType<typeof pwRequest.newContext>>; anonimo: Awaited<ReturnType<typeof pwRequest.newContext>> }>({
  sesion: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({ baseURL, storageState: '.auth/admin.json', extraHTTPHeaders: bypass });
    await use(ctx);
    await ctx.dispose();
  },
  anonimo: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({ baseURL, extraHTTPHeaders: bypass });
    await use(ctx);
    await ctx.dispose();
  },
});

test.describe('@api @seguridad GET /api/exportar', () => {
  test('sin cookie → 401', async ({ anonimo }) => {
    const r = await anonimo.get('/api/exportar');
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ error: 'no_autenticado' });
  });

  test('con sesión → JSON adjunto solo con los datos propios y sin secretos', async ({ sesion }) => {
    const r = await sesion.get('/api/exportar');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-disposition']).toMatch(/^attachment; filename="progreso-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(r.headers()['cache-control']).toBe('no-store');
    const texto = await r.text();
    const json = JSON.parse(texto);
    expect(json.version).toBe(1);
    expect(json.perfil.alias).toBe(env.E2E_ADMIN_ALIAS);
    expect(Object.keys(json).sort()).toEqual(['actividad', 'exportadoEn', 'lecciones', 'perfil', 'respuestas', 'tarjetas', 'version']);
    expect(texto).not.toMatch(/password|argon|hash|token/i);
  });
});

test.describe('@api Perfil: descargar mi progreso', () => {
  test('el botón «Descargar mi progreso» descarga progreso-AAAA-MM-DD.json', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ storageState: '.auth/admin.json', baseURL, extraHTTPHeaders: bypass, acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto('/perfil');
    const enlace = page.getByRole('link', { name: 'Descargar mi progreso' });
    await expect(enlace).toBeVisible();
    const [descarga] = await Promise.all([page.waitForEvent('download'), enlace.click()]);
    expect(descarga.suggestedFilename()).toMatch(/^progreso-\d{4}-\d{2}-\d{2}\.json$/);
    await ctx.close();
  });
});
