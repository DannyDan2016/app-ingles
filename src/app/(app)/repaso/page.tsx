import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { buscarEntrada } from '@/lib/contenido/catalogo';
import { isNivel } from '@/lib/progreso/niveles';
import { tarjetasPendientes } from '@/lib/repaso/repaso.repo';
import { Tarjeta } from '@/components/tarjeta';
import { SesionRepaso, type TarjetaRepaso } from './sesion-repaso';

export default async function RepasoPage() {
  const u = await requireUser();
  const pendientes = await tarjetasPendientes(getDb(), u.userId, new Date());
  const tarjetas: TarjetaRepaso[] = pendientes.flatMap((t) => {
    if (!isNivel(t.nivel)) return [];
    const e = buscarEntrada(t.nivel, t.termino);
    return [{
      termino: t.termino,
      nivel: t.nivel,
      ejemplo: e?.ejemplo_en ?? null,
      traduccion: e?.traduccion_es ?? null,
      definicion: e?.definicion_en ?? null,
    }];
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Repaso</h1>
      {tarjetas.length === 0 ? (
        <Tarjeta>
          <p className="font-semibold">No tienes repasos pendientes hoy. ¡Bien!</p>
          <Link href="/hoy" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver a Hoy</Link>
        </Tarjeta>
      ) : (
        <SesionRepaso tarjetas={tarjetas} />
      )}
    </div>
  );
}
