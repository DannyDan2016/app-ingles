'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { nivelSchema } from '@/lib/validation/schemas';
import { setNivelInicial, setMetaDiaria } from '@/lib/progreso/repo';

const metaSchema = z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(15)]));

export async function nivelInicialAction(form: FormData) {
  const u = await requireUser();
  const nivel = nivelSchema.safeParse(form.get('nivel'));
  const meta = metaSchema.safeParse(form.get('meta'));
  if (!nivel.success || !meta.success) redirect('/nivel-inicial');
  const db = getDb();
  await setNivelInicial(db, u.userId, nivel.data);
  await setMetaDiaria(db, u.userId, meta.data);
  redirect('/hoy');
}
