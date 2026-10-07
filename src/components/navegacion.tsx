'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { House, Map, Headphones, User } from 'lucide-react';

const SECCIONES = [
  { href: '/hoy', etiqueta: 'Hoy', Icono: House },
  { href: '/camino', etiqueta: 'Camino', Icono: Map },
  { href: '/escuchar', etiqueta: 'Escuchar', Icono: Headphones },
  { href: '/perfil', etiqueta: 'Perfil', Icono: User },
] as const;

export function Navegacion() {
  const ruta = usePathname();
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (e.altKey && !e.ctrlKey && !e.metaKey && n >= 1 && n <= SECCIONES.length) { e.preventDefault(); router.push(SECCIONES[n - 1].href); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-borde/40 bg-fondo pb-[env(safe-area-inset-bottom)] lg:static lg:pb-0 lg:w-56 lg:border-r lg:border-t-0">
      <ul className="mx-auto flex max-w-xl justify-around lg:flex-col lg:gap-1 lg:p-3">
        {SECCIONES.map(({ href, etiqueta, Icono }, i) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link href={href} aria-current={activa ? 'page' : undefined} aria-keyshortcuts={`Alt+${i + 1}`}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-base ${activa ? 'font-semibold text-primario' : 'text-texto-suave'}`}>
                <Icono aria-hidden="true" className="size-5" />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
