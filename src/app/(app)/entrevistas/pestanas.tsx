import Link from 'next/link';

export function PestanasEntrevistas({ activa }: { activa: 'preguntas' | 'shadowing' }) {
  const t = [{ id: 'preguntas', href: '/entrevistas', label: 'Preguntas' }, { id: 'shadowing', href: '/entrevistas/shadowing', label: 'Shadowing' }] as const;
  return (
    <nav aria-label="Secciones de entrevistas" className="flex gap-2">
      {t.map((x) => (
        <Link key={x.id} href={x.href} aria-current={activa === x.id ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-md border border-borde px-4 font-semibold ${activa === x.id ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto'}`}>
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
