import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';

const entorno = z.enum(['local', 'preview']).default('local').parse(process.env.TEST_ENV);

// BASE_URL: variable de entorno (compose/CI/preview) o, si falta, el YAML del entorno (data/<entorno>/entorno.yaml).
// No hay valor por defecto en el código: así ninguna URL de máquina local vive fuera de data/local/.
function urlPorDefecto(): string | undefined {
  const ruta = new URL(`../data/${entorno}/entorno.yaml`, import.meta.url);
  if (!existsSync(ruta)) return undefined;
  return z.object({ base_url: z.url() }).parse(parse(readFileSync(ruta, 'utf8'))).base_url;
}

const schema = z.object({
  TEST_ENV: z.enum(['local', 'preview']),
  BASE_URL: z.url('Define BASE_URL (obligatoria fuera de local)'),
  E2E_ADMIN_ALIAS: z.string().default('admin_e2e'),
  E2E_ADMIN_PASSWORD: z.string().min(12, 'Define E2E_ADMIN_PASSWORD (mínimo 12)'),
  VERCEL_BYPASS: z.string().optional(),
});

export const env = schema.parse({
  ...process.env,
  TEST_ENV: entorno,
  BASE_URL: process.env.BASE_URL || urlPorDefecto(),
  VERCEL_BYPASS: process.env.VERCEL_BYPASS || undefined,
});
