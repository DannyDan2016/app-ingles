import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { salirAction } from './salir/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-borde">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <Link href="/niveles" className="min-h-11 content-center font-semibold">Inglés técnico</Link>
          {u.rol === 'admin' && <Link href="/admin/invitaciones" className="min-h-11 content-center">Invitaciones</Link>}
          <form action={salirAction} className="ml-auto">
            <button type="submit" className="min-h-11 min-w-11 px-2">Salir</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
