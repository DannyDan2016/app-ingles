import type { Page } from '@playwright/test';

export class EscucharPage {
  constructor(private page: Page) {}
  async abrir() { await this.page.goto('/escuchar'); }
  /** Por id: el tramo real a2-qa-t1 comparte título con el de la demo. */
  tramo(id: string) { return this.page.getByRole('main').locator(`a[href="/escuchar/${id}"]`); }
  pasada(n: number) { return this.page.getByRole('heading', { level: 2, name: new RegExp(`^Pasada ${n} de 3`) }); }
  siguientePasada() { return this.page.getByRole('button', { name: 'Siguiente pasada' }); }
  irAPreguntas() { return this.page.getByRole('button', { name: 'Ir a las preguntas' }); }
}
