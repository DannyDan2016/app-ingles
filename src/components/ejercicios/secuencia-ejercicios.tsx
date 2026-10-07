'use client';
import { useMemo, useState } from 'react';
import type { Ejercicio as TEjercicio } from '@/lib/contenido/esquema';
import { registrarRespuestaAction } from '@/app/(app)/_acciones/actions';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { BarraProgreso } from '@/components/barra-progreso';
import { Ejercicio } from './ejercicio';

export function SecuenciaEjercicios({ ejercicios, etiqueta = 'Ejercicio', onCompletada }: { ejercicios: TEjercicio[]; etiqueta?: string; onCompletada: () => void }) {
  const [i, setI] = useState(0);
  const [aviso, setAviso] = useState(false);
  const cola = useMemo(() => crearColaRegistro(registrarRespuestaAction, { onFalloPersistente: () => setAviso(true) }), []);
  const e = ejercicios[i];
  const texto = `${etiqueta} ${i + 1} de ${ejercicios.length}`;
  return (
    <div className="flex flex-col gap-4">
      <BarraProgreso valor={(i / ejercicios.length) * 100} etiqueta={texto} />
      <p className="text-sm text-texto-suave">{texto}</p>
      <Ejercicio key={e.id} ejercicio={e}
        onComprobado={(correcta) => cola.encolar({ ejercicioId: e.id, correcta })}
        onContinuar={() => (i + 1 < ejercicios.length ? setI(i + 1) : onCompletada())} />
      {aviso && <p role="status" className="text-sm text-aviso">No pudimos guardar alguna respuesta. Tu avance en pantalla sigue; lo intentaremos de nuevo.</p>}
    </div>
  );
}
