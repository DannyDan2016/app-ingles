import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { BLOQUES } from '@/lib/contenido/esquema';
import { leccionesDeNivel, tramosDeNivel } from '@/lib/contenido/catalogo';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { marcarRefuerzo, notasBloques } from '@/lib/evaluacion/evaluacion.repo';
import { armarRefuerzo } from '@/lib/evaluacion/refuerzo';
import { UMBRAL } from '@/lib/evaluacion/nota';
import { ETIQUETA_BLOQUE } from '@/lib/evaluacion/tipos';
import { ESPERA_MS } from '@/lib/evaluacion/elegibilidad';
import { formatoFechaHora } from '@/lib/tiempo/bogota';
import { FlujoRefuerzo } from './flujo-refuerzo';

export default async function RefuerzoPage({ params }: PageProps<'/evaluacion/[nivel]/refuerzo'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel } = await params;
  if (!isNivel(nivel)) notFound();
  const ctx = await contextoEvaluacion(getDb(), { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  if (ctx.elegibilidad.tipo !== 'falta_refuerzo' || !ctx.ultimo) redirect(`/camino/${nivel}`);
  const notas = notasBloques(ctx.ultimo);
  const bloques = BLOQUES.filter((b) => notas[b] < UMBRAL);
  const fuente = [
    ...leccionesDeNivel(nivel).flatMap((l) => l.ejercicios.map((ejercicio) => ({ ejercicio, origen: 'leccion' as const }))),
    ...tramosDeNivel(nivel).flatMap((t) => t.preguntas.map((ejercicio) => ({ ejercicio, origen: 'tramo' as const }))),
  ];
  const ejercicios = armarRefuerzo(fuente, bloques, ctx.ultimo.id);
  if (ejercicios.length === 0) {
    // Sin ejercicios de práctica para esos bloques: el refuerzo se da por hecho (no bloquear al alumno).
    await marcarRefuerzo(getDb(), u.userId, ctx.ultimo.id, new Date());
    redirect(`/camino/${nivel}`);
  }
  const reintentoDesde = formatoFechaHora(new Date((ctx.ultimo.terminadoAt ?? new Date()).getTime() + ESPERA_MS));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Refuerzo de {nivel}</h1>
      <p className="text-texto-suave">Practica {bloques.map((b) => ETIQUETA_BLOQUE[b].toLowerCase()).join(', ')}. No cuenta para la nota.</p>
      <FlujoRefuerzo nivel={nivel} intentoId={ctx.ultimo.id} reintentoDesde={reintentoDesde} ejercicios={ejercicios} />
    </div>
  );
}
