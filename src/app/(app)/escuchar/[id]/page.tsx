import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { getTramo, glosarioPara, caminoDeNivel } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { FlujoTramo } from './flujo-tramo';

export default async function TramoPage({ params }: PageProps<'/escuchar/[id]'>) {
  const u = await requireUser();
  const { id } = await params;
  const tramo = getTramo(id);
  if (!tramo) notFound();
  const hecho = estadoCamino(caminoDeNivel(tramo.nivel), await itemsCompletados(getDb(), u.userId, tramo.nivel)).items.find((i) => i.id === id)?.estado === 'hecho';
  return <FlujoTramo tramo={tramo} glosario={glosarioPara(tramo.nivel, tramo.tema, tramo.palabrasClave)} yaCompletado={hecho} />;
}
