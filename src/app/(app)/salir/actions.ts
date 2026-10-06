'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db/client';
import { deleteSession } from '@/lib/auth/sessions';
import { sessionCookieName, sessionCookieClearOptions } from '@/lib/auth/cookie';

export async function salirAction() {
  const store = await cookies();
  const token = store.get(sessionCookieName())?.value;
  if (token) await deleteSession(getDb(), token);
  // Se reescribe con las mismas opciones (incl. Secure): delete() no las emite y __Host- lo ignoraria.
  store.set(sessionCookieName(), '', sessionCookieClearOptions());
  redirect('/login');
}
