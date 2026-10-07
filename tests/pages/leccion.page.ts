import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Lección y tramo: ejercicios, lectura y glosario.
 * Con `teclado = true` todas las acciones se hacen solo con Tab, Espacio y Enter.
 */
export class LeccionPage {
  teclado = false;
  constructor(public page: Page) {}

  /** Tab hasta que el foco llega al elemento. */
  async enfocar(el: Locator) {
    await expect(el).toBeVisible();
    for (let i = 0; i < 80; i++) {
      if (await el.evaluate((n) => n === document.activeElement)) return;
      await this.page.keyboard.press('Tab');
    }
    throw new Error('El foco con Tab no llegó al elemento');
  }
  async pulsar(el: Locator) {
    if (!this.teclado) return el.click();
    await this.enfocar(el);
    await this.page.keyboard.press('Enter');
  }
  async marcar(el: Locator) {
    if (!this.teclado) return el.check();
    await this.enfocar(el);
    await this.page.keyboard.press('Space');
  }
  async escribir(el: Locator, texto: string) {
    if (!this.teclado) return el.fill(texto);
    await this.enfocar(el);
    await this.page.keyboard.type(texto);
  }
  async elegir(el: Locator, etiqueta: string) {
    if (!this.teclado) { await el.selectOption({ label: etiqueta }); return; }
    await this.enfocar(el);
    await this.page.keyboard.type(etiqueta); // typeahead nativo del <select>
  }

  /**
   * Del último ejercicio acertado al resumen. Único punto que conoce los pasos intermedios
   * (hoy ninguno; E1 añadirá «Tu frase» con «Omitir este paso»).
   */
  async irAlResumen() {
    await this.pulsar(this.continuar());
    await expect(this.paso('Resumen')).toBeVisible();
  }

  titulo() { return this.page.getByRole('heading', { level: 1 }); }
  paso(nombre: string) { return this.page.getByRole('heading', { level: 2, name: nombre }); }
  continuar() { return this.page.getByRole('button', { name: 'Continuar', exact: true }); }
  comprobar() { return this.page.getByRole('button', { name: 'Comprobar' }); }
  intentarDeNuevo() { return this.page.getByRole('button', { name: 'Intentar de nuevo' }); }
  saltarVideo() { return this.page.getByRole('button', { name: 'Saltar video' }); }
  reproducir() { return this.page.getByRole('button', { name: /Reproducir video/ }); }
  iframes() { return this.page.locator('iframe'); }
  iframeNocookie() { return this.page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]'); }
  posicion(texto: string) { return this.page.getByText(texto, { exact: true }); }
  /** Región de retroalimentación del ejercicio (color + icono + texto). */
  feedback() { return this.page.getByRole('main').getByRole('status').filter({ hasText: /Correcto|No es correcto/ }); }

  // Ejercicios
  opcion(texto: string) { return this.page.getByRole('radio', { name: texto, exact: true }); }
  respuesta() { return this.page.getByRole('textbox', { name: 'Respuesta' }); }
  pieza(texto: string) { return this.page.getByRole('button', { name: texto, exact: true }); }
  selectorDe(termino: string) { return this.page.getByLabel(termino, { exact: true }); }

  // Glosario (lectura)
  palabra(texto: string) { return this.page.getByRole('main').getByRole('button', { name: texto, exact: true }); }
  dialogo() { return this.page.getByRole('dialog'); }
  guardarPalabra() { return this.dialogo().getByRole('button', { name: 'Guardar en mi repaso' }); }
  estadoGuardado() { return this.dialogo().getByRole('status'); }
}
