import { test as base, expect, request as pwRequest } from '@playwright/test';
import { env } from '../support/env';

const bypass = env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined;

// Contexto con la sesión del admin (storageState del setup).
// Mismo origen: se declara con `Sec-Fetch-Site: same-origin` (sin Origin). Con `Origin` propio el resultado dependería de
// que `req.nextUrl.origin` coincida con el host público, y en el contenedor standalone (HOSTNAME=0.0.0.0) no coincide.
const MISMO_ORIGEN = { 'sec-fetch-site': 'same-origin' };
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

test.describe('@api @seguridad POST /api/actividad', () => {
  test('sin cookie → 401', async ({ anonimo }) => {
    const r = await anonimo.post('/api/actividad', { data: { segundos: 30 }, headers: MISMO_ORIGEN });
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ error: 'no_autenticado' });
  });

  test('con sesión y Origin ajeno → 403', async ({ sesion }) => {
    const r = await sesion.post('/api/actividad', { data: { segundos: 30 }, headers: { origin: 'https://sitio-ajeno.example' } });
    expect(r.status()).toBe(403);
  });

  test('{ segundos: 0 } → 400', async ({ sesion }) => {
    const r = await sesion.post('/api/actividad', { data: { segundos: 0 }, headers: MISMO_ORIGEN });
    expect(r.status()).toBe(400);
  });

  test('con sesión y Origin propio (el de baseURL) → 204', async ({ sesion, baseURL }) => {
    const r = await sesion.post('/api/actividad', { data: { segundos: 30 }, headers: { origin: new URL(baseURL!).origin } });
    expect(r.status()).toBe(204);
  });

  test('{ segundos: 30 } → 204', async ({ sesion }) => {
    const r = await sesion.post('/api/actividad', { data: { segundos: 30 }, headers: MISMO_ORIGEN });
    expect(r.status()).toBe(204);
  });
});
