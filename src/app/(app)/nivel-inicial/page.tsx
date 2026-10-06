import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { NIVELES, NIVEL_POR_DEFECTO } from '@/lib/progreso/niveles';
import { Boton } from '@/components/boton';
import { nivelInicialAction } from './actions';

export default async function NivelInicialPage() {
  const u = await requireUser();
  if (u.nivelInicial) redirect('/niveles');
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
        <Boton type="submit" className="self-start">Guardar nivel</Boton>
      </form>
    </>
  );
}
