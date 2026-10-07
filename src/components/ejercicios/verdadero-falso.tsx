'use client';
import { useId } from 'react';
import type { Ejercicio } from '@/lib/contenido/esquema';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

export function VerdaderoFalso({ ejercicio, onResponder }: { ejercicio: Extract<Ejercicio, { tipo: 'verdadero_falso' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  const nombre = useId();
  return (
    <div className="flex flex-col gap-3">
      <p lang="en" className="text-lg">{ejercicio.afirmacion}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {([['Verdadero', true], ['Falso', false]] as const).map(([etiqueta, valor]) => (
          <label key={etiqueta} className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-borde px-3 py-2 has-[:checked]:border-primario has-[:checked]:bg-superficie">
            <input type="radio" name={nombre} className="size-5 shrink-0 accent-primario" onChange={() => onResponder({ tipo: 'verdadero_falso', valor })} />
            <span>{etiqueta}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
