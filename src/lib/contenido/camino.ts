import type { Nivel, Tema } from './esquema';

export type ItemCamino = { id: string; tipo: 'leccion' | 'tramo'; titulo: string; orden: number; tema: Tema; nivel: Nivel };
export type EstadoItem = 'hecho' | 'actual' | 'bloqueado' | 'disponible';
type ConEstado = ItemCamino & { estado: EstadoItem };

/** Lecciones: lineales por orden. Tramos: siempre disponibles (decisión D1). Ambos cuentan para el %. */
export function estadoCamino(items: ItemCamino[], completados: ReadonlySet<string>) {
  let actualAsignado = false;
  const conEstado: ConEstado[] = [...items].sort((a, b) => a.orden - b.orden).map((it) => {
    let estado: EstadoItem;
    if (completados.has(it.id)) estado = 'hecho';
    else if (it.tipo === 'tramo') estado = 'disponible';
    else if (!actualAsignado) { estado = 'actual'; actualAsignado = true; }
    else estado = 'bloqueado';
    return { ...it, estado };
  });
  const hechos = conEstado.filter((i) => i.estado === 'hecho').length;
  return {
    items: conEstado,
    porcentaje: conEstado.length ? Math.round((hechos * 100) / conEstado.length) : 0,
    siguiente: conEstado.find((i) => i.estado === 'actual') ?? null,
  };
}
