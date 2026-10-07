'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { NIVELES } from '@/lib/progreso/niveles';
import type { Caja } from '@/lib/repaso/leitner';
import { responderTarjeta } from '@/lib/repaso/repaso.repo';

export async function responderTarjetaAction(input: { termino: string; nivel: string; sabia: boolean; cajaEsperada: number }) {
  const u = await requireUser();
  const p = z.object({ termino: z.string().min(1).max(60), cajaEsperada: z.number().int().min(1).max(5), nivel: z.enum(NIVELES), sabia: z.boolean() }).safeParse(input);
  if (!p.success) return { ok: false as const };
  const r = await responderTarjeta(getDb(), u.userId, p.data.termino, p.data.nivel, p.data.sabia, new Date(), p.data.cajaEsperada as Caja);
  return r ? { ok: true as const, caja: r.caja } : { ok: false as const };
}
