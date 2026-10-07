import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { getLeccion, glosarioPara, caminoDeNivel } from '@/lib/contenido/catalogo';
import { segmentarLectura, terminosDeLectura } from '@/lib/contenido/lectura';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { FlujoLeccion } from './flujo-leccion';

export default async function LeccionPage({ params }: PageProps<'/leccion/[id]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { id } = await params;
  const leccion = getLeccion(id);
  if (!leccion) notFound();
  const estado = estadoCamino(caminoDeNivel(leccion.nivel), await itemsCompletados(getDb(), u.userId, leccion.nivel)).items.find((i) => i.id === id)?.estado;
  if (estado === 'bloqueado') redirect(`/camino/${leccion.nivel}`);
  const terminos = [...terminosDeLectura(leccion.lectura), ...leccion.terminos];
  const gl = glosarioPara(leccion.nivel, leccion.tema, terminos);
  const segmentos = segmentarLectura(leccion.lectura);
  const palabrasFrase = leccion.terminos.slice(0, 3).map((base) => ({
    base,
    visibles: [...new Set(segmentos.flatMap((s) => (s.tipo === 'termino' && s.base === base.toLowerCase() ? [s.visible] : [])))],
    entrada: gl[base],
  }));
  return <FlujoLeccion leccion={leccion} glosario={gl} yaCompletada={estado === 'hecho'} palabrasFrase={palabrasFrase} />;
}
