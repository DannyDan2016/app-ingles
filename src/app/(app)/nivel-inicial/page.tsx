import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { NIVELES, NIVEL_POR_DEFECTO } from '@/lib/progreso/niveles';
import { Boton } from '@/components/boton';
import { salirAction } from '../salir/actions';
import { nivelInicialAction } from './actions';

const METAS = [5, 10, 15] as const;

export default async function NivelInicialPage() {
  const u = await requireUser();
  if (u.nivelInicial) redirect('/hoy');
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Elige tu nivel</h1>
      <form action={nivelInicialAction} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">¿Desde qué nivel quieres empezar? Los anteriores quedarán como omitidos.</legend>
          {NIVELES.map((n) => (
            <label key={n} className="flex min-h-11 items-center gap-3">
              <input type="radio" name="nivel" value={n} defaultChecked={n === NIVEL_POR_DEFECTO} className="size-5" />
              {n}
            </label>
          ))}
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2">¿Cuánto tiempo al día?</legend>
          {METAS.map((m) => (
            <label key={m} className="flex min-h-11 items-center gap-3">
              <input type="radio" name="meta" value={m} defaultChecked={m === 10} className="size-5" />
              {m} minutos
            </label>
          ))}
        </fieldset>
        <Boton type="submit" className="self-start">Guardar y empezar</Boton>
      </form>
      <form action={salirAction} className="mt-8">
        <Boton type="submit" variante="secundario">Salir</Boton>
      </form>
    </>
  );
}
