'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { YTPlayer } from '@/lib/youtube';
import { CircleCheck } from 'lucide-react';
import type { EntradaGlosario, Tramo } from '@/lib/contenido/esquema';
import { completarItemAction } from '@/app/(app)/_acciones/actions';
import { PASADAS, siguientePaso, type Paso } from '@/lib/aprendizaje/pasadas';
import { VideoFacade } from '@/components/video-facade';
import { SecuenciaEjercicios } from '@/components/ejercicios/secuencia-ejercicios';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';

const ENLACE = 'inline-flex min-h-11 items-center justify-center rounded-md px-4 font-semibold';

export function FlujoTramo({ tramo, glosario, yaCompletado }: { tramo: Tramo; glosario: Record<string, EntradaGlosario>; yaCompletado: boolean }) {
  const [paso, setPaso] = useState<Paso>('pasada-1');
  const [videoCaido, setVideoCaido] = useState(false);
  const [velocidad, setVelocidad] = useState<'esperando' | 'ok' | 'fallo'>('esperando');
  const [clavesVistas, setClavesVistas] = useState(false);
  const [guardado, setGuardado] = useState<'pendiente' | 'ok' | 'error'>('pendiente');
  const guardando = useRef(false);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);
  const pasada = PASADAS.find((p) => `pasada-${p.n}` === paso);

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    encabezado.current?.focus();
  }, [paso]);

  async function completar() {
    if (guardando.current) return;
    guardando.current = true;
    setGuardado('pendiente');
    try {
      const r = await completarItemAction({ itemId: tramo.id });
      setGuardado(r.ok ? 'ok' : 'error');
    } catch {
      setGuardado('error');
    } finally {
      guardando.current = false;
    }
  }
  const avanzar = () => { if (paso === 'pasada-2' && !videoCaido) setClavesVistas(true); setVelocidad('esperando'); setVideoCaido(false); setPaso((p) => siguientePaso(p)); };
  const alReproductor = (p: YTPlayer, v: number) => {
    try { p.setPlaybackRate(v); setVelocidad('ok'); } catch { setVelocidad('fallo'); }
  };
  const mostrarClaves = !clavesVistas && paso === 'preguntas';
  const listaClaves = (
    <div>
      <h3 className="font-semibold">Palabras clave</h3>
      <dl className="mt-1 grid gap-2">
        {tramo.palabrasClave.map((k) => (
          <div key={k} className="rounded-md bg-superficie p-2">
            <dt lang="en" className="font-mono font-semibold">{k}</dt>
            <dd className="text-texto-suave">{glosario[k]?.traduccion_es ?? 'Sin traducción disponible'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
  const estado = paso === 'hecho'
    ? (guardado === 'pendiente' ? 'Guardando tu progreso…' : guardado === 'ok' ? 'Tu progreso está guardado.' : '')
    : videoCaido ? 'El video no está disponible ahora mismo. Puedes pasar directamente a las preguntas.'
    : pasada?.ayuda ? (velocidad === 'ok' ? 'Velocidad ajustada a 0,75x.' : 'Si puedes, baja la velocidad a 0,75 en el reproductor (⚙).')
    : '';
  const alTerminarPreguntas = () => { setPaso('hecho'); void completar(); };
  const titulo = pasada ? `Pasada ${pasada.n} de 3: ${pasada.nombre}` : paso === 'preguntas' ? 'Preguntas de comprensión' : 'Resumen';

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 lang="en" className="text-2xl font-bold">{tramo.fuente.titulo}</h1>
        <p className="text-sm text-texto-suave"><span lang="en">{tramo.fuente.canal}</span> · {tramo.fuente.end - tramo.fuente.start} s</p>
        <Tarjeta className="flex flex-col gap-1">
          <p className="text-sm font-semibold">Pregunta guía</p>
          <p lang="en" className="text-lg">{tramo.preguntaGuia}</p>
        </Tarjeta>
        {yaCompletado && <p className="text-sm text-texto-suave">Ya completaste este tramo. Puedes repasarlo cuando quieras.</p>}
      </header>

      <h2 ref={encabezado} tabIndex={-1} className="text-xl font-semibold outline-offset-4">{titulo}</h2>

      <p role="status" className="text-sm text-texto-suave empty:hidden">{estado}</p>

      {pasada && (
        <>
          {videoCaido ? (
            <div className="flex flex-col items-start gap-3">
              <Boton type="button" onClick={() => { setVideoCaido(false); setPaso('preguntas'); }}>Ir a las preguntas</Boton>
            </div>
          ) : (
            <>
              <VideoFacade
                key={paso}
                api
                video={tramo.fuente}
                onError={() => setVideoCaido(true)}
                onPlayer={(p) => alReproductor(p, pasada.velocidad)}
              />
              {pasada.n === 1 && <p className="text-sm text-texto-suave">Escucha sin pausar: busca la idea general y responde la pregunta guía.</p>}
              {pasada.ayuda && listaClaves}
              {pasada.n === 3 && <p className="text-sm text-texto-suave">Última vez, sin ayuda: comprueba si ya puedes responder la pregunta guía.</p>}
              <div className="flex flex-wrap gap-3">
                <Boton type="button" onClick={avanzar}>{pasada.n === 3 ? 'Ir a las preguntas' : 'Siguiente pasada'}</Boton>
              </div>
            </>
          )}
        </>
      )}

      {mostrarClaves && listaClaves}

      {paso === 'preguntas' && <SecuenciaEjercicios ejercicios={tramo.preguntas} etiqueta="Pregunta" onCompletada={alTerminarPreguntas} />}

      {paso === 'hecho' && (
        <Tarjeta className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-lg font-semibold text-exito">
            <CircleCheck aria-hidden="true" className="size-6" /> Tramo completado
          </p>
          {guardado === 'error' && (
            <div className="flex flex-col items-start gap-2 text-error">
              <p role="alert">No pudimos guardar tu progreso. Revisa tu conexión e inténtalo de nuevo.</p>
              <Boton type="button" variante="secundario" onClick={completar}>Reintentar</Boton>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href="/escuchar" className={`${ENLACE} bg-primario text-sobre-primario`}>Más tramos</Link>
            <Link href={`/camino/${tramo.nivel}`} className={`${ENLACE} border border-borde bg-superficie text-texto`}>Volver al camino</Link>
          </div>
        </Tarjeta>
      )}
    </article>
  );
}
