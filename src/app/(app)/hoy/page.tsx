import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { datosSemana } from '@/lib/avance/avance.repo';
import { resumenSemana } from '@/lib/avance/semana';
import { contarPendientes } from '@/lib/aprendizaje/tarjetas.repo';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { caminoDeNivel, getLeccion } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { Tarjeta } from '@/components/tarjeta';
import { BarraProgreso } from '@/components/barra-progreso';
import { EstadoVacioNivel } from '@/components/estado-vacio-nivel';
import { MetricasSemana, SemanaActiva } from '@/components/metricas-semana';

const ENLACE = 'mt-3 inline-flex min-h-11 items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario';

export default async function HoyPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const nivel = u.nivelInicial;
  const db = getDb();
  const ahora = new Date();
  const [datos, pendientes, completados] = await Promise.all([
    datosSemana(db, u.userId, ahora),
    contarPendientes(db, u.userId, ahora),
    itemsCompletados(db, u.userId, nivel),
  ]);
  const r = resumenSemana(datos);
  const camino = caminoDeNivel(nivel);
  const estado = estadoCamino(camino, completados);
  const siguiente = estado.siguiente;
  const leccion = siguiente ? getLeccion(siguiente.id) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Hoy</h1>

      <Tarjeta aria-labelledby="h-meta">
        <h2 id="h-meta" className="text-lg font-semibold">Meta de hoy</h2>
        <div className="mt-3">
          <BarraProgreso valor={r.metaHoyPct} etiqueta="Progreso de la meta de hoy" />
        </div>
        <p className="mt-2">{r.minutosHoy} de {datos.metaDiariaMin} min</p>
      </Tarjeta>

      <Tarjeta aria-labelledby="h-semana">
        <h2 id="h-semana" className="mb-3 text-lg font-semibold">Tu semana</h2>
        <SemanaActiva r={r} />
      </Tarjeta>

      <Tarjeta aria-labelledby="h-metricas">
        <h2 id="h-metricas" className="mb-3 text-lg font-semibold">Métricas</h2>
        <MetricasSemana r={r} />
      </Tarjeta>

      <Tarjeta aria-labelledby="h-repaso">
        <h2 id="h-repaso" className="text-lg font-semibold">Repaso</h2>
        {pendientes > 0 ? (
          <>
            <p className="mt-1">Tienes {pendientes} {pendientes === 1 ? 'palabra' : 'palabras'} para repasar.</p>
            <Link href="/repaso" className={ENLACE}>Repasar ahora</Link>
          </>
        ) : (
          <p className="mt-1 text-texto-suave">Sin repasos pendientes.</p>
        )}
      </Tarjeta>

      {camino.length === 0 ? (
        <EstadoVacioNivel nivel={nivel} />
      ) : siguiente ? (
        <Tarjeta aria-labelledby="h-siguiente">
          <h2 id="h-siguiente" className="text-lg font-semibold">Siguiente lección</h2>
          <p className="mt-1 font-medium">{siguiente.titulo}</p>
          {leccion && <p className="text-texto-suave">{leccion.objetivo}</p>}
          <Link href={`/leccion/${siguiente.id}`} className={ENLACE}>Empezar</Link>
        </Tarjeta>
      ) : (
        <Tarjeta aria-labelledby="h-siguiente">
          <h2 id="h-siguiente" className="text-lg font-semibold">¡Completaste {nivel}!</h2>
          <p className="mt-1 text-texto-suave">Has terminado todas las lecciones disponibles de este nivel.</p>
        </Tarjeta>
      )}
    </div>
  );
}
