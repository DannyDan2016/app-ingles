import type { Page } from '@playwright/test';

export class RepasoPage {
  constructor(private page: Page) {}
  async abrir() { await this.page.goto('/repaso'); }
  sinPendientes() { return this.page.getByText('No tienes repasos pendientes hoy'); }
  vocabulario() { return this.page.getByRole('region', { name: 'Mi vocabulario' }); }
}
