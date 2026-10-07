import 'server-only';
import { catalogo } from '@/content/generado/catalogo';
import type { EntradaGlosario, Ejercicio, Leccion, Nivel, Tema, Tramo } from './esquema';
import type { ItemCamino } from './camino';

const lecciones = new Map(catalogo.lecciones.map((l) => [l.id, l]));
const tramos = new Map(catalogo.tramos.map((t) => [t.id, t]));
const ejercicios = new Map<string, { ejercicio: Ejercicio; padreId: string; nivel: Nivel }>();
for (const l of catalogo.lecciones) for (const e of l.ejercicios) ejercicios.set(e.id, { ejercicio: e, padreId: l.id, nivel: l.nivel });
for (const t of catalogo.tramos) for (const e of t.preguntas) ejercicios.set(e.id, { ejercicio: e, padreId: t.id, nivel: t.nivel });

const aItem = (x: Leccion | Tramo): ItemCamino => ({ id: x.id, tipo: x.tipo, titulo: x.tipo === 'leccion' ? x.titulo : x.fuente.titulo, orden: x.orden, tema: x.tema, nivel: x.nivel });

export const getLeccion = (id: string): Leccion | undefined => lecciones.get(id);
export const getTramo = (id: string): Tramo | undefined => tramos.get(id);
export function getItem(id: string): ItemCamino | undefined {
  const x = lecciones.get(id) ?? tramos.get(id);
  return x && aItem(x);
}
export const getEjercicio = (id: string) => ejercicios.get(id);
export function caminoDeNivel(nivel: Nivel): ItemCamino[] {
  return [...catalogo.lecciones, ...catalogo.tramos].filter((x) => x.nivel === nivel).map(aItem).sort((a, b) => a.orden - b.orden);
}
export const tramosDeNivel = (nivel: Nivel): Tramo[] => catalogo.tramos.filter((t) => t.nivel === nivel).sort((a, b) => a.orden - b.orden);
export function glosarioPara(nivel: Nivel, tema: Tema, terminos: string[]): Record<string, EntradaGlosario> {
  const quiero = new Set(terminos);
  return Object.fromEntries(catalogo.glosario.filter((g) => g.nivel === nivel && g.tema === tema && quiero.has(g.termino)).map((g) => [g.termino, g]));
}
export const buscarEntrada = (nivel: Nivel, termino: string): EntradaGlosario | undefined =>
  catalogo.glosario.find((g) => g.nivel === nivel && g.termino === termino);
