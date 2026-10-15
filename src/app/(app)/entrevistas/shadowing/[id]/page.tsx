import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getShadowing } from '@/lib/contenido/catalogo';
import { ReproductorShadowing } from './reproductor-shadowing';

export default async function ShadowingSetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const set = getShadowing((await params).id);
  if (!set) notFound();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/entrevistas/shadowing" className="inline-flex min-h-11 items-center font-semibold text-primario underline">← Todos los sets</Link>
      <h1 lang="en" className="text-2xl font-bold">{set.titulo}</h1>
      <p className="text-texto-suave">Escucha la frase, repítela en voz alta y pasa a la siguiente.</p>
      <ReproductorShadowing set={set} />
    </div>
  );
}
