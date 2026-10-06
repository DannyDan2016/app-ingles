import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { validateSession } from './sessions';
import { sessionCookieName } from './cookie';

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;
  return validateSession(getDb(), token, new Date());
});

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.rol !== 'admin') notFound();
  return u;
}
