import { expect } from '@playwright/test';
import { Given, Then } from '../fixtures';
import type { Ctx } from '../fixtures';
import type { InvitacionesPage } from '../pages/invitaciones.page';
import type { RegistroPage } from '../pages/registro.page';
import type { Page } from '@playwright/test';
import { aliasNuevo } from '../support/data';

export const CLAVE = 'clave-de-prueba-larga';

/** Flujo completo: el admin genera SU invitación y la persona se registra con ella. */
export async function crearCuenta(f: { invitaciones: InvitacionesPage; registro: RegistroPage; page: Page; ctx: Ctx }) {
  const { invitaciones, registro, page, ctx } = f;
  const inv = await invitaciones.generar();
  ctx.enlace = inv.enlace;
  ctx.idInvitacion = inv.id;
  ctx.alias = aliasNuevo();
  ctx.clave = CLAVE;
  await registro.abrir(ctx.enlace);
  await registro.crearCuenta(ctx.alias, ctx.clave);
  await expect(page).toHaveURL(/\/nivel-inicial$/);
}

Given('que tengo una cuenta creada', async ({ invitaciones, registro, page, ctx }) => crearCuenta({ invitaciones, registro, page, ctx }));
Given('que tengo una cuenta nueva', async ({ invitaciones, registro, page, ctx }) => crearCuenta({ invitaciones, registro, page, ctx }));
Given('que no tengo sesión', async ({ page }) => page.context().clearCookies());

Then('veo el mensaje {string}', async ({ login }, texto: string) => {
  await expect(login.alerta()).toContainText(texto);
});

Then('la página no tiene violaciones de accesibilidad graves', async ({ axe }) => {
  const { violations } = await axe().analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves, JSON.stringify(graves.map((v) => ({ id: v.id, impact: v.impact, nodos: v.nodes.map((n) => n.target) })))).toEqual([]);
});
