'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ejercicio as TEjercicio } from '@/lib/contenido/esquema';
import { registrarRespuestaAction } from '@/app/(app)/_acciones/actions';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { BarraProgreso } from '@/components/barra-progreso';
import { Ejercicio } from './ejercicio';

export function SecuenciaEjercicios({ ejercicios, etiqueta = 'Ejercicio', onCompletada }: { ejercicios: TEjercicio[]; etiqueta?: string; onCompletada: () => void }) {
  const [i, setI] = useState(0);
  const [fin, setFin] = useState(false);
  const [aviso, setAviso] = useState(false);
  const cola = useMemo(() => crearColaRegistro(registrarRespuestaAction, { onFalloPersistente: () => setAviso(true) }), []);
  const terminada = useRef(false);
  const posicion = useRef<HTMLParagraphElement>(null);
  const primera = useRef(true);
  const e = ejercicios[i];
  const texto = `${etiqueta} ${i + 1} de ${ejercicios.length}`;

  // Al cambiar de ejercicio el formulario se remonta: el foco pasa al texto de posición.
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    posicion.current?.focus();
  }, [i]);

  function continuar() {
    if (i + 1 < ejercicios.length) { setI(i + 1); return; }
    if (terminada.current) return;
    terminada.current = true;
    setFin(true);
    onCompletada();
  }

  return (
    <div className="flex flex-col gap-4">
      <BarraProgreso valor={((i + (fin ? 1 : 0)) / ejercicios.length) * 100} etiqueta={texto} />
      <p ref={posicion} tabIndex={-1} className="text-sm text-texto-suave outline-offset-4">{texto}</p>
      <Ejercicio key={e.id} ejercicio={e}
        onComprobado={(correcta) => cola.encolar({ ejercicioId: e.id, correcta })}
        onContinuar={continuar} />
      <p role="status" className="min-h-5 text-sm text-aviso">{aviso ? 'No pudimos guardar alguna respuesta. Tu avance en pantalla sigue.' : ''}</p>
    </div>
  );
}
