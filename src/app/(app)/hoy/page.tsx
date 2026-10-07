import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';

export default async function HoyPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  return <h1 className="text-2xl font-bold">Hoy</h1>;
}
