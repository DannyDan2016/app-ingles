import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { estadoNiveles, type EstadoNivel } from '@/lib/progreso/niveles';

const ETIQUETA: Record<EstadoNivel, string> = {
  aprobado: 'Aprobado', en_curso: 'En curso', omitido: 'Omitido', bloqueado: 'Bloqueado',
};

export default async function NivelesPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const niveles = estadoNiveles({ nivelInicial: u.nivelInicial, aprobados: [] });
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Tus niveles</h1>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {niveles.map(({ nivel, estado }) => (
          <li key={nivel} data-estado={estado} className="rounded-lg border border-borde bg-superficie p-4">
            <p className="text-xl font-bold">{nivel}</p>
            <p>{ETIQUETA[estado]}</p>
            {estado === 'en_curso' && <p className="text-sm text-texto-suave">0 % de lecciones completadas</p>}
          </li>
        ))}
      </ol>
    </>
  );
}
