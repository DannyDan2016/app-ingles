import { Check, Minus, Clock } from 'lucide-react';
import type { ResumenSemana } from '@/lib/avance/semana';

const DIA_FMT = new Intl.DateTimeFormat('es', { weekday: 'long', timeZone: 'UTC' });
const nombreDia = (fecha: string) => DIA_FMT.format(new Date(`${fecha}T12:00:00Z`));

export function SemanaActiva({ r }: { r: ResumenSemana }) {
  return (
    <>
      <ol aria-label="Días activos de esta semana" className="flex justify-between gap-1">
        {r.dias.map((d) => {
          const nombre = nombreDia(d.fecha);
          const estado = d.futuro ? 'pendiente' : d.activo ? 'activo' : 'sin actividad';
          return (
            <li key={d.fecha} className="flex flex-col items-center gap-1 text-xs text-texto-suave">
              <span
                className={`flex size-9 items-center sm:size-11 justify-center rounded-full border ${d.activo ? 'border-acierto bg-acierto text-fondo' : 'border-borde bg-fondo text-texto-suave'}`}
              >
                {d.activo ? <Check aria-hidden="true" className="size-5" /> : d.futuro ? <Clock aria-hidden="true" className="size-4" /> : <Minus aria-hidden="true" className="size-4" />}
              </span>
              <span aria-hidden="true" className="uppercase">{nombre.charAt(0)}</span>
              <span className="sr-only">{nombre}: {estado}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 font-medium">{r.diasActivos}/7 días · meta {r.metaDias}</p>
      <p className="text-sm text-texto-suave">Un día cuenta con al menos 1 minuto de práctica. Puedes saltarte {r.diasGracia} días por semana sin perder la meta.</p>
    </>
  );
}

export function MetricasSemana({ r }: { r: ResumenSemana }) {
  return (
    <dl className="grid gap-3">
      <div>
        <dt className="text-sm text-texto-suave">Aciertos en repasos maduros</dt>
        <dd className="text-xl font-semibold">{r.aciertosMadurosPct === null ? '—' : `${r.aciertosMadurosPct} %`}</dd>
        {r.aciertosMadurosPct === null && <dd className="text-sm text-texto-suave">Aparecerá cuando repases palabras que ya llevas varios días practicando.</dd>}
      </div>
      <div>
        <dt className="text-sm text-texto-suave">Palabras consolidadas</dt>
        <dd className="text-xl font-semibold">{r.consolidadasTotal} <span className="text-base font-normal text-texto-suave">(+{r.consolidadasNuevas} esta semana)</span></dd>
      </div>
      <div>
        <dt className="text-sm text-texto-suave">Minutos esta semana</dt>
        <dd className="text-xl font-semibold">{r.minutosSemana} min</dd>
      </div>
    </dl>
  );
}
