import type { Page } from '@playwright/test';

export class EvaluacionPage {
  constructor(private page: Page) {}
  abrir(nivel: string) { return this.page.goto(`/evaluacion/${nivel}`); }
  async empezar() { await this.page.getByRole('button', { name: 'Empezar' }).click(); }
  async responderTodas(opcion: 'Verdadero' | 'Falso') {
    for (;;) {
      if (await this.page.getByRole('heading', { level: 1, name: 'Revisa antes de enviar' }).isVisible()) return;
      await this.page.getByRole('radio', { name: opcion }).check();
      await this.page.getByRole('button', { name: 'Guardar y seguir' }).click();
    }
  }
  async enviar() {
    await this.page.getByRole('button', { name: 'Enviar evaluación' }).click();
    await this.page.getByRole('button', { name: 'Sí, enviar' }).click();
  }
  resultado(texto: string) { return this.page.getByText(new RegExp(`^\\s*${texto} ·`)); }
}
