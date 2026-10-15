import { diaBogota } from '@/lib/tiempo/bogota';

/** Versión del formato del archivo; subirla si cambia la forma (la importación futura se apoyará en ella). */
export const VERSION_EXPORTACION = 1;

export type DatosExportacion = {
  alias: string;
  nivelInicial: string | null;
  metaDiariaMin: number;
  lecciones: { leccionId: string; nivel: string; completadaAt: Date }[];
  tarjetas: { termino: string; nivel: string; caja: number; proximaAt: Date; aciertos: number; fallos: number }[];
  actividad: { fecha: string; segundos: number }[];
  respuestas: { origen: string; total: number; correctas: number }[];
  evaluaciones: { nivel: string; estado: string; nota: number | null; iniciadoAt: Date; terminadoAt: Date | null }[];
};

/**
 * Lista blanca explícita: cada campo se copia a mano, así que un campo extra en la entrada
 * (hash de contraseña, ids internos, tokens) nunca llega al archivo.
 */
export function serializarProgreso(d: DatosExportacion, ahora: Date) {
  return {
    version: VERSION_EXPORTACION,
    exportadoEn: diaBogota(ahora),
    perfil: { alias: d.alias, nivelInicial: d.nivelInicial, metaDiariaMin: d.metaDiariaMin },
    lecciones: d.lecciones.map((l) => ({ leccionId: l.leccionId, nivel: l.nivel, completadaEn: diaBogota(l.completadaAt) })),
    tarjetas: d.tarjetas.map((t) => ({
      termino: t.termino, nivel: t.nivel, caja: t.caja, proximaRevision: diaBogota(t.proximaAt), aciertos: t.aciertos, fallos: t.fallos,
    })),
    actividad: d.actividad.map((a) => ({ fecha: a.fecha, segundos: a.segundos })),
    respuestas: d.respuestas.map((r) => ({ origen: r.origen, total: r.total, correctas: r.correctas })),
    evaluaciones: d.evaluaciones.map((e) => ({
      nivel: e.nivel, estado: e.estado, nota: e.nota, iniciadaEn: diaBogota(e.iniciadoAt), terminadaEn: e.terminadoAt ? diaBogota(e.terminadoAt) : null,
    })),
  };
}

export const nombreArchivo = (ahora: Date): string => `progreso-${diaBogota(ahora)}.json`;
