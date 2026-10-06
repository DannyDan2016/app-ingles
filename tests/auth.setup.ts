import { test as setup } from '@playwright/test';
import { env } from './support/env';
import { LoginPage } from './pages/login.page';

setup('sesión de admin', async ({ page }) => {
  const login = new LoginPage(page);
  await login.abrir();
  await login.entrar(env.E2E_ADMIN_ALIAS, env.E2E_ADMIN_PASSWORD);
  await page.waitForURL(/\/niveles$/);
  await page.context().storageState({ path: '.auth/admin.json' });
});
