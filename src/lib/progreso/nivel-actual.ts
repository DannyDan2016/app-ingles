import type { Db } from '@/lib/db/client';
import { nivelesAprobados } from '@/lib/evaluacion/evaluacion.repo';
import { estadoNiveles, nivelActual, type EstadoNivel, type Nivel } from './niveles';

export async function nivelesDelUsuario(db: Db, userId: string, nivelInicial: Nivel) {
  const niveles = estadoNiveles({ nivelInicial, aprobados: await nivelesAprobados(db, userId) });
  const estadoDe = (n: Nivel): EstadoNivel => niveles.find((x) => x.nivel === n)?.estado ?? 'bloqueado';
  return { niveles, actual: nivelActual(niveles), estadoDe };
}
