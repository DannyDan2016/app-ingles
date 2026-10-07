'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { requireAdmin } from '@/lib/auth/current-user';
import { buildInviteLink, inviteLinkProblem } from '@/lib/auth/invite-link';
import { createInvite, revokeInvite } from '@/lib/auth/invites';
import { revocarSchema } from '@/lib/validation/schemas';

export type InvitarState = { enlace?: string; error?: string };

export async function crearInvitacionAction(): Promise<InvitarState> {
  const admin = await requireAdmin();
  const h = await headers();
  const base = { appUrl: process.env.APP_URL, host: h.get('host'), proto: h.get('x-forwarded-proto'), vercelEnv: process.env.VERCEL_ENV };
  const errorEnlace = { error: 'No se pudo generar el enlace. Inténtalo de nuevo.' };
  const problema = inviteLinkProblem(base);
  if (problema) {
    console.error('crearInvitacion: APP_URL ausente o no válida en producción');
    return { error: problema };
  }
  // Se valida la configuración antes de crear la invitación para no dejar códigos huérfanos.
  if (!buildInviteLink({ ...base, code: 'x' })) return errorEnlace;
  const { code } = await createInvite(getDb(), admin.userId, new Date());
  revalidatePath('/admin/invitaciones');
  return { enlace: buildInviteLink({ ...base, code }) ?? undefined };
}

export async function revocarAction(form: FormData) {
  await requireAdmin();
  const r = revocarSchema.safeParse({ id: form.get('id') });
  if (!r.success) return; // id invalido: no hay nada que revocar
  await revokeInvite(getDb(), r.data.id, new Date());
  revalidatePath('/admin/invitaciones');
}
