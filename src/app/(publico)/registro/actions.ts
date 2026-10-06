'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { registerWithInvite } from '@/lib/auth/invites';
import { createSession } from '@/lib/auth/sessions';
import { sessionCookieName, sessionCookieOptions } from '@/lib/auth/cookie';
import { registroSchema, mensajeRegistro, MENSAJE_REGISTRO_GENERICO } from '@/lib/validation/schemas';

export type RegistroState = { error?: string; alias?: string };

export async function registroAction(_: RegistroState, form: FormData): Promise<RegistroState> {
  const parsed = registroSchema.safeParse({
    code: form.get('code'),
    alias: form.get('alias'),
    password: form.get('password'),
  });
  if (!parsed.success) {
    const codigoMalo = parsed.error.issues.some((i) => i.path[0] === 'code');
    return { error: codigoMalo ? mensajeRegistro('inexistente') : MENSAJE_REGISTRO_GENERICO };
  }
  const db = getDb();
  const now = new Date();
  const r = await registerWithInvite(db, parsed.data, now);
  if (!r.ok) return { error: mensajeRegistro(r.error), alias: parsed.data.alias.slice(0, 64) };
  const s = await createSession(db, r.userId, now);
  (await cookies()).set(sessionCookieName(), s.token, sessionCookieOptions(s.expiraAt));
  redirect('/nivel-inicial');
}
