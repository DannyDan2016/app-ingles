'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { login } from '@/lib/auth/login';
import { sessionCookieName, sessionCookieOptions } from '@/lib/auth/cookie';
import { getClientIp } from '@/lib/request-ip';
import { loginSchema } from '@/lib/validation/schemas';

export type LoginState = { error?: string; alias?: string };

const CREDENCIALES = 'Usuario o contraseña incorrectos.';

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ alias: form.get('alias'), password: form.get('password') });
  if (!parsed.success) return { error: CREDENCIALES };
  const { alias, password } = parsed.data;
  const r = await login(getDb(), { alias, password, ip: await getClientIp() }, new Date());
  if (!r.ok) {
    return { error: r.error === 'bloqueado' ? 'Demasiados intentos. Espera 15 minutos.' : CREDENCIALES, alias: alias.slice(0, 64) };
  }
  (await cookies()).set(sessionCookieName(), r.token, sessionCookieOptions(r.expiraAt));
  redirect('/');
}
