import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CircleCheck, Headphones, Lock } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { caminoDeNivel, getLeccion } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { BarraProgreso } from '@/components/barra-progreso';
import { EstadoVacioNivel } from '@/components/estado-vacio-nivel';
import { Tarjeta } from '@/components/tarjeta';

export default async function CaminoNivelPage({ params }: PageProps<'/camino/[nivel]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel } = await params;
  if (!isNivel(nivel)) notFound();
  const items = caminoDeNivel(nivel);
  const camino = estadoCamino(items, await itemsCompletados(getDb(), u.userId, nivel));
  const actual = camino.siguiente && getLeccion(camino.siguiente.id);

  return (
    <div className="flex flex-col gap-4">
      <p><Link href="/camino" className="inline-flex min-h-11 items-center text-primario underline">Volver al camino</Link></p>
      <h1 className="text-2xl font-bold">Nivel {nivel}</h1>
      {camino.items.length === 0 ? <EstadoVacioNivel nivel={nivel} /> : (
        <>
          <div className="flex flex-col gap-1">
            <BarraProgreso valor={camino.porcentaje} etiqueta={`Progreso de ${nivel}`} />
            <p className="text-sm text-texto-suave">{camino.porcentaje} % del nivel</p>
          </div>
          {actual && <p className="text-lg">Siguiente objetivo: {actual.objetivo}</p>}
          <ol className="flex flex-col gap-3">
            {camino.items.map((it) => {
              const bloqueado = it.estado === 'bloqueado';
              const actualItem = it.estado === 'actual';
              const href = it.tipo === 'leccion' ? `/leccion/${it.id}` : `/escuchar/${it.id}`;
              const accion = it.estado === 'hecho' ? 'Hecho' : bloqueado ? 'Bloqueado' : it.tipo === 'tramo' ? 'Escuchar' : 'Empezar';
              const Icono = it.estado === 'hecho' ? CircleCheck : bloqueado ? Lock : it.tipo === 'tramo' ? Headphones : null;
              const contenido = (
                <>
                  <span lang="en" className="min-w-0 font-semibold">{it.titulo}</span>
                  <span className="flex shrink-0 items-center gap-1 text-sm">
                    {Icono && <Icono aria-hidden="true" className="size-4" />} {accion}
                  </span>
                </>
              );
              return (
                <li key={it.id}>
                  <Tarjeta as="div" className={`p-0 ${actualItem ? 'border-2 border-primario' : ''} ${bloqueado ? 'text-texto-suave' : ''}`}>
                    {bloqueado
                      ? <div className="flex min-h-11 items-center justify-between gap-3 p-4">{contenido}</div>
                      : <Link href={href} aria-current={actualItem ? 'step' : undefined} className="flex min-h-11 items-center justify-between gap-3 rounded-xl p-4">{contenido}</Link>}
                  </Tarjeta>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
