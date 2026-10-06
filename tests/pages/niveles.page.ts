import type { Page } from '@playwright/test';

export class NivelesPage {
  constructor(private page: Page) {}
  async elegirNivel(nivel: string) {
    await this.page.getByRole('radio', { name: nivel, exact: true }).check();
    await this.page.getByRole('button', { name: 'Guardar nivel' }).click();
  }
  async salir() { await this.page.getByRole('button', { name: 'Salir' }).click(); }
  tarjeta(nivel: string) { return this.page.getByRole('listitem').filter({ hasText: new RegExp(`^${nivel}`) }); }
  titulo() { return this.page.getByRole('heading', { level: 1, name: 'Tus niveles' }); }
  tituloElegirNivel() { return this.page.getByRole('heading', { level: 1, name: 'Elige tu nivel' }); }
}
