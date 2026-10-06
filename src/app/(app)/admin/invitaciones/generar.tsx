'use client';
import { useActionState } from 'react';
import { crearInvitacionAction, type InvitarState } from './actions';
import { Boton } from '@/components/boton';

export function GenerarInvitacion() {
  const [state, action, pending] = useActionState<InvitarState>(crearInvitacionAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Boton type="submit" disabled={pending} className="self-start">Generar invitación</Boton>
      {state.error && <p role="alert" className="text-error">{state.error}</p>}
      {state.enlace && (
        <div role="status" className="rounded-md border border-borde bg-superficie p-3">
          <p className="mb-1 font-medium">Enlace (se muestra una sola vez, caduca en 7 días):</p>
          <output data-testid="enlace-invitacion" className="break-all">{state.enlace}</output>
        </div>
      )}
    </form>
  );
}
