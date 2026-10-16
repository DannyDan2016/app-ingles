import type { EstadoNivel } from '@/lib/progreso/niveles';

export const CADUCIDAD_MS = 48 * 3600_000;
export const ESPERA_MS = 24 * 3600_000;
export type EstadoIntento = 'en_curso' | 'aprobado' | 'suspendido' | 'caducado';
export type IntentoResumen = { id: string; estado: EstadoIntento; iniciadoAt: Date; terminadoAt: Date | null; refuerzoCompletadoAt: Date | null };
export type Elegibilidad =
  | { tipo: 'aprobado'; intentoId: string }
  | { tipo: 'bloqueado_nivel' }
  | { tipo: 'sin_banco' }
  | { tipo: 'reanudar'; intentoId: string }
  | { tipo: 'faltan_lecciones'; faltan: number }
  | { tipo: 'falta_refuerzo'; intentoId: string }
  | { tipo: 'espera'; hasta: Date }
  | { tipo: 'puede' };

export const caducado = (i: { iniciadoAt: Date }, ahora: Date) => i.iniciadoAt.getTime() + CADUCIDAD_MS <= ahora.getTime();

export function elegibilidad(x: {
  estadoNivel: EstadoNivel; hayBanco: boolean; lecciones: number; hechas: number;
  abierto: IntentoResumen | null; aprobado: IntentoResumen | null; ultimo: IntentoResumen | null; ahora: Date;
}): Elegibilidad {
  if (x.aprobado) return { tipo: 'aprobado', intentoId: x.aprobado.id };
  if (x.estadoNivel !== 'en_curso') return { tipo: 'bloqueado_nivel' };
  if (!x.hayBanco || x.lecciones === 0) return { tipo: 'sin_banco' };
  if (x.abierto && !caducado(x.abierto, x.ahora)) return { tipo: 'reanudar', intentoId: x.abierto.id };
  if (x.hechas < x.lecciones) return { tipo: 'faltan_lecciones', faltan: x.lecciones - x.hechas };
  if (x.ultimo?.estado === 'suspendido' && x.ultimo.terminadoAt) {
    if (!x.ultimo.refuerzoCompletadoAt) return { tipo: 'falta_refuerzo', intentoId: x.ultimo.id };
    const hasta = new Date(x.ultimo.terminadoAt.getTime() + ESPERA_MS);
    if (hasta > x.ahora) return { tipo: 'espera', hasta };
  }
  return { tipo: 'puede' };
}

/** Momento en que caduca un intento abierto (48 h desde que empezó). */
export const caducaEn = (iniciadoAt: Date) => new Date(iniciadoAt.getTime() + CADUCIDAD_MS);
