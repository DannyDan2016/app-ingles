import type { Page } from '@playwright/test';

export type InvitacionGenerada = { enlace: string; id: string };

export class InvitacionesPage {
  constructor(private page: Page) {}

  private filasRevocables() { return this.page.locator('form:has(input[name="id"])'); }
  private idsRevocables() {
    return this.page.locator('input[name="id"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  }

  /**
   * Genera una invitación y devuelve su enlace (relativo, válido con cualquier BASE_URL) y su id.
   * El id se obtiene por diferencia entre las filas antes y después, para poder actuar sobre
   * ESA invitación y no sobre "la primera" (requiere ejecución en serie: workers=1).
   */
  async generar(): Promise<InvitacionGenerada> {
    await this.page.goto('/admin/invitaciones');
    const antes = await this.idsRevocables();
    await this.page.getByRole('button', { name: 'Generar invitación' }).click();
    const enlace = this.page.getByTestId('enlace-invitacion');
    await enlace.waitFor();
    await this.filasRevocables().nth(antes.length).waitFor(); // la lista se refresca con la nueva fila
    const nuevas = (await this.idsRevocables()).filter((id) => !antes.includes(id));
    if (nuevas.length !== 1) throw new Error(`Se esperaba 1 invitación nueva y hay ${nuevas.length}`);
    const url = new URL((await enlace.textContent())!);
    return { enlace: `${url.pathname}${url.search}`, id: nuevas[0] };
  }

  /** Revoca la fila concreta de la invitación indicada y espera a que desaparezca el botón. */
  async revocar(id: string) {
    await this.page.goto('/admin/invitaciones');
    const fila = this.page.locator(`form:has(input[name="id"][value="${id}"])`);
    await fila.getByRole('button', { name: 'Revocar' }).click();
    await fila.waitFor({ state: 'detached' });
  }
}
