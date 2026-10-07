import { test as base, createBdd } from 'playwright-bdd';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from '../pages/login.page';
import { RegistroPage } from '../pages/registro.page';
import { NivelesPage } from '../pages/niveles.page';
import { InvitacionesPage } from '../pages/invitaciones.page';
import { LeccionPage } from '../pages/leccion.page';
import { HoyPage } from '../pages/hoy.page';
import { RepasoPage } from '../pages/repaso.page';
import { EscucharPage } from '../pages/escuchar.page';

export type Ctx = { enlace?: string; idInvitacion?: string; alias?: string; clave?: string; peticiones?: string[]; actividad?: number[] };

export const test = base.extend<{
  login: LoginPage; registro: RegistroPage; niveles: NivelesPage;
  invitaciones: InvitacionesPage; leccion: LeccionPage; hoy: HoyPage; repaso: RepasoPage; escuchar: EscucharPage; ctx: Ctx; axe: () => AxeBuilder;
}>({
  login: async ({ page }, use) => use(new LoginPage(page)),
  registro: async ({ page }, use) => use(new RegistroPage(page)),
  niveles: async ({ page }, use) => use(new NivelesPage(page)),
  leccion: async ({ page }, use) => use(new LeccionPage(page)),
  hoy: async ({ page }, use) => use(new HoyPage(page)),
  repaso: async ({ page }, use) => use(new RepasoPage(page)),
  escuchar: async ({ page }, use) => use(new EscucharPage(page)),
  invitaciones: async ({ browser, baseURL, extraHTTPHeaders }, use) => {
    // El admin opera en su propio contexto para no mezclar cookies con el aprendiz.
    // Un contexto manual no hereda `use`: se pasan baseURL y cabeceras (bypass) de forma explícita.
    const ctx = await browser.newContext({ storageState: '.auth/admin.json', baseURL, extraHTTPHeaders });
    await use(new InvitacionesPage(await ctx.newPage()));
    await ctx.close();
  },
  ctx: async ({}, use) => use({}),
  axe: async ({ page }, use) => use(() => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])),
});

export const { Given, When, Then } = createBdd(test);
