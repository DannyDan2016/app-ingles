'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Ejercicio } from '@/lib/contenido/esquema';
import { SecuenciaEjercicios } from '@/components/ejercicios/secuencia-ejercicios';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { completarRefuerzoAction } from '../../actions';

export function FlujoRefuerzo({ nivel, intentoId, ejercicios, reintento }: { nivel: string; intentoId: string; ejercicios: Ejercicio[]; reintento: string }) {
  const [fin, setFin] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function completar() {
    setGuardando(true);
    try {
      const r = await completarRefuerzoAction({ intentoId });
      if (r.ok) { setFallo(false); setFin(true); } else setFallo(true);
    } catch {
      setFallo(true);
    } finally {
      setGuardando(false);
    }
  }

  if (fin) {
    return (
      <Tarjeta>
        <h2 className="text-lg font-semibold">Refuerzo completado</h2>
        <p className="mt-1 text-texto-suave">{reintento}</p>
        <Link href={`/camino/${nivel}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al camino</Link>
      </Tarjeta>
    );
  }
  if (fallo) {
    return (
      <Tarjeta>
        <p role="alert" className="text-error">No pudimos registrar el refuerzo. Inténtalo de nuevo.</p>
        <Boton type="button" className="mt-3" disabled={guardando} onClick={completar}>Reintentar</Boton>
      </Tarjeta>
    );
  }
  return <SecuenciaEjercicios ejercicios={ejercicios} onCompletada={completar} />;
}
