'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { NIVEL_POR_DEFECTO } from '@/lib/progreso/niveles';
import { setNivelInicial, setMetaDiaria } from '@/lib/progreso/repo';

const metaSchema = z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(15)]));

/** Todos empiezan en A2: el nivel no se elige ni se lee del formulario. */
export async function nivelInicialAction(form: FormData) {
  const u = await requireUser();
  const meta = metaSchema.safeParse(form.get('meta'));
  if (!meta.success) redirect('/nivel-inicial');
  const db = getDb();
  await setNivelInicial(db, u.userId, NIVEL_POR_DEFECTO);
  await setMetaDiaria(db, u.userId, meta.data);
  redirect('/hoy');
}
