import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { aVista } from '@/lib/contenido/vista';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { respuestasDe } from '@/lib/evaluacion/evaluacion.repo';
import type { PreguntaExamen } from '@/lib/evaluacion/tipos';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { iniciarEvaluacionAction } from '../actions';
import { FlujoEvaluacion } from './flujo-evaluacion';

export default async function EvaluacionPage({ params }: PageProps<'/evaluacion/[nivel]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel } = await params;
  if (!isNivel(nivel)) notFound();
  const db = getDb();
  const ctx = await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  const e = ctx.elegibilidad;
  if (e.tipo === 'aprobado') redirect(`/evaluacion/${nivel}/resultado/${e.intentoId}`);
  if (e.tipo === 'reanudar' && ctx.abierto && ctx.banco) {
    const porId = new Map(ctx.banco.preguntas.map((p) => [p.id, p]));
    const recursos = new Map(ctx.banco.recursos.map((r) => [r.id, r]));
    // Solo la vista (sin soluciones) y el recurso de cada pregunta llegan al navegador.
    const preguntas: PreguntaExamen[] = ctx.abierto.preguntas.map((id) => {
      const p = porId.get(id)!;
      return { bloque: p.bloque, vista: aVista(p, `${crypto.randomUUID()}:${p.id}`), recurso: p.recurso ? recursos.get(p.recurso) : undefined };
    });
    const respondidas = [...(await respuestasDe(db, ctx.abierto.id)).keys()];
    return <FlujoEvaluacion nivel={nivel} intentoId={ctx.abierto.id} preguntas={preguntas} respondidas={respondidas} />;
  }
  if (e.tipo !== 'puede') redirect(`/camino/${nivel}`);
  return (
    <div className="flex flex-col gap-4">
      <p><Link href={`/camino/${nivel}`} className="inline-flex min-h-11 items-center text-primario underline">Volver al camino</Link></p>
      <h1 className="text-2xl font-bold">Evaluación de {nivel}</h1>
      {ctx.caducadoAhora && <p role="status" className="text-aviso">Tu intento anterior caducó. Puedes empezar otro.</p>}
      <Tarjeta>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>20 preguntas en 4 bloques: lectura, listening, vocabulario y gramática.</li>
          <li>Sin límite de tiempo. Si sales, retomas donde ibas (durante 48 h).</li>
          <li>No verás si aciertas hasta el final.</li>
          <li>Apruebas con el 80 % y se desbloquea el siguiente nivel.</li>
        </ul>
        <form action={iniciarEvaluacionAction} className="mt-4">
          <input type="hidden" name="nivel" value={nivel} />
          <Boton type="submit">Empezar</Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
