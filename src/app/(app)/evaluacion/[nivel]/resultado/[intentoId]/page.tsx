import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { CircleCheck, CircleX } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel, NIVELES } from '@/lib/progreso/niveles';
import { BLOQUES } from '@/lib/contenido/esquema';
import { getEvaluacion } from '@/lib/contenido/catalogo';
import { corregir } from '@/lib/aprendizaje/corregir';
import { getIntento, notasBloques, respuestasDe } from '@/lib/evaluacion/evaluacion.repo';
import { parsearRespuesta } from '@/lib/evaluacion/respuesta';
import { textoCorrecta, textoRespuesta } from '@/lib/evaluacion/detalle';
import { UMBRAL } from '@/lib/evaluacion/nota';
import { ETIQUETA_BLOQUE } from '@/lib/evaluacion/tipos';
import { Tarjeta } from '@/components/tarjeta';

const ENLACE = 'inline-flex min-h-11 items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario';

export default async function ResultadoPage({ params }: PageProps<'/evaluacion/[nivel]/resultado/[intentoId]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel, intentoId } = await params;
  if (!isNivel(nivel) || !z.uuid().safeParse(intentoId).success) notFound();
  const db = getDb();
  const i = await getIntento(db, u.userId, intentoId);
  if (!i || i.nivel !== nivel || (i.estado !== 'aprobado' && i.estado !== 'suspendido')) notFound();
  const banco = getEvaluacion(nivel);
  const resp = await respuestasDe(db, i.id);
  const porId = new Map(banco?.preguntas.map((p) => [p.id, p]) ?? []);
  const falladas = i.preguntas.flatMap((id) => {
    const p = porId.get(id);
    if (!p) return [];
    const r = parsearRespuesta(resp.get(id) ?? '');
    return r && corregir(p, r) ? [] : [{ p, r }];
  });
  const notas = notasBloques(i);
  const aprobado = i.estado === 'aprobado';
  const siguiente = NIVELES[NIVELES.indexOf(nivel) + 1];
  const Icono = aprobado ? CircleCheck : CircleX;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Resultado de {nivel}</h1>
      <Tarjeta>
        <p className={`flex items-center gap-2 text-xl font-semibold ${aprobado ? 'text-exito' : 'text-error'}`}>
          <Icono aria-hidden="true" className="size-6" /> {aprobado ? 'Aprobado' : 'No aprobado'} · {i.nota} %
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {BLOQUES.map((b) => {
            const ok = notas[b] >= UMBRAL;
            const IconoB = ok ? CircleCheck : CircleX;
            return <li key={b} className={`flex items-center gap-2 ${ok ? 'text-exito' : 'text-error'}`}><IconoB aria-hidden="true" className="size-4 shrink-0" /> {ETIQUETA_BLOQUE[b]}: {notas[b]} % {ok ? '· superado' : '· a reforzar'}</li>;
          })}
        </ul>
        <div className="mt-4">
          {aprobado
            ? (siguiente ? <Link href={`/camino/${siguiente}`} className={ENLACE}>{siguiente} desbloqueado: ir al camino</Link> : <Link href="/camino" className={ENLACE}>Ir al camino</Link>)
            : <Link href={`/evaluacion/${nivel}/refuerzo`} className={ENLACE}>Hacer el refuerzo</Link>}
        </div>
      </Tarjeta>
      {falladas.length > 0 && (
        <section aria-labelledby="h-fallos" className="flex flex-col gap-3">
          <h2 id="h-fallos" className="text-lg font-semibold">Preguntas falladas</h2>
          {falladas.map(({ p, r }) => (
            <Tarjeta key={p.id} as="article">
              <p className="font-semibold">{p.enunciado}</p>
              {p.tipo === 'verdadero_falso' && <p lang="en">{p.afirmacion}</p>}
              <p className="mt-2 flex items-start gap-2 text-error"><CircleX aria-hidden="true" className="mt-1 size-4 shrink-0" /><span>Tu respuesta: <span lang="en">{textoRespuesta(p, r)}</span></span></p>
              <p className="flex items-start gap-2 text-exito"><CircleCheck aria-hidden="true" className="mt-1 size-4 shrink-0" /><span>Correcta: <span lang="en">{textoCorrecta(p)}</span></span></p>
              <p className="mt-1 text-texto-suave">{p.explicacion}</p>
            </Tarjeta>
          ))}
        </section>
      )}
    </div>
  );
}
