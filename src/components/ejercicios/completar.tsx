'use client';
import { useState } from 'react';
import type { Ejercicio } from '@/lib/contenido/esquema';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

export function Completar({ ejercicio, onResponder }: { ejercicio: Extract<Ejercicio, { tipo: 'completar' }>; onResponder: (r: RespuestaUsuario | null) => void }) {
  const [antes, ...resto] = ejercicio.texto.split('___');
  const despues = resto.join('___');
  const [valor, setValor] = useState('');
  return (
    <div lang="en" className="flex flex-wrap items-center gap-x-2 gap-y-2 text-lg leading-relaxed">
      <span>{antes}</span>
      <input
        type="text" value={valor} aria-label="Respuesta" autoComplete="off" autoCapitalize="none" spellCheck={false}
        onChange={(ev) => { setValor(ev.target.value); onResponder(ev.target.value.trim() ? { tipo: 'completar', texto: ev.target.value } : null); }}
        className="min-h-11 w-40 max-w-full rounded-md border-2 border-borde bg-fondo px-3 text-texto"
      />
      <span>{despues}</span>
    </div>
  );
}
