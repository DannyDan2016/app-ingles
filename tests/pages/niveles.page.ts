import type { Page } from '@playwright/test';

/** Pantallas de entrada tras el registro: elegir nivel, «Hoy» y el mapa de niveles («Camino»). */
export class NivelesPage {
  constructor(private page: Page) {}
  async elegirNivel(nivel: string) {
    await this.page.getByRole('radio', { name: nivel, exact: true }).check();
    await this.page.getByRole('button', { name: 'Guardar y empezar' }).click();
  }
  /** Salir vive en Perfil (y en la pantalla de nivel inicial, que no tiene navegación). */
  async salir() {
    const salir = this.page.getByRole('button', { name: 'Salir' });
    if (!(await salir.isVisible())) await this.irA('Perfil');
    await salir.click();
  }
  async irA(seccion: 'Hoy' | 'Camino' | 'Escuchar' | 'Perfil') {
    await this.page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: seccion }).click();
    await this.page.getByRole('heading', { level: 1, name: seccion }).waitFor();
  }
  tarjeta(nivel: string) { return this.page.getByRole('listitem').filter({ hasText: new RegExp(`^Nivel ${nivel}`) }); }
  titulo() { return this.page.getByRole('heading', { level: 1, name: 'Hoy' }); }
  tituloElegirNivel() { return this.page.getByRole('heading', { level: 1, name: 'Elige tu nivel' }); }
}
