import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleCheck, CircleDot, Lock, SkipForward } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { estadoNiveles, type EstadoNivel } from '@/lib/progreso/niveles';
import { caminoDeNivel } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { BarraProgreso } from '@/components/barra-progreso';
import { Tarjeta } from '@/components/tarjeta';

const ETIQUETA: Record<EstadoNivel, string> = { aprobado: 'Aprobado', en_curso: 'En curso', omitido: 'Omitido', bloqueado: 'Bloqueado' };
const ICONO = { aprobado: CircleCheck, en_curso: CircleDot, omitido: SkipForward, bloqueado: Lock } as const;

export default async function CaminoPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const niveles = estadoNiveles({ nivelInicial: u.nivelInicial, aprobados: [] });
  const actual = niveles.find((n) => n.estado === 'en_curso')?.nivel;
  const porcentaje = actual ? estadoCamino(caminoDeNivel(actual), await itemsCompletados(getDb(), u.userId, actual)).porcentaje : 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Camino</h1>
      <p className="text-texto-suave">Tu ruta de A1 a C2. Cada nivel se desbloquea al aprobar el anterior.</p>
      <ol className="flex flex-col gap-3">
        {niveles.map(({ nivel, estado }) => {
          const Icono = ICONO[estado];
          const enCurso = nivel === actual;
          return (
            <li key={nivel}>
              <Tarjeta as="div" className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Nivel {nivel}</h2>
                  <span className="flex items-center gap-1 text-sm"><Icono aria-hidden="true" className="size-4" /> {ETIQUETA[estado]}</span>
                </div>
                {enCurso && (
                  <>
                    <BarraProgreso valor={porcentaje} etiqueta={`Progreso de ${nivel}`} />
                    <p className="text-sm text-texto-suave">{porcentaje} % del nivel</p>
                  </>
                )}
                {estado === 'bloqueado'
                  ? <p className="text-sm text-texto-suave">Aprueba el nivel anterior para desbloquearlo.</p>
                  : <Link href={`/camino/${nivel}`} className="inline-flex min-h-11 items-center font-semibold text-primario underline">{enCurso ? `Continuar en ${nivel}` : `Ver ${nivel}`}</Link>}
              </Tarjeta>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
