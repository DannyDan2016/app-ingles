import { expect, type Page } from '@playwright/test';

export async function sinScrollHorizontal(page: Page) {
  const anchos = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const culpables = [...document.body.querySelectorAll('*')]
      .filter((e) => e.getBoundingClientRect().right > w + 1)
      .slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`);
    return { hay: document.documentElement.scrollWidth > w, scroll: document.documentElement.scrollWidth, w, culpables };
  });
  expect(anchos.hay, JSON.stringify(anchos)).toBe(false);
}
