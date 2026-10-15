import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { setsShadowing } from '@/lib/contenido/catalogo';
import { ROL_ETIQUETA } from '@/lib/entrevistas/etiquetas';
import { Tarjeta } from '@/components/tarjeta';
import { PestanasEntrevistas } from '../pestanas';

export default async function ShadowingPage() {
  await requireUser();
  const sets = setsShadowing();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Entrevistas</h1>
      <PestanasEntrevistas activa="shadowing" />
      <p className="text-texto-suave">Escucha cada frase de una entrevista real y repítela en voz alta.</p>
      {sets.length === 0 ? <p role="status">Aún no hay sets de shadowing</p> : (
        <ul className="flex flex-col gap-3">
          {sets.map((s) => (
            <li key={s.id}>
              <Tarjeta as="div" className="p-0">
                <Link href={`/entrevistas/shadowing/${s.id}`} className="flex min-h-11 flex-col gap-1 rounded-xl p-4">
                  <span lang="en" className="font-semibold">{s.titulo}</span>
                  <span className="text-sm text-texto-suave">{ROL_ETIQUETA[s.rol]} · {s.nivel} · <span lang="en">{s.video.canal}</span></span>
                </Link>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
