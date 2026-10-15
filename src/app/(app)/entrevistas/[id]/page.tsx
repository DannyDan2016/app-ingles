import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getPreguntaEntrevista } from '@/lib/contenido/catalogo';
import { Tarjeta } from '@/components/tarjeta';

export default async function PreguntaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const p = getPreguntaEntrevista((await params).id);
  if (!p) notFound();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/entrevistas" className="inline-flex min-h-11 items-center font-semibold text-primario underline">← Todas las preguntas</Link>
      <h1 lang="en" className="text-2xl font-bold">{p.pregunta}</h1>
      <Tarjeta aria-labelledby="e-respuesta">
        <h2 id="e-respuesta" className="mb-2 text-lg font-semibold">Respuesta modelo</h2>
        <p lang="en" className="whitespace-pre-line">{p.respuesta}</p>
      </Tarjeta>
      <Tarjeta aria-labelledby="e-estructuras">
        <h2 id="e-estructuras" className="mb-2 text-lg font-semibold">Estructuras para tu respuesta</h2>
        <ul lang="en" className="list-disc pl-5">{p.estructuras.map((e) => <li key={e}>{e}</li>)}</ul>
      </Tarjeta>
      <Tarjeta aria-labelledby="e-vocab">
        <h2 id="e-vocab" className="mb-2 text-lg font-semibold">Vocabulario</h2>
        <ul className="grid gap-1">{p.vocabulario.map((v) => <li key={v.termino}><span lang="en" className="font-semibold">{v.termino}</span>: {v.traduccion}</li>)}</ul>
      </Tarjeta>
    </div>
  );
}
