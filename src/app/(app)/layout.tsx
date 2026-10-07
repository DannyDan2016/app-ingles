import { Suspense } from 'react';
import Link from 'next/link';
import { salirAction } from './salir/actions';
import { EnlaceAdmin } from './enlace-admin';

// El layout no consulta la BD: así loading.tsx cubre el arranque en frío. Cada página y acción llama a requireUser/requireAdmin.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-borde">
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <Link href="/niveles" className="min-h-11 content-center font-semibold">Inglés técnico</Link>
          <Suspense fallback={null}>
            <EnlaceAdmin />
          </Suspense>
          <form action={salirAction} className="ml-auto">
            <button type="submit" className="min-h-11 min-w-11 px-2">Salir</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
