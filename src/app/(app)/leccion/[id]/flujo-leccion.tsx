'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CircleCheck } from 'lucide-react';
import type { EntradaGlosario, Leccion } from '@/lib/contenido/esquema';
import { completarItemAction } from '@/app/(app)/_acciones/actions';
import { Lectura } from '@/components/lectura/lectura';
import { VideoFacade } from '@/components/video-facade';
import { SecuenciaEjercicios } from '@/components/ejercicios/secuencia-ejercicios';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { TuFrase, type PalabraFrase } from './tu-frase';

type Paso = 'lectura' | 'video' | 'ejercicios' | 'frase' | 'resumen';
const TITULOS: Record<Paso, string> = { lectura: 'Lectura', video: 'Video', ejercicios: 'Ejercicios', frase: 'Tu frase', resumen: 'Resumen' };
const ENLACE = 'inline-flex min-h-11 items-center justify-center rounded-md px-4 font-semibold';

export function FlujoLeccion({ leccion, glosario, yaCompletada, palabrasFrase }: { leccion: Leccion; glosario: Record<string, EntradaGlosario>; yaCompletada: boolean; palabrasFrase: PalabraFrase[] }) {
  const hayFrase = palabrasFrase.length > 0;
  const base: Paso[] = leccion.video ? ['lectura', 'video', 'ejercicios'] : ['lectura', 'ejercicios'];
  const pasos: Paso[] = hayFrase ? [...base, 'frase', 'resumen'] : [...base, 'resumen'];
  const [n, setN] = useState(0);
  const [guardado, setGuardado] = useState<'pendiente' | 'ok' | 'error'>('pendiente');
  const [frases, setFrases] = useState(0);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);
  const paso = pasos[n];

  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    encabezado.current?.focus();
  }, [n]);

  async function completar() {
    setGuardado('pendiente');
    try {
      const r = await completarItemAction({ itemId: leccion.id });
      setGuardado(r.ok ? 'ok' : 'error');
    } catch {
      setGuardado('error');
    }
  }
  const avanzar = () => setN((x) => Math.min(x + 1, pasos.length - 1));
  const alTerminarEjercicios = () => { avanzar(); void completar(); };

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 lang="en" className="text-2xl font-bold">{leccion.titulo}</h1>
        <p className="text-lg">{leccion.objetivo}</p>
        <p className="text-sm text-texto-suave">Gramática: <span lang="en">{leccion.gramatica}</span></p>
        {yaCompletada && <p className="text-sm text-texto-suave">Ya completaste esta lección. Puedes repasarla cuando quieras.</p>}
        <p className="text-sm text-texto-suave">Paso {n + 1} de {pasos.length}</p>
      </header>

      <h2 ref={encabezado} tabIndex={-1} className="text-xl font-semibold outline-offset-4">{TITULOS[paso]}</h2>

      {paso === 'lectura' && (
        <>
          <p className="text-sm text-texto-suave">Toca una palabra subrayada para ver su significado y guardarla.</p>
          <Lectura texto={leccion.lectura} glosario={glosario} nivel={leccion.nivel} />
          <Boton type="button" onClick={avanzar} className="self-start">Continuar</Boton>
        </>
      )}

      {paso === 'video' && leccion.video && (
        <>
          <VideoFacade video={leccion.video} />
          <div className="flex flex-wrap gap-3">
            <Boton type="button" onClick={avanzar}>Continuar</Boton>
            <Boton type="button" variante="secundario" onClick={avanzar}>Saltar video</Boton>
          </div>
        </>
      )}

      {paso === 'ejercicios' && <SecuenciaEjercicios ejercicios={leccion.ejercicios} etiqueta="Ejercicio" onCompletada={alTerminarEjercicios} />}

      {paso === 'frase' && <TuFrase palabras={palabrasFrase} onTerminar={(k) => { setFrases(k); avanzar(); }} />}

      {paso === 'resumen' && (
        <Tarjeta className="flex flex-col gap-3">
          {guardado === 'error' ? (
            <div role="alert" className="flex flex-col items-start gap-2 text-error">
              <p className="font-semibold">Terminaste los ejercicios, pero no pudimos guardar tu progreso.</p>
              <p>Revisa tu conexión e inténtalo de nuevo.</p>
              <Boton type="button" variante="secundario" onClick={completar}>Reintentar</Boton>
            </div>
          ) : (
            <>
              <p className="flex items-center gap-2 text-lg font-semibold text-exito">
                <CircleCheck aria-hidden="true" className="size-6" /> Lección completada
              </p>
              <div role="status">
                {guardado === 'pendiente' ? <p className="text-texto-suave">Guardando tu progreso…</p> : <p>Tu progreso está guardado.</p>}
              </div>
              {frases > 0 && <p>Escribiste {frases} {frases === 1 ? 'frase propia' : 'frases propias'}.</p>}
              {guardado === 'ok' && (
                <div>
                  <p className="font-semibold">Palabras añadidas a tu repaso</p>
                  <ul lang="en" className="mt-1 flex flex-wrap gap-2 font-mono">
                    {leccion.terminos.map((t) => <li key={t} className="rounded-md bg-fondo px-2 py-1">{t}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href={`/camino/${leccion.nivel}`} className={`${ENLACE} bg-primario text-sobre-primario`}>Siguiente</Link>
            <Link href="/repaso" className={`${ENLACE} border border-borde bg-superficie text-texto`}>Repasar</Link>
          </div>
        </Tarjeta>
      )}
    </article>
  );
}
