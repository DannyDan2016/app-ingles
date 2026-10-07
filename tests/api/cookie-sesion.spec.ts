import { test, expect } from '@playwright/test';
import { env } from '../support/env';
import { LoginPage } from '../pages/login.page';

test.describe('@api @seguridad cookie de sesión', () => {
  test('el login real emite la cookie de sesión con atributos seguros', async ({ page, context }) => {
    const login = new LoginPage(page);
    await login.abrir();
    await login.entrar(env.E2E_ADMIN_ALIAS, env.E2E_ADMIN_PASSWORD);
    await page.waitForURL(/\/hoy$/);

    // Stack local por http (COOKIE_INSECURE=true): la app usa el nombre `sesion` y sin Secure,
    // porque el prefijo __Host- y Secure exigen https. En preview la cookie es __Host-sesion + Secure.
    const local = env.TEST_ENV === 'local';
    const cookie = (await context.cookies()).find((c) => c.name === (local ? 'sesion' : '__Host-sesion'));
    expect(cookie, 'cookie de sesión ausente').toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');
    expect(cookie!.path).toBe('/');
    expect(cookie!.secure).toBe(!local);
  });
});
