import { z } from 'zod';

export const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export type Dia = (typeof DIAS)[number];
export type Recordatorio = { dias: Dia[]; hora: string; minutos: number };

const esquema = z.object({
  dias: z.string().transform((s) => s.split(',')).pipe(z.array(z.enum(DIAS)).min(1).max(7))
    .refine((d) => new Set(d).size === d.length),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  min: z.coerce.number().int().min(5).max(120),
});

export function parsearParametros(q: URLSearchParams): { ok: true; valor: Recordatorio } | { ok: false } {
  const r = esquema.safeParse({ dias: q.get('dias') ?? '', hora: q.get('hora') ?? '', min: q.get('min') ?? '' });
  if (!r.success) return { ok: false };
  const dias = DIAS.filter((d) => r.data.dias.includes(d)); // orden canónico L→D
  return { ok: true, valor: { dias, hora: r.data.hora, minutos: r.data.min } };
}
