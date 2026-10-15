import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

When('filtro las preguntas por rol {string} y nivel {string}', async ({ page }, rol: string, nivel: string) => {
  await page.getByRole('link', { name: rol, exact: true }).click();
  await page.getByRole('link', { name: nivel, exact: true }).click();
  await expect(page).toHaveURL(/rol=.*nivel=|nivel=.*rol=/);
});
Then('veo la pregunta {string}', async ({ page }, texto: string) => {
  await expect(page.getByRole('link', { name: texto })).toBeVisible();
});
When('abro la pregunta {string}', async ({ page }, texto: string) => {
  await page.getByRole('link', { name: texto }).click();
});
Then('veo la respuesta modelo, las estructuras y el vocabulario', async ({ page }) => {
  for (const h of ['Respuesta modelo', 'Estructuras para tu respuesta', 'Vocabulario']) {
    await expect(page.getByRole('heading', { name: h })).toBeVisible();
  }
});
