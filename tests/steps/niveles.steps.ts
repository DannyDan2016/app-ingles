import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { crearCuenta } from './comunes.steps';
import { sinScrollHorizontal } from '../support/pantalla';

When('elijo {string} como nivel inicial', async ({ niveles }, nivel: string) => {
  await niveles.elegirNivel(nivel);
  await expect(niveles.titulo()).toBeVisible();
});

Then('A1 aparece como {string}, A2 como {string} y B1 como {string}', async ({ niveles }, a1: string, a2: string, b1: string) => {
  await niveles.irA('Camino');
  await expect(niveles.tarjeta('A1')).toContainText(a1);
  await expect(niveles.tarjeta('A2')).toContainText(a2);
  await expect(niveles.tarjeta('B1')).toContainText(b1);
});

Given('que tengo una cuenta con nivel elegido', async ({ invitaciones, registro, page, ctx, niveles }) => {
  await crearCuenta({ invitaciones, registro, page, ctx });
  await niveles.elegirNivel('A2');
  await expect(niveles.titulo()).toBeVisible();
});

Then('no aparece scroll horizontal', async ({ page }) => {
  await sinScrollHorizontal(page);
});
