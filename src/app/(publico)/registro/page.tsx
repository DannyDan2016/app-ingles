import { getDb } from '@/lib/db/client';
import { checkInviteCode } from '@/lib/auth/invites';
import { parseInviteCode } from '@/lib/validation/schemas';
import { RegistroForm } from './registro-form';

export default async function RegistroPage({ searchParams }: PageProps<'/registro'>) {
  // El parámetro c puede venir repetido (array) o mal formado: se valida antes de consultar la BD.
  const code = parseInviteCode((await searchParams).c);
  const state = code ? await checkInviteCode(getDb(), code, new Date()) : 'inexistente';
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Crear tu cuenta</h1>
      {code && state === 'valida' ? (
        <RegistroForm code={code} />
      ) : (
        <p role="alert">Acceso no autorizado: la invitación no es válida o ya se usó.</p>
      )}
    </main>
  );
}
