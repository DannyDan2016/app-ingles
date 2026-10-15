'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Ejercicio } from '@/lib/contenido/esquema';
import { SecuenciaEjercicios } from '@/components/ejercicios/secuencia-ejercicios';
import { Tarjeta } from '@/components/tarjeta';
import { completarRefuerzoAction } from '../../actions';

export function FlujoRefuerzo({ nivel, intentoId, ejercicios }: { nivel: string; intentoId: string; ejercicios: Ejercicio[] }) {
  const [fin, setFin] = useState(false);
  if (fin) {
    return (
      <Tarjeta>
        <h2 className="text-lg font-semibold">Refuerzo completado</h2>
        <p className="mt-1 text-texto-suave">Podrás volver a presentar la evaluación 24 horas después de tu intento.</p>
        <Link href={`/camino/${nivel}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al camino</Link>
      </Tarjeta>
    );
  }
  return <SecuenciaEjercicios ejercicios={ejercicios} onCompletada={async () => { await completarRefuerzoAction({ intentoId }); setFin(true); }} />;
}
