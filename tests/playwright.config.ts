import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env } from './support/env';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.ts', 'fixtures/**/*.ts'],
  language: 'es',
});

const bypass = env.VERCEL_BYPASS
  ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }
  : undefined;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Un solo worker: los escenarios generan/revocan invitaciones del mismo admin y localizan
  // su fila por diferencia de listas; en paralelo podrían verse filas ajenas.
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.BASE_URL,
    extraHTTPHeaders: bypass,
    trace: env.TEST_ENV === 'local' ? 'retain-on-failure' : 'off', // las trazas guardarían el bypass
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, testDir: '.' },
    { name: 'api', testDir: 'api', dependencies: ['setup'] },
    { name: 'chromium', testDir, grepInvert: /@responsive/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } }, dependencies: ['setup'] },
    // Humo multinavegador (sin @responsive).
    { name: 'firefox', testDir, grep: /@smoke/, use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } }, dependencies: ['setup'] },
    { name: 'webkit-movil', testDir, grep: /@smoke/, use: { ...devices['Desktop Safari'], viewport: { width: 360, height: 800 }, hasTouch: true }, dependencies: ['setup'] },
    // Flujo @responsive: una ejecución por tamaño de pantalla (el viewport lo define el proyecto).
    { name: 'responsive-360', testDir, grep: /@responsive/, use: { ...devices['Desktop Safari'], viewport: { width: 360, height: 800 }, hasTouch: true }, dependencies: ['setup'] },
    { name: 'responsive-768', testDir, grep: /@responsive/, use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } }, dependencies: ['setup'] },
    { name: 'responsive-1366', testDir, grep: /@responsive/, use: { ...devices['Desktop Firefox'], viewport: { width: 1366, height: 768 } }, dependencies: ['setup'] },
  ],
});
