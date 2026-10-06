'use client';
import { useActionState } from 'react';
import { loginAction, type LoginState } from './actions';
import { Campo } from '@/components/campo';
import { Boton } from '@/components/boton';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const errorId = state.error ? 'login-error' : undefined;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Campo name="alias" label="Usuario" autoComplete="username" defaultValue={state.alias} errorId={errorId} required />
      <Campo name="password" label="Contraseña" type="password" autoComplete="current-password" errorId={errorId} required />
      {state.error && <p id="login-error" role="alert" className="text-error">{state.error}</p>}
      <Boton type="submit" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</Boton>
    </form>
  );
}
