'use client';
import { useId, useMemo, useState } from 'react';
import type { Ejercicio } from '@/lib/contenido/esquema';
import { barajar } from '@/lib/aprendizaje/barajar';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

export function Emparejar({ ejercicio, onResponder }: { ejercicio: Extract<Ejercicio, { tipo: 'emparejar' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  const base = useId();
  const opciones = useMemo(() => barajar(ejercicio.pares.map((p) => p.b), ejercicio.id), [ejercicio]);
  const [asig, setAsig] = useState<Record<string, string>>({});
  function elegir(a: string, b: string) {
    const next = { ...asig, [a]: b };
    if (!b) delete next[a];
    setAsig(next);
    onResponder(ejercicio.pares.every((p) => next[p.a]) ? { tipo: 'emparejar', asignacion: next } : null);
  }
  return (
    <ul className="flex flex-col gap-3">
      {ejercicio.pares.map((p, i) => (
        <li key={p.a} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor={`${base}-${i}`} lang="en" className="font-semibold sm:w-1/3">{p.a}</label>
          <select id={`${base}-${i}`} value={asig[p.a] ?? ''} onChange={(ev) => elegir(p.a, ev.target.value)}
            className="min-h-11 min-w-0 flex-1 rounded-md border-2 border-borde bg-fondo px-2 text-texto">
            <option value="">Elige…</option>
            {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
