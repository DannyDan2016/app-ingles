import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/current-user';

// Solo decide si se muestra el enlace. La autorización real la hace requireAdmin en la página y en las acciones.
// getCurrentUser va con cache(): comparte la consulta con requireUser de la página en la misma petición.
export async function EnlaceAdmin() {
  const u = await getCurrentUser();
  if (u?.rol !== 'admin') return null;
  return <Link href="/admin/invitaciones" className="min-h-11 content-center">Invitaciones</Link>;
}
