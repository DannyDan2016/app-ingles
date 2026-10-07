import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { aliasNuevo } from '../support/data';
import { CLAVE } from './comunes.steps';

Given('que el admin generó una invitación', async ({ invitaciones, ctx }) => {
  const inv = await invitaciones.generar();
  ctx.enlace = inv.enlace;
  ctx.idInvitacion = inv.id;
});

Given('que el admin generó una invitación y la revocó', async ({ invitaciones, ctx }) => {
  const inv = await invitaciones.generar();
  ctx.enlace = inv.enlace;
  ctx.idInvitacion = inv.id;
  await invitaciones.revocar(inv.id); // revoca SU fila, no "la primera"
});

When('abro el enlace y creo mi cuenta con una contraseña válida', async ({ registro, ctx }) => {
  await registro.abrir(ctx.enlace!);
  await registro.crearCuenta(aliasNuevo(), CLAVE);
});

When('creo mi cuenta con una contraseña válida', async ({ registro, niveles, ctx }) => {
  ctx.alias = aliasNuevo();
  ctx.clave = CLAVE;
  await registro.crearCuenta(ctx.alias, ctx.clave);
  await expect(niveles.tituloElegirNivel()).toBeVisible();
});

When('cierro mi sesión', async ({ page, niveles, login }) => {
  await niveles.salir();
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.titulo()).toBeVisible();
});

When('abro el enlace', async ({ registro, ctx }) => registro.abrir(ctx.enlace!));

Then('veo la pantalla para elegir mi nivel', async ({ niveles }) => {
  await expect(niveles.tituloElegirNivel()).toBeVisible();
});

Then('no veo el formulario de registro', async ({ registro }) => {
  await expect(registro.botonCrearCuenta()).toHaveCount(0);
});

When('abro directamente una página privada', async ({ page }) => page.goto('/hoy'));

When('abro la pantalla de acceso', async ({ login }) => login.abrir());

Then('me redirige a la pantalla de acceso', async ({ page, login }) => {
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.titulo()).toBeVisible();
});

Given('que cierro mi sesión', async ({ page, niveles, login }) => {
  await niveles.salir();
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.titulo()).toBeVisible();
});

When('entro con mi usuario y mi contraseña', async ({ login, ctx }) => {
  await login.entrar(ctx.alias!, ctx.clave!);
});

Then('veo mi pantalla de inicio', async ({ niveles }) => {
  await expect(niveles.titulo()).toBeVisible();
});

When('fallo la contraseña {int} veces', async ({ page, login, ctx }, n: number) => {
  await page.context().clearCookies();
  for (let i = 0; i < n; i++) {
    await login.abrir();
    await login.entrar(ctx.alias!, 'contraseña-incorrecta');
    await expect(login.alerta()).toBeVisible();
  }
});

When('lo intento otra vez con la contraseña correcta', async ({ login, ctx }) => {
  await login.abrir();
  await login.entrar(ctx.alias!, ctx.clave!);
});
