import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleCheck, Headphones } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { tramosDeNivel, caminoDeNivel } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { EstadoVacioNivel } from '@/components/estado-vacio-nivel';
import { Tarjeta } from '@/components/tarjeta';

const TEMAS: Record<string, string> = { ia: 'IA', qa: 'QA', backend: 'Backend', frontend: 'Frontend' };

export default async function EscucharPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const nivel = u.nivelInicial;
  const tramos = tramosDeNivel(nivel);
  const hechos = new Set(
    estadoCamino(caminoDeNivel(nivel), await itemsCompletados(getDb(), u.userId, nivel)).items
      .filter((i) => i.tipo === 'tramo' && i.estado === 'hecho').map((i) => i.id),
  );
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Escuchar</h1>
      {tramos.length === 0 ? <EstadoVacioNivel nivel={nivel} /> : (
        <>
          <p className="text-texto-suave">Fragmentos reales en inglés, con tres pasadas y preguntas de comprensión.</p>
          <ul className="flex flex-col gap-3">
            {tramos.map((t) => {
              const hecho = hechos.has(t.id);
              const Icono = hecho ? CircleCheck : Headphones;
              return (
                <li key={t.id}>
                  <Tarjeta as="div" className="p-0">
                    <Link href={`/escuchar/${t.id}`} className="flex min-h-11 items-center justify-between gap-3 rounded-xl p-4">
                      <span className="flex min-w-0 flex-col">
                        <span lang="en" className="font-semibold">{t.fuente.titulo}</span>
                        <span className="text-sm text-texto-suave">
                          {TEMAS[t.tema] ?? t.tema} · <span lang="en">{t.fuente.canal}</span> · {t.fuente.end - t.fuente.start} s
                        </span>
                      </span>
                      <span className={`flex shrink-0 items-center gap-1 text-sm ${hecho ? 'text-exito' : ''}`}>
                        <Icono aria-hidden="true" className="size-4" /> {hecho ? 'Hecho' : 'Disponible'}
                      </span>
                    </Link>
                  </Tarjeta>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
