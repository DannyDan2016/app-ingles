'use client';
import { useId, useState } from 'react';
import type { EjercicioVista } from '@/lib/contenido/vista';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

export function Emparejar({ ejercicio, onResponder }: { ejercicio: Extract<EjercicioVista, { tipo: 'emparejar' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  const base = useId();
  const opciones = ejercicio.derecha;
  const [asig, setAsig] = useState<Record<string, string>>({});
  function elegir(a: string, b: string) {
    const next = { ...asig, [a]: b };
    if (!b) delete next[a];
    setAsig(next);
    onResponder(ejercicio.izquierda.every((a) => next[a]) ? { tipo: 'emparejar', asignacion: next } : null);
  }
  return (
    <ul className="flex flex-col gap-3">
      {ejercicio.izquierda.map((a, i) => (
        <li key={a} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor={`${base}-${i}`} lang="en" className="font-semibold sm:w-1/3">{a}</label>
          <select id={`${base}-${i}`} value={asig[a] ?? ''} onChange={(ev) => elegir(a, ev.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-md border-2 border-borde bg-fondo px-2 text-texto">
            <option value="">Elige…</option>
            {opciones.map((o, k) => <option key={k} value={o} lang="en">{o}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
