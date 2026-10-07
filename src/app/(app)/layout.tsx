import { Navegacion } from '@/components/navegacion';
import { MedidorActividad } from '@/components/medidor-actividad';

// El layout no consulta la BD: así loading.tsx cubre el arranque en frío. Cada página y acción llama a requireUser/requireAdmin.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-20 focus:rounded-md focus:bg-primario focus:px-4 focus:py-2 focus:text-sobre-primario">Saltar al contenido</a>
      <MedidorActividad />
      <Navegacion />
      <main id="contenido" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 lg:pb-6">{children}</main>
    </div>
  );
}
