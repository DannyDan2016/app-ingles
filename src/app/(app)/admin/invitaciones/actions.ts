'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/current-user';
import { createInvite, revokeInvite } from '@/lib/auth/invites';
import { revocarSchema } from '@/lib/validation/schemas';

export type InvitarState = { enlace?: string; error?: string };

export async function crearInvitacionAction(): Promise<InvitarState> {
  const admin = await requireAdmin();
  const h = await headers();
  const host = h.get('host');
  if (!host) return { error: 'No se pudo generar el enlace. Inténtalo de nuevo.' };
  const { code } = await createInvite(getDb(), admin.userId, new Date());
  const proto = h.get('x-forwarded-proto') ?? 'https';
  revalidatePath('/admin/invitaciones');
  return { enlace: `${proto}://${host}/registro?c=${code}` };
}

export async function revocarAction(form: FormData) {
  await requireAdmin();
  const r = revocarSchema.safeParse({ id: form.get('id') });
  if (!r.success) return; // id invalido: no hay nada que revocar
  await revokeInvite(getDb(), r.data.id, new Date());
  revalidatePath('/admin/invitaciones');
}
