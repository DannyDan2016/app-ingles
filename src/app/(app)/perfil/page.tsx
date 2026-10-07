import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { Boton } from '@/components/boton';
import { salirAction } from '../salir/actions';
import { EnlaceAdmin } from './enlace-admin';

export default async function PerfilPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  return (
    <>
      <h1 className="text-2xl font-bold">Perfil</h1>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Suspense fallback={null}>
          <EnlaceAdmin />
        </Suspense>
        <form action={salirAction}>
          <Boton type="submit" variante="secundario">Salir</Boton>
        </form>
      </div>
    </>
  );
}
