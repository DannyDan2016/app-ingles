'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { setMetaDiaria } from '@/lib/progreso/repo';
import { COOKIE_TEMA, TEMAS_UI } from '@/lib/tema';

const metaSchema = z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(15)]));

export async function cambiarMetaAction(form: FormData) {
  const u = await requireUser();
  const meta = metaSchema.safeParse(form.get('meta'));
  if (!meta.success) redirect('/perfil');
  await setMetaDiaria(getDb(), u.userId, meta.data);
  revalidatePath('/perfil');
  revalidatePath('/hoy');
}

export async function cambiarTemaAction(form: FormData) {
  await requireUser();
  const tema = z.enum(TEMAS_UI).safeParse(form.get('tema'));
  if (!tema.success) redirect('/perfil');
  (await cookies()).set(COOKIE_TEMA, tema.data, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.COOKIE_INSECURE !== 'true',
    httpOnly: true,
    maxAge: 31536000,
  });
  revalidatePath('/', 'layout');
}
