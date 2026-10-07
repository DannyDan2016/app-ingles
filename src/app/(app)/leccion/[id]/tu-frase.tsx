'use client';
import { useId, useRef, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import type { EntradaGlosario } from '@/lib/contenido/esquema';
import { evaluarFrase, formasAceptadas, ejemplosDeFormas } from '@/lib/aprendizaje/frase';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';

export type PalabraFrase = { base: string; visibles: string[]; entrada?: EntradaGlosario };

type Resultado = { tipo: 'sin-palabra' | 'corta' | 'valida'; palabras: number } | null;

function TarjetaFrase({ palabra, hecha, onHecha, onRehacer, campoRef }: {
  palabra: PalabraFrase;
  hecha: boolean;
  onHecha: () => void;
  onRehacer: () => void;
  campoRef: (el: HTMLTextAreaElement | null) => void;
}) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [res, setRes] = useState<Resultado>(null);
  const formas = formasAceptadas(palabra.base, palabra.visibles);
  const ejemplosFormas = ejemplosDeFormas(palabra.base, palabra.visibles).join(', ');

  function comprobar() {
    const r = evaluarFrase(texto, formas);
    setRes({ tipo: !r.usaPalabra ? 'sin-palabra' : !r.valida ? 'corta' : 'valida', palabras: r.palabras });
  }

  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p lang="en" className="font-mono text-lg font-semibold">{palabra.base}</p>
        {palabra.entrada && <p className="text-texto-suave">{palabra.entrada.traduccion_es}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-medium">Tu frase con «<span lang="en">{palabra.base}</span>»</label>
        <textarea
          id={id}
          ref={campoRef}
          lang="en"
          rows={2}
          autoCapitalize="sentences"
          spellCheck
          value={texto}
          readOnly={hecha}
          onChange={(e) => { setTexto(e.target.value); setRes(null); }}
          className="min-h-11 rounded-md border border-borde bg-superficie px-3 py-2 text-texto"
        />
      </div>
      {!hecha && <Boton type="button" onClick={comprobar} className="self-start">Comprobar</Boton>}
      <div role="status">
        {res && (
          <div className={`flex gap-3 rounded-lg border-2 p-3 ${res.tipo === 'valida' ? 'border-exito' : 'border-error'}`}>
            {res.tipo === 'valida'
              ? <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-exito" />
              : <CircleX aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-error" />}
            <div className="min-w-0">
              {res.tipo === 'sin-palabra' && (
                <p className="font-semibold text-error">
                  Tu frase no usa «<span lang="en">{palabra.base}</span>». Inclúyela (también vale una forma como <span lang="en">{ejemplosFormas}</span>).
                </p>
              )}
              {res.tipo === 'corta' && <p className="font-semibold text-error">Escribe una frase un poco más larga (al menos 4 palabras).</p>}
              {res.tipo === 'valida' && (
                <>
                  <p className="font-semibold text-exito">Usas «<span lang="en">{palabra.base}</span>» · {res.palabras} palabras</p>
                  {palabra.entrada && <p className="mt-1">Frase modelo: <span lang="en">{palabra.entrada.ejemplo_en}</span></p>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {res?.tipo === 'valida' && !hecha && (
        <div className="flex flex-wrap gap-3">
          <Boton type="button" onClick={onHecha}>Mi frase está bien</Boton>
          <Boton type="button" variante="secundario" onClick={() => { setRes(null); onRehacer(); }}>La mejoro</Boton>
        </div>
      )}
      {hecha && (
        <p className="flex items-center gap-2 font-semibold text-exito">
          <CircleCheck aria-hidden="true" className="size-5" /> Frase lista
        </p>
      )}
    </Tarjeta>
  );
}

export function TuFrase({ palabras, onTerminar }: { palabras: PalabraFrase[]; onTerminar: (frases: number) => void }) {
  const [hechas, setHechas] = useState<boolean[]>(() => palabras.map(() => false));
  const campos = useRef<(HTMLTextAreaElement | null)[]>([]);
  const continuar = useRef<HTMLButtonElement>(null);
  const total = hechas.filter(Boolean).length;
  const todas = total === palabras.length;

  function marcar(i: number) {
    setHechas((h) => h.map((x, j) => (j === i ? true : x)));
    const siguiente = hechas.findIndex((x, j) => j !== i && !x);
    // Tras el render el botón Continuar ya está habilitado; el campo siguiente existe siempre.
    requestAnimationFrame(() => (siguiente >= 0 ? campos.current[siguiente]?.focus() : continuar.current?.focus()));
  }

  return (
    <div className="flex flex-col gap-4">
      <p>Escribe una frase en inglés con cada palabra. Usarla en tu propia frase ayuda a recordarla.</p>
      {palabras.map((p, i) => (
        <TarjetaFrase
          key={p.base}
          palabra={p}
          hecha={hechas[i]}
          onHecha={() => marcar(i)}
          onRehacer={() => campos.current[i]?.focus()}
          campoRef={(el) => { campos.current[i] = el; }}
        />
      ))}
      <div className="flex flex-wrap gap-3">
        <Boton type="button" ref={continuar} disabled={!todas} onClick={() => onTerminar(total)}>Continuar</Boton>
        <Boton type="button" variante="secundario" onClick={() => onTerminar(total)}>Omitir este paso</Boton>
      </div>
    </div>
  );
}
