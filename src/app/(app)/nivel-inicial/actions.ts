'use server';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { nivelSchema } from '@/lib/validation/schemas';
import { setNivelInicial } from '@/lib/progreso/repo';

export async function nivelInicialAction(form: FormData) {
  const u = await requireUser();
  const nivel = nivelSchema.safeParse(form.get('nivel'));
  if (!nivel.success) redirect('/nivel-inicial');
  await setNivelInicial(getDb(), u.userId, nivel.data);
  redirect('/hoy');
}
