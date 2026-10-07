'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, Eye, XCircle } from 'lucide-react';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { BarraProgreso } from '@/components/barra-progreso';
import { responderTarjetaAction } from './actions';

export type TarjetaRepaso = {
  termino: string;
  nivel: string;
  caja: number;
  ejemplo: string | null;
  traduccion: string | null;
  definicion: string | null;
};

type Envio = { termino: string; nivel: string; sabia: boolean; cajaEsperada: number };

function Resaltado({ texto, termino }: { texto: string; termino: string }) {
  const i = texto.toLowerCase().indexOf(termino.toLowerCase());
  if (i < 0) return <>{texto}</>;
  const fin = i + termino.length;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded bg-primario/20 px-1 font-semibold text-texto">{texto.slice(i, fin)}</mark>
      {texto.slice(fin)}
    </>
  );
}

export function SesionRepaso({ tarjetas }: { tarjetas: TarjetaRepaso[] }) {
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [sabidas, setSabidas] = useState(0);
  const [aviso, setAviso] = useState(false);
  const resumen = useRef<HTMLHeadingElement>(null);
  const zonaBotones = useRef<HTMLDivElement>(null);
  const cola = useMemo(
    () => crearColaRegistro<Envio>((x) => responderTarjetaAction(x), { onFalloPersistente: () => setAviso(true) }),
    [],
  );

  const terminadaInicial = indice >= tarjetas.length;
  useEffect(() => {
    if (terminadaInicial) { resumen.current?.focus(); return; }
    // Primer botón de la zona: «Mostrar respuesta» o, tras revelar, «La sabía».
    zonaBotones.current?.querySelector('button')?.focus();
  }, [revelada, indice, terminadaInicial]);

  const total = tarjetas.length;
  const terminada = indice >= total;

  function responder(sabia: boolean) {
    const t = tarjetas[indice];
    cola.encolar({ termino: t.termino, nivel: t.nivel, sabia, cajaEsperada: t.caja });
    if (sabia) setSabidas((n) => n + 1);
    setRevelada(false);
    setIndice((i) => i + 1);
  }

  const aviso_ = (
    <div role="status" aria-live="polite">
      {aviso ? (
        <p className="flex items-center gap-2 text-sm text-aviso">
          <CircleAlert aria-hidden className="size-4 shrink-0" />
          <span>No pudimos guardar alguna respuesta. Revisa tu conexión; seguiremos reintentando.</span>
        </p>
      ) : null}
    </div>
  );

  if (terminada) {
    return (
      <Tarjeta className="space-y-3">
        <h2 ref={resumen} tabIndex={-1} className="flex items-center gap-2 text-lg font-semibold text-exito outline-offset-4">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" />
          <span>Sabías {sabidas} de {total}</span>
        </h2>
        <p className="text-texto-suave">Sesión de repaso terminada. Las tarjetas que fallaste volverán mañana.</p>
        {aviso_}
        <Link href="/hoy" className="inline-flex min-h-11 items-center font-semibold text-primario underline">Volver a Hoy</Link>
      </Tarjeta>
    );
  }

  const t = tarjetas[indice];
  return (
    <div className="space-y-4">
      <p className="text-sm text-texto-suave" aria-live="polite">{indice + 1} de {total}</p>
      <BarraProgreso valor={(indice / total) * 100} etiqueta="Progreso del repaso" />
      <Tarjeta className="space-y-4">
        <p lang="en" className="text-2xl font-bold">{t.termino}</p>
        {t.ejemplo ? <p lang="en" className="text-texto-suave"><Resaltado texto={t.ejemplo} termino={t.termino} /></p> : null}
        {revelada ? (
          <div className="space-y-1 border-t border-borde/40 pt-3">
            {t.traduccion ? <p className="font-semibold">{t.traduccion}</p> : <p className="text-texto-suave">Esta palabra ya no está en el glosario actual.</p>}
            {t.definicion ? <p lang="en" className="text-texto-suave">{t.definicion}</p> : null}
          </div>
        ) : null}
      </Tarjeta>
      {revelada ? (
        <div ref={zonaBotones} className="grid gap-3 sm:grid-cols-2">
          <Boton type="button" onClick={() => responder(true)} className="flex items-center justify-center gap-2 py-3">
            <CheckCircle2 aria-hidden className="size-5" /> La sabía
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => responder(false)} className="flex items-center justify-center gap-2 py-3">
            <XCircle aria-hidden className="size-5 text-error" /> No la sabía
          </Boton>
        </div>
      ) : (
        <div ref={zonaBotones}>
          <Boton type="button" onClick={() => setRevelada(true)} className="flex w-full items-center justify-center gap-2 py-3">
            <Eye aria-hidden className="size-5" /> Mostrar respuesta
          </Boton>
        </div>
      )}
      {aviso_}
    </div>
  );
}
