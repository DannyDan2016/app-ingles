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
  /** Progreso por bloque (texto, no solo color): los 4 bloques con «n de m». */
  progresoPorBloque() { return this.page.getByRole('list', { name: 'Progreso por bloque' }).getByRole('listitem'); }
  /** Responde la pregunta actual, espera a que el servidor la confirme, recarga y vuelve con «Anterior»: debe seguir elegida. */
  async respuestaSobreviveARecarga(opcion: 'Verdadero' | 'Falso') {
    await this.page.getByRole('radio', { name: opcion }).check();
    await this.page.getByRole('button', { name: 'Guardar y seguir' }).click();
    await this.page.getByRole('progressbar', { name: '1 de 20 respuestas guardadas' }).waitFor();
    await this.page.getByRole('button', { name: 'Anterior' }).click();
    await this.page.getByRole('radio', { name: opcion, checked: true }).waitFor();
    await this.page.reload();
    await this.page.getByRole('button', { name: 'Anterior' }).click();
    await this.page.getByRole('radio', { name: opcion, checked: true }).waitFor();
    await this.page.getByRole('button', { name: 'Guardar y seguir' }).click();
  }
  async enviar() {
    await this.page.getByRole('button', { name: 'Enviar evaluación' }).click();
    await this.page.getByRole('button', { name: 'Sí, enviar' }).click();
  }
  /** HTML completo de la página (incluye el payload RSC): para comprobar que no viajan soluciones. */
  html() { return this.page.content(); }
  resultado(texto: string) { return this.page.getByText(new RegExp(`^\\s*${texto} ·`)); }
}
