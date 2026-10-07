'use client';
import { useId } from 'react';
import type { Ejercicio } from '@/lib/contenido/esquema';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

export function OpcionMultiple({ ejercicio, onResponder }: { ejercicio: Extract<Ejercicio, { tipo: 'opcion_multiple' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  const nombre = useId();
  return (
    <div className="flex flex-col gap-2">
      {ejercicio.opciones.map((o, i) => (
        <label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-borde px-3 py-2 has-[:checked]:border-primario has-[:checked]:bg-superficie">
          <input type="radio" name={nombre} value={i} className="size-5 shrink-0 accent-primario" onChange={() => onResponder({ tipo: 'opcion_multiple', indice: i })} />
          <span lang="en" className="min-w-0">{o}</span>
        </label>
      ))}
    </div>
  );
}
