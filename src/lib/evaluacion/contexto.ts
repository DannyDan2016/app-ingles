import 'server-only';
import type { Db } from '@/lib/db/client';
import type { Nivel } from '@/lib/contenido/esquema';
import { getEvaluacion, leccionesDeNivel } from '@/lib/contenido/catalogo';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { nivelesDelUsuario } from '@/lib/progreso/nivel-actual';
import * as repo from './evaluacion.repo';
import { caducado, elegibilidad } from './elegibilidad';

/** Estado de la evaluación de un nivel para un usuario. Caduca el intento abierto si pasó de 48 h o si el banco cambió. */
export async function contextoEvaluacion(db: Db, u: { userId: string; nivelInicial: Nivel }, nivel: Nivel, ahora: Date) {
  const banco = getEvaluacion(nivel);
  const [{ estadoDe }, hechos, aprobado, ultimo] = await Promise.all([
    nivelesDelUsuario(db, u.userId, u.nivelInicial),
    itemsCompletados(db, u.userId, nivel),
    repo.intentoAprobado(db, u.userId, nivel),
    repo.ultimoTerminado(db, u.userId, nivel),
  ]);
  let abierto: repo.Intento | null = (await repo.intentoAbierto(db, u.userId, nivel)) ?? null;
  let caducadoAhora = false;
  const ids = new Set(banco?.preguntas.map((p) => p.id));
  if (abierto && (caducado(abierto, ahora) || abierto.preguntas.some((id) => !ids.has(id)))) {
    await repo.marcarCaducado(db, abierto.id);
    abierto = null;
    caducadoAhora = true;
  }
  const lecciones = leccionesDeNivel(nivel);
  return {
    elegibilidad: elegibilidad({
      estadoNivel: estadoDe(nivel), hayBanco: !!banco, lecciones: lecciones.length,
      hechas: lecciones.filter((l) => hechos.has(l.id)).length, abierto, aprobado, ultimo, ahora,
    }),
    banco, abierto, ultimo, aprobado, caducadoAhora,
  };
}
