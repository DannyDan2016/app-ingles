import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';

export default async function Home() {
  const u = await requireUser();
  redirect(u.nivelInicial ? '/niveles' : '/nivel-inicial');
}
