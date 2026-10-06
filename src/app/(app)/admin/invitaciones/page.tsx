import { requireAdmin } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { listInvites, evaluateInvite, type InviteState } from '@/lib/auth/invites';
import { revocarAction } from './actions';
import { GenerarInvitacion } from './generar';

const ETIQUETA: Record<InviteState, string> = {
  valida: 'Válida', inexistente: 'Inexistente', usada: 'Usada', caducada: 'Caducada', revocada: 'Revocada',
};

export default async function InvitacionesPage() {
  await requireAdmin();
  const now = new Date();
  const lista = await listInvites(getDb());
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Invitaciones</h1>
      <GenerarInvitacion />
      <ul className="mt-6 flex flex-col gap-2">
        {lista.map((i) => {
          const estado = evaluateInvite(i, now);
          return (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-md border border-borde bg-superficie p-3">
              <span>{i.createdAt.toLocaleDateString('es')} · {ETIQUETA[estado]}</span>
              {estado === 'valida' && (
                <form action={revocarAction}>
                  <input type="hidden" name="id" value={i.id} />
                  <button type="submit" className="min-h-11 min-w-11 px-3">Revocar</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
