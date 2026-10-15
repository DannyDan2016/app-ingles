import { test as base, expect, request as pwRequest } from '@playwright/test';
import { env } from '../support/env';

const bypass = env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined;
const Q = '/api/recordatorio?dias=L,M,X,J,V&hora=19:00&min=20';

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

test.describe('@api @seguridad GET /api/recordatorio', () => {
  test('sin cookie → 401', async ({ anonimo }) => {
    const r = await anonimo.get(Q);
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ error: 'no_autenticado' });
  });

  test('parámetros manipulados → 400', async ({ sesion }) => {
    const r = await sesion.get('/api/recordatorio?dias=L%0D%0ABEGIN:VEVENT&hora=19:00&min=20');
    expect(r.status()).toBe(400);
  });

  test('con sesión → .ics adjunto con el evento semanal', async ({ sesion }) => {
    const r = await sesion.get(Q);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toBe('text/calendar; charset=utf-8');
    expect(r.headers()['content-disposition']).toBe('attachment; filename="recordatorio-ingles.ics"');
    expect(r.headers()['cache-control']).toBe('no-store');
    const ics = await r.text();
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
    expect(ics).toContain('TRIGGER:PT0M');
  });
});

test.describe('@api Perfil: recordatorio en el calendario', () => {
  test('«Añadir a mi calendario» descarga recordatorio-ingles.ics', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ storageState: '.auth/admin.json', baseURL, extraHTTPHeaders: bypass, acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto('/perfil');
    const enlace = page.getByRole('link', { name: 'Añadir a mi calendario' });
    await expect(enlace).toBeVisible();
    const [descarga] = await Promise.all([page.waitForEvent('download'), enlace.click()]);
    expect(descarga.suggestedFilename()).toBe('recordatorio-ingles.ics');
    await ctx.close();
  });
});
