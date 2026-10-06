import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { crearCuenta } from './comunes.steps';

When('elijo {string} como nivel inicial', async ({ niveles }, nivel: string) => niveles.elegirNivel(nivel));

Then('A1 aparece como {string}, A2 como {string} y B1 como {string}', async ({ niveles }, a1: string, a2: string, b1: string) => {
  await expect(niveles.tarjeta('A1')).toContainText(a1);
  await expect(niveles.tarjeta('A2')).toContainText(a2);
  await expect(niveles.tarjeta('B1')).toContainText(b1);
});

Given('que tengo una cuenta con nivel elegido', async ({ invitaciones, registro, page, ctx, niveles }) => {
  await crearCuenta({ invitaciones, registro, page, ctx });
  await niveles.elegirNivel('A2');
  await expect(niveles.titulo()).toBeVisible();
});

When('veo mis niveles en una pantalla de {int}x{int}', async ({ page }, w: number, h: number) => {
  await page.setViewportSize({ width: w, height: h });
  await page.goto('/niveles');
});

Then('no aparece scroll horizontal', async ({ page }) => {
  const hayScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hayScroll).toBe(false);
});
