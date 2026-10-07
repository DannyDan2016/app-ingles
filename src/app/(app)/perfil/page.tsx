import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { datosSemana, tarjetasPorCaja } from '@/lib/avance/avance.repo';
import { resumenSemana } from '@/lib/avance/semana';
import { COOKIE_TEMA, temaDesdeCookie, type TemaUI } from '@/lib/tema';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { MetricasSemana, SemanaActiva } from '@/components/metricas-semana';
import { salirAction } from '../salir/actions';
import { EnlaceAdmin } from './enlace-admin';
import { cambiarMetaAction, cambiarTemaAction } from './actions';

const CAJAS = [
  { caja: 1, texto: 'mañana' },
  { caja: 2, texto: 'en 3 días' },
  { caja: 3, texto: 'en 7 días' },
  { caja: 4, texto: 'en 14 días' },
  { caja: 5, texto: 'en 30 días' },
] as const;
const METAS = [5, 10, 15] as const;
const TEMAS: { valor: TemaUI; etiqueta: string }[] = [
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
  { valor: 'sistema', etiqueta: 'Sistema' },
];

export default async function PerfilPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const db = getDb();
  const [datos, porCaja, temaActual] = await Promise.all([
    datosSemana(db, u.userId, new Date()),
    tarjetasPorCaja(db, u.userId),
    cookies().then((c) => temaDesdeCookie(c.get(COOKIE_TEMA)?.value)),
  ]);
  const r = resumenSemana(datos);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <p className="text-texto-suave">Usuario: <span className="font-medium text-texto">{u.alias}</span> · Nivel inicial: {u.nivelInicial}</p>

      <Tarjeta aria-labelledby="p-semana">
        <h2 id="p-semana" className="mb-3 text-lg font-semibold">Tu avance semanal</h2>
        <SemanaActiva r={r} />
        <div className="mt-4">
          <MetricasSemana r={r} />
        </div>
        <p className="mt-3">Lecciones completadas esta semana: <span className="font-semibold">{r.leccionesSemana}</span></p>
      </Tarjeta>

      <Tarjeta aria-labelledby="p-vocab">
        <h2 id="p-vocab" className="mb-2 text-lg font-semibold">Mi vocabulario</h2>
        <ul className="grid gap-1">
          {CAJAS.map(({ caja, texto }) => (
            <li key={caja}>Caja {caja} ({texto}): <span className="font-semibold">{porCaja[caja]}</span></li>
          ))}
        </ul>
        <p className="mt-2 font-medium">Consolidadas (caja ≥ 4): {porCaja[4] + porCaja[5]}</p>
      </Tarjeta>

      <Tarjeta aria-labelledby="p-meta">
        <h2 id="p-meta" className="mb-2 text-lg font-semibold">Meta diaria</h2>
        <form action={cambiarMetaAction} className="flex flex-col gap-2">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-texto-suave">Minutos de práctica al día</legend>
            {METAS.map((m) => (
              <label key={m} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="meta" value={m} defaultChecked={m === datos.metaDiariaMin} className="size-5" />
                {m} minutos
              </label>
            ))}
          </fieldset>
          <Boton type="submit" className="self-start">Guardar meta</Boton>
        </form>
      </Tarjeta>

      <Tarjeta aria-labelledby="p-tema">
        <h2 id="p-tema" className="mb-2 text-lg font-semibold">Tema</h2>
        <form action={cambiarTemaAction} className="flex flex-col gap-2">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-texto-suave">Apariencia de la aplicación</legend>
            {TEMAS.map((t) => (
              <label key={t.valor} className="flex min-h-11 items-center gap-3">
                <input type="radio" name="tema" value={t.valor} defaultChecked={t.valor === temaActual} className="size-5" />
                {t.etiqueta}
              </label>
            ))}
          </fieldset>
          <Boton type="submit" className="self-start">Guardar tema</Boton>
        </form>
      </Tarjeta>

      <div className="flex flex-wrap items-center gap-4">
        <Suspense fallback={null}>
          <EnlaceAdmin />
        </Suspense>
        <form action={salirAction}>
          <Boton type="submit" variante="secundario">Salir</Boton>
        </form>
      </div>
    </div>
  );
}
