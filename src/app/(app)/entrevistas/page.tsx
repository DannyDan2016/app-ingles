import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { preguntasEntrevista } from '@/lib/contenido/catalogo';
import { NIVELES_ENTREVISTA, ROLES_ENTREVISTA } from '@/lib/contenido/esquema';
import { ROL_ETIQUETA } from '@/lib/entrevistas/etiquetas';
import { filtrarPreguntas, leerFiltro, type FiltroEntrevista } from '@/lib/entrevistas/filtro';
import { Tarjeta } from '@/components/tarjeta';
import { PestanasEntrevistas } from './pestanas';

function enlace(f: FiltroEntrevista) {
  const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
  return q.size ? `/entrevistas?${q}` : '/entrevistas';
}

export default async function EntrevistasPage({ searchParams }: { searchParams: Promise<{ rol?: string | string[]; nivel?: string | string[] }> }) {
  await requireUser();
  const f = leerFiltro(await searchParams);
  const lista = filtrarPreguntas(preguntasEntrevista(), f);
  const chip = (activo: boolean) => `inline-flex min-h-11 items-center rounded-md border border-borde px-3 ${activo ? 'font-semibold underline' : ''}`;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Entrevistas</h1>
      <PestanasEntrevistas activa="preguntas" />
      <p className="text-texto-suave">Preguntas reales de entrevista técnica con una respuesta modelo y estructuras para preparar la tuya.</p>
      <nav aria-label="Filtrar por rol" className="flex flex-wrap gap-2">
        <Link href={enlace({ nivel: f.nivel })} aria-current={!f.rol ? 'true' : undefined} className={chip(!f.rol)}>Todos</Link>
        {ROLES_ENTREVISTA.map((r) => (
          <Link key={r} href={enlace({ ...f, rol: r })} aria-current={f.rol === r ? 'true' : undefined} className={chip(f.rol === r)}>{ROL_ETIQUETA[r]}</Link>
        ))}
      </nav>
      <nav aria-label="Filtrar por nivel" className="flex flex-wrap gap-2">
        <Link href={enlace({ rol: f.rol })} aria-current={!f.nivel ? 'true' : undefined} className={chip(!f.nivel)}>Todos los niveles</Link>
        {NIVELES_ENTREVISTA.map((n) => (
          <Link key={n} href={enlace({ ...f, nivel: n })} aria-current={f.nivel === n ? 'true' : undefined} className={chip(f.nivel === n)}>{n}</Link>
        ))}
      </nav>
      {lista.length === 0 ? <p role="status">Aún no hay preguntas para este filtro</p> : (
        <ul className="flex flex-col gap-3">
          {lista.map((p) => (
            <li key={p.id}>
              <Tarjeta as="div" className="p-0">
                <Link href={`/entrevistas/${p.id}`} className="flex min-h-11 flex-col gap-1 rounded-xl p-4">
                  <span lang="en" className="font-semibold">{p.pregunta}</span>
                  <span className="text-sm text-texto-suave">{ROL_ETIQUETA[p.rol]} · {p.nivel}</span>
                </Link>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
