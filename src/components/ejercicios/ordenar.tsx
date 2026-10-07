'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ejercicio } from '@/lib/contenido/esquema';
import { barajar } from '@/lib/aprendizaje/barajar';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

const BOTON = 'min-h-11 min-w-11 rounded-md border border-borde bg-superficie px-3 text-texto';

export function Ordenar({ ejercicio, onResponder }: { ejercicio: Extract<Ejercicio, { tipo: 'ordenar' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  // Se trabaja con índices de la lista barajada, para soportar piezas repetidas.
  const barajadas = useMemo(() => barajar(ejercicio.piezas, ejercicio.id), [ejercicio]);
  const [elegidas, setElegidas] = useState<number[]>([]);
  const raiz = useRef<HTMLDivElement>(null);
  const foco = useRef<{ idx: number; lista: 'frase' | 'disponibles' } | null>(null);

  // Al mover una pieza el botón pulsado desaparece: el foco pasa a la misma pieza en la otra lista.
  useEffect(() => {
    const f = foco.current;
    if (!f) return;
    foco.current = null;
    raiz.current?.querySelector<HTMLElement>(`[data-lista="${f.lista}"][data-pieza="${f.idx}"]`)?.focus();
  }, [elegidas]);

  function cambiar(next: number[], idx: number, lista: 'frase' | 'disponibles') {
    foco.current = { idx, lista };
    setElegidas(next);
    onResponder(next.length === barajadas.length ? { tipo: 'ordenar', orden: next.map((i) => barajadas[i]) } : null);
  }
  const disponibles = barajadas.map((_, i) => i).filter((i) => !elegidas.includes(i));

  return (
    <div ref={raiz} lang="en" className="flex flex-col gap-4">
      <div>
        <h3 lang="es" className="mb-2 text-sm font-semibold text-texto-suave">Disponibles</h3>
        <ul className="flex min-h-11 flex-wrap gap-2">
          {disponibles.map((i) => (
            <li key={i}><button type="button" className={BOTON} data-lista="disponibles" data-pieza={i} onClick={() => cambiar([...elegidas, i], i, 'frase')}>{barajadas[i]}</button></li>
          ))}
        </ul>
      </div>
      <div>
        <h3 lang="es" className="mb-2 text-sm font-semibold text-texto-suave">Tu frase</h3>
        <ol className="flex min-h-14 flex-wrap gap-2 rounded-lg border-2 border-dashed border-borde p-2">
          {elegidas.map((i) => (
            <li key={i}><button type="button" className={`${BOTON} border-primario`} aria-label={`Quitar «${barajadas[i]}»`} data-lista="frase" data-pieza={i} onClick={() => cambiar(elegidas.filter((x) => x !== i), i, 'disponibles')}>{barajadas[i]}</button></li>
          ))}
        </ol>
      </div>
    </div>
  );
}
