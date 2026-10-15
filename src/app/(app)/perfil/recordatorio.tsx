'use client';
import { useState } from 'react';
import { DIAS, type Dia } from '@/lib/recordatorio/parametros';

const NOMBRES: Record<Dia, string> = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
const DURACIONES = [5, 10, 15, 20, 30] as const;

export function Recordatorio({ metaMin }: { metaMin: number }) {
  const [dias, setDias] = useState<Dia[]>(['L', 'M', 'X', 'J', 'V']);
  const [hora, setHora] = useState('19:00');
  const [min, setMin] = useState<number>(DURACIONES.includes(metaMin as never) ? metaMin : 10);
  const alternar = (d: Dia) => setDias((a) => (a.includes(d) ? a.filter((x) => x !== d) : DIAS.filter((x) => x === d || a.includes(x))));
  const href = `/api/recordatorio?${new URLSearchParams({ dias: dias.join(','), hora, min: String(min) })}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-texto-suave">Tu calendario te avisará aunque la app esté cerrada.</p>
      <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
        <legend className="mb-1 text-texto-suave">Días</legend>
        {DIAS.map((d) => (
          <label key={d} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={dias.includes(d)} onChange={() => alternar(d)} className="size-5" />
            {NOMBRES[d]}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="text-texto-suave">Hora</span>
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className="min-h-11 self-start rounded-md border border-borde bg-superficie px-3" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-texto-suave">Duración</span>
        <select value={min} onChange={(e) => setMin(Number(e.target.value))} className="min-h-11 self-start rounded-md border border-borde bg-superficie px-3">
          {DURACIONES.map((m) => <option key={m} value={m}>{m} minutos</option>)}
        </select>
      </label>
      {dias.length === 0 || !hora
        ? <p role="status" className="font-medium">Elige al menos un día</p>
        : (
          <a href={href} download className="inline-flex min-h-11 min-w-11 self-start items-center rounded-md border border-borde bg-superficie px-4 font-semibold text-texto">
            Añadir a mi calendario
          </a>
        )}
    </div>
  );
}
