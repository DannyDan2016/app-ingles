import { archivoSchema, type Catalogo, type Ejercicio, type EntradaGlosario, type Leccion, type Tramo } from './esquema';
import { terminosDeLectura } from './lectura';

export type ArchivoCargado = { ruta: string; datos: unknown; demo: boolean };

function reglasEjercicio(e: Ejercicio, padreId: string): string[] {
  const err: string[] = [];
  if (!e.id.startsWith(`${padreId}-`)) err.push(`${e.id}: el id debe empezar por ${padreId}-`);
  if (e.tipo === 'opcion_multiple' && e.correcta >= e.opciones.length) err.push(`${e.id}: correcta fuera de rango`);
  if (e.tipo === 'completar' && e.texto.split('___').length !== 2) err.push(`${e.id}: el texto debe tener exactamente un ___`);
  if (e.tipo === 'emparejar') {
    const as = new Set(e.pares.map((p) => p.a)); const bs = new Set(e.pares.map((p) => p.b));
    if (as.size !== e.pares.length || bs.size !== e.pares.length) err.push(`${e.id}: los lados de emparejar deben ser únicos`);
  }
  return err;
}

export function validarCatalogo(archivos: ArchivoCargado[], opts: { estricto: boolean }) {
  const errores: string[] = [];
  const avisos: string[] = [];
  const lecciones: Leccion[] = []; const tramos: Tramo[] = []; const glosario: EntradaGlosario[] = [];
  const demoIds = new Set<string>();

  for (const a of archivos) {
    const r = archivoSchema.safeParse(a.datos);
    if (!r.success) {
      for (const i of r.error.issues) errores.push(`${a.ruta}: ${i.path.join('.') || '(raíz)'}: ${i.message}`);
      continue;
    }
    const d = r.data;
    if (d.tipo === 'glosario') glosario.push(...d.entradas);
    else {
      (d.tipo === 'leccion' ? lecciones : tramos).push(d as never);
      if (a.demo) demoIds.add(d.id);
    }
  }

  const clave = (nivel: string, tema: string) => `${nivel}/${tema}`;
  const terminosPorTema = new Map<string, Set<string>>();
  for (const g of glosario) {
    const k = clave(g.nivel, g.tema);
    const set = terminosPorTema.get(k) ?? new Set<string>();
    if (set.has(g.termino)) errores.push(`término repetido: ${g.termino} (${k})`);
    set.add(g.termino); terminosPorTema.set(k, set);
  }

  const ids = new Set<string>(); const ordenes = new Set<string>(); const idsEj = new Set<string>();
  const items = [...lecciones, ...tramos];
  for (const it of items) {
    const esDemo = demoIds.has(it.id);
    if (ids.has(it.id)) errores.push(`id duplicado: ${it.id}`);
    ids.add(it.id);
    const ko = `${it.nivel}:${it.orden}`;
    if (ordenes.has(ko)) errores.push(`orden ${it.orden} repetido en ${it.nivel}`);
    ordenes.add(ko);
    if (!esDemo && !it.id.startsWith(`${it.nivel.toLowerCase()}-`)) errores.push(`${it.id}: el id debe empezar por ${it.nivel.toLowerCase()}-`);
    if (!it.revisado && !esDemo) (opts.estricto ? errores : avisos).push(`${it.id}: revisado: false`);

    const ejercicios = it.tipo === 'leccion' ? it.ejercicios : it.preguntas;
    for (const e of ejercicios) {
      if (idsEj.has(e.id)) errores.push(`id de ejercicio duplicado: ${e.id}`);
      idsEj.add(e.id);
      errores.push(...reglasEjercicio(e, it.id));
    }

    const v = it.tipo === 'leccion' ? it.video : it.fuente;
    if (v && v.start >= v.end) errores.push(`${it.id}: video con start >= end`);
    if (it.tipo === 'tramo' && v && v.start < v.end && (v.end - v.start < 30 || v.end - v.start > 120)) {
      errores.push(`${it.id}: el tramo debe durar entre 30 y 120 s`);
    }

    const referidos = [
      ...(it.tipo === 'leccion' ? [...terminosDeLectura(it.lectura), ...it.terminos] : it.palabrasClave),
      ...ejercicios.flatMap((e) => e.terminos ?? []),
    ];
    const disponibles = terminosPorTema.get(clave(it.nivel, it.tema)) ?? new Set<string>();
    for (const t of new Set(referidos)) {
      if (!disponibles.has(t)) errores.push(`${it.id}: «${t}» no está en el glosario ${clave(it.nivel, it.tema)}`);
    }
  }

  const catalogo: Catalogo = { lecciones, tramos, glosario };
  return { errores, avisos, catalogo };
}
