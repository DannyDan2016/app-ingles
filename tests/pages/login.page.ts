import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}
  async abrir() { await this.page.goto('/login'); }
  async entrar(alias: string, clave: string) {
    await this.page.getByLabel('Usuario').fill(alias);
    await this.page.getByLabel('Contraseña').fill(clave);
    await this.page.getByRole('button', { name: 'Entrar' }).click();
  }
  // Next inyecta otro role=alert (route announcer) fuera de <main>: se acota al formulario.
  alerta() { return this.page.getByRole('main').getByRole('alert'); }
  titulo() { return this.page.getByRole('heading', { level: 1, name: 'Entrar' }); }
}
