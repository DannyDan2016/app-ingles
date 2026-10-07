import Link from 'next/link';
import { Tarjeta } from './tarjeta';
export function EstadoVacioNivel({ nivel }: { nivel: string }) {
  return (
    <Tarjeta>
      <h2 className="text-lg font-semibold">El contenido de {nivel} llega pronto</h2>
      <p className="mt-1 text-texto-suave">Mientras tanto, practica con el camino A2.</p>
      <Link href="/camino/A2" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Ir al camino A2</Link>
    </Tarjeta>
  );
}
