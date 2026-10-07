'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { NIVELES } from '@/lib/progreso/niveles';
import { responderTarjeta } from '@/lib/repaso/repaso.repo';

export async function responderTarjetaAction(input: { termino: string; nivel: string; sabia: boolean }) {
  const u = await requireUser();
  const p = z.object({ termino: z.string().max(60), nivel: z.enum(NIVELES), sabia: z.boolean() }).safeParse(input);
  if (!p.success) return { ok: false as const };
  const r = await responderTarjeta(getDb(), u.userId, p.data.termino, p.data.nivel, p.data.sabia, new Date());
  return r ? { ok: true as const, caja: r.caja } : { ok: false as const };
}
