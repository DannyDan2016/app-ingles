import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { getLeccion, glosarioPara, caminoDeNivel } from '@/lib/contenido/catalogo';
import { terminosDeLectura } from '@/lib/contenido/lectura';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { FlujoLeccion } from './flujo-leccion';

export default async function LeccionPage({ params }: PageProps<'/leccion/[id]'>) {
  const u = await requireUser();
  const { id } = await params;
  const leccion = getLeccion(id);
  if (!leccion) notFound();
  const estado = estadoCamino(caminoDeNivel(leccion.nivel), await itemsCompletados(getDb(), u.userId, leccion.nivel)).items.find((i) => i.id === id)?.estado;
  if (estado === 'bloqueado') redirect(`/camino/${leccion.nivel}`);
  const terminos = [...terminosDeLectura(leccion.lectura), ...leccion.terminos];
  return <FlujoLeccion leccion={leccion} glosario={glosarioPara(leccion.nivel, leccion.tema, terminos)} yaCompletada={estado === 'hecho'} />;
}
