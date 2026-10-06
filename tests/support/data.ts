import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { env } from './env';

function load<T>(file: string, s: z.ZodType<T>): T {
  const path = new URL(`../data/${env.TEST_ENV}/${file}`, import.meta.url);
  const r = s.safeParse(parse(readFileSync(path, 'utf8')));
  if (!r.success) throw new Error(`data/${env.TEST_ENV}/${file}: ${r.error.message}`);
  return r.data;
}

export const rutas = () =>
  load('rutas.yaml', z.object({
    protegidas: z.array(z.object({ ruta: z.string(), tipo: z.enum(['pagina', 'api']) })),
    publicas: z.array(z.string()),
  }));

export const usuarios = () =>
  load('usuarios.yaml', z.object({ nuevo_prefijo: z.string(), nivel_inicial: z.string() }));

/** Alias único y válido (a-z, 0-9, _; máx. 20) para cuentas de prueba. */
export const aliasNuevo = () =>
  `${usuarios().nuevo_prefijo}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 20);
