import { NIVELES_ENTREVISTA, ROLES_ENTREVISTA, type NivelEntrevista, type PreguntaEntrevista, type RolEntrevista } from '@/lib/contenido/esquema';

export type FiltroEntrevista = { rol?: RolEntrevista; nivel?: NivelEntrevista };
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Solo valores de las listas cerradas; cualquier otro se ignora (sin filtro). */
export function leerFiltro(q: { rol?: string | string[]; nivel?: string | string[] }): FiltroEntrevista {
  const rol = uno(q.rol); const nivel = uno(q.nivel);
  return {
    ...((ROLES_ENTREVISTA as readonly string[]).includes(rol ?? '') ? { rol: rol as RolEntrevista } : {}),
    ...((NIVELES_ENTREVISTA as readonly string[]).includes(nivel ?? '') ? { nivel: nivel as NivelEntrevista } : {}),
  };
}
export const filtrarPreguntas = (lista: PreguntaEntrevista[], f: FiltroEntrevista) =>
  lista.filter((p) => (!f.rol || p.rol === f.rol) && (!f.nivel || p.nivel === f.nivel));
