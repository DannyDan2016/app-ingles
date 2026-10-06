import type { Page } from '@playwright/test';

export class RegistroPage {
  constructor(private page: Page) {}
  async abrir(enlace: string) { await this.page.goto(enlace); }
  async crearCuenta(alias: string, clave: string) {
    await this.page.getByLabel('Usuario').fill(alias);
    await this.page.getByLabel('Contraseña').fill(clave);
    await this.page.getByRole('button', { name: 'Crear cuenta' }).click();
  }
  alerta() { return this.page.getByRole('main').getByRole('alert'); }
  botonCrearCuenta() { return this.page.getByRole('button', { name: 'Crear cuenta' }); }
}
