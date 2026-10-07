import { lunesDe, sumarDias } from '@/lib/tiempo/bogota';

export type DatosSemana = {
  hoy: string; metaDiariaMin: number;
  actividad: { fecha: string; segundos: number }[];
  repasos: { correcta: boolean; caja: number | null }[];
  consolidadasTotal: number; leccionesSemana: number;
};
export const SEGUNDOS_DIA_ACTIVO = 60;
export const META_DIAS = 5;

export function resumenSemana(d: DatosSemana) {
  const lunes = lunesDe(d.hoy);
  const seg = new Map(d.actividad.map((a) => [a.fecha, a.segundos]));
  const dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, activo: (seg.get(fecha) ?? 0) >= SEGUNDOS_DIA_ACTIVO, futuro: fecha > d.hoy };
  });
  const totalSeg = dias.reduce((s, x) => s + (seg.get(x.fecha) ?? 0), 0);
  const maduros = d.repasos.filter((r) => (r.caja ?? 0) >= 3);
  const minutosHoy = Math.floor((seg.get(d.hoy) ?? 0) / 60);
  return {
    dias,
    diasActivos: dias.filter((x) => x.activo).length,
    metaDias: META_DIAS, diasGracia: 7 - META_DIAS,
    minutosSemana: Math.floor(totalSeg / 60),
    minutosHoy,
    metaHoyPct: Math.min(100, Math.round((minutosHoy * 100) / d.metaDiariaMin)),
    aciertosMadurosPct: maduros.length ? Math.round((maduros.filter((r) => r.correcta).length * 100) / maduros.length) : null,
    consolidadasTotal: d.consolidadasTotal,
    consolidadasNuevas: d.repasos.filter((r) => r.correcta && r.caja === 3).length,
    leccionesSemana: d.leccionesSemana,
  };
}
export type ResumenSemana = ReturnType<typeof resumenSemana>;
