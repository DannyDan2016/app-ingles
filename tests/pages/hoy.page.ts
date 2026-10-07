import type { Page } from '@playwright/test';

export class HoyPage {
  constructor(private page: Page) {}
  titulo() { return this.page.getByRole('heading', { level: 1, name: 'Hoy' }); }
  enlaceEmpezar() { return this.page.getByRole('main').getByRole('link', { name: 'Empezar' }); }
  tarjetaRepaso() { return this.page.getByRole('region', { name: 'Repaso' }); }
  textoMeta() { return this.page.getByRole('main').getByText(/\d+ de \d+ min/); }
}
