'use client';
import { useActionState } from 'react';
import { registroAction, type RegistroState } from './actions';
import { Campo } from '@/components/campo';
import { Boton } from '@/components/boton';

export function RegistroForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState<RegistroState, FormData>(registroAction, {});
  const errorId = state.error ? 'registro-error' : undefined;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="code" value={code} />
      <Campo name="alias" label="Usuario" autoComplete="username" hint="De 3 a 20 caracteres: letras, números o guion bajo." defaultValue={state.alias} errorId={errorId} required />
      <Campo name="password" label="Contraseña" type="password" autoComplete="new-password" hint="Mínimo 12 caracteres." errorId={errorId} required />
      {state.error && <p id="registro-error" role="alert" className="text-error">{state.error}</p>}
      <Boton type="submit" disabled={pending}>{pending ? 'Creando…' : 'Crear cuenta'}</Boton>
    </form>
  );
}
