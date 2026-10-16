import Link from 'next/link';
import type { Elegibilidad } from '@/lib/evaluacion/elegibilidad';
import { caducaEn, MENSAJE_CADUCIDAD } from '@/lib/evaluacion/elegibilidad';
import { formatoFechaHora } from '@/lib/tiempo/bogota';
import { Tarjeta } from '@/components/tarjeta';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';

const ENLACE = 'mt-3 inline-flex min-h-11 items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario';

export function TarjetaEvaluacion({ nivel, e, iniciadoAt, respondidas, totalLecciones, notaAprobada, motivoCaducidad }: { nivel: string; e: Elegibilidad; iniciadoAt?: Date; respondidas?: number; totalLecciones?: number; notaAprobada?: number | null; motivoCaducidad?: 'tiempo' | 'banco' | null }) {
  if (e.tipo === 'bloqueado_nivel' || e.tipo === 'sin_banco') return null;
  return (
    <Tarjeta aria-labelledby="h-evaluacion">
      <h2 id="h-evaluacion" className="text-lg font-semibold">Evaluación de {nivel}</h2>
      {motivoCaducidad && <p role="status" className="mt-1 text-aviso">{MENSAJE_CADUCIDAD[motivoCaducidad]}</p>}
      {e.tipo === 'faltan_lecciones' && (<>
        <p className="mt-1 text-texto-suave">Te {e.faltan === 1 ? 'falta 1 lección' : `faltan ${e.faltan} lecciones`} para presentarla.</p>
        {totalLecciones ? (
          <div className="mt-3">
            <BarraProgreso valor={((totalLecciones - e.faltan) / totalLecciones) * 100} etiqueta={`${totalLecciones - e.faltan} de ${totalLecciones} lecciones hechas`} />
          </div>
        ) : null}
        <Boton type="button" disabled className="mt-3">Empezar</Boton>
      </>)}
      {e.tipo === 'puede' && (<>
        <p className="mt-1 text-texto-suave">20 preguntas · 4 bloques · sin límite de tiempo · apruebas con el 80 %.</p>
        <Link href={`/evaluacion/${nivel}`} className={ENLACE}>Empezar</Link>
      </>)}
      {e.tipo === 'reanudar' && (<>
        <p className="mt-1 text-texto-suave">Llevas {respondidas ?? 0} de 20.{iniciadoAt ? ` Caduca el ${formatoFechaHora(caducaEn(iniciadoAt))}.` : ''}</p>
        <Link href={`/evaluacion/${nivel}`} className={ENLACE}>Continuar</Link>
      </>)}
      {e.tipo === 'falta_refuerzo' && (<>
        <p className="mt-1 text-texto-suave">Haz el refuerzo de los bloques flojos para poder reintentarla.</p>
        <Link href={`/evaluacion/${nivel}/refuerzo`} className={ENLACE}>Hacer el refuerzo</Link>
      </>)}
      {e.tipo === 'espera' && <p className="mt-1 text-texto-suave">Podrás reintentarla desde el {formatoFechaHora(e.hasta)}.</p>}
      {e.tipo === 'aprobado' && <Link href={`/evaluacion/${nivel}/resultado/${e.intentoId}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">{notaAprobada != null ? `Aprobada con ${notaAprobada} % · ver resultado` : 'Aprobada · ver resultado'}</Link>}
    </Tarjeta>
  );
}
