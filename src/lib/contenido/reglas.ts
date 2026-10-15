import { archivoSchema, BLOQUES, type Catalogo, type Ejercicio, type EntradaGlosario, type Evaluacion, type Leccion, type Tramo } from './esquema';
import { terminosDeLectura } from './lectura';

export type ArchivoCargado = { ruta: string; datos: unknown; demo: boolean; /** Mensaje si el archivo no se pudo leer o parsear (YAML mal formado). */ errorLectura?: string };

/** El nivel debe coincidir con la carpeta (`content/a2/…`) y tema/id con el nombre (`a2-qa-01`, `glosario-qa`). */
function reglasArchivo(ruta: string, d: { tipo: string; nivel: string; tema?: string; id?: string }): string[] {
  const m = /^content\/([^/]+)\/([^/]+)\.yaml$/.exec(ruta);
  if (!m) return [];
  const [, carpeta, nombre] = m;
  if (d.tipo === 'evaluacion') {
    return d.nivel.toLowerCase() === carpeta && nombre === `evaluacion-${carpeta}` ? [] : [`${ruta}: el banco de ${d.nivel} debe estar en content/${d.nivel.toLowerCase()}/evaluacion-${d.nivel.toLowerCase()}.yaml`];
  }
  const err: string[] = [];
  if (d.nivel.toLowerCase() !== carpeta) err.push(`${ruta}: nivel ${d.nivel} no coincide con la carpeta ${carpeta}`);
  if (d.tipo === 'glosario') {
    if (nombre !== `glosario-${d.tema}`) err.push(`${ruta}: tema ${d.tema} no coincide con el nombre del archivo (glosario-${d.tema}.yaml)`);
  } else {
    if (d.id !== nombre) err.push(`${ruta}: el id ${d.id} no coincide con el nombre del archivo`);
    const temaEnNombre = nombre.split('-')[1];
    if (temaEnNombre !== d.tema) err.push(`${ruta}: tema ${d.tema} no coincide con el nombre del archivo (${nombre})`);
  }
  return err;
}

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

function reglasEvaluacion(ev: Evaluacion, demo: boolean, videosContenido: ReadonlySet<string>): string[] {
  const err: string[] = [];
  const pref = demo ? 'demo-ev' : `${ev.nivel.toLowerCase()}-ev`;
  const nombre = `evaluación ${ev.nivel}`;
  const recursos = new Map(ev.recursos.map((r) => [r.id, r]));
  if (recursos.size !== ev.recursos.length) err.push(`${nombre}: id de recurso duplicado`);
  for (const r of ev.recursos) {
    if (!r.id.startsWith(`${pref}-`)) err.push(`${r.id}: el id debe empezar por ${pref}-`);
    if (r.tipo === 'video') {
      if (r.fuente.start >= r.fuente.end) err.push(`${r.id}: video con start >= end`);
      if (videosContenido.has(r.fuente.youtubeId)) err.push(`${r.id}: el video ya se usa en una lección o tramo`);
    }
  }
  const ids = new Set<string>();
  const porRecurso = new Map<string, number>();
  for (const p of ev.preguntas) {
    if (ids.has(p.id)) err.push(`id de pregunta duplicado: ${p.id}`);
    ids.add(p.id);
    err.push(...reglasEjercicio(p, pref));
    const necesita = p.bloque === 'lectura' ? 'lectura' : p.bloque === 'listening' ? 'video' : null;
    if (necesita) {
      const r = p.recurso ? recursos.get(p.recurso) : undefined;
      if (!r || r.tipo !== necesita) err.push(`${p.id}: el bloque ${p.bloque} necesita un recurso de tipo ${necesita}`);
      else porRecurso.set(r.id, (porRecurso.get(r.id) ?? 0) + 1);
    } else if (p.recurso) err.push(`${p.id}: el bloque ${p.bloque} no lleva recurso`);
  }
  for (const b of BLOQUES) {
    const n = ev.preguntas.filter((p) => p.bloque === b).length;
    if (demo ? n < 5 : n !== 10) err.push(`${nombre}: el bloque ${b} tiene ${n} preguntas (${demo ? 'mínimo 5' : 'deben ser 10'})`);
  }
  if (!demo) {
    for (const tipo of ['lectura', 'video'] as const) {
      const rs = ev.recursos.filter((r) => r.tipo === tipo);
      if (rs.length !== 2) err.push(`${nombre}: debe haber 2 recursos de tipo ${tipo} (hay ${rs.length})`);
      for (const r of rs) if ((porRecurso.get(r.id) ?? 0) < 4) err.push(`${r.id}: necesita al menos 4 preguntas`);
    }
  }
  return err;
}

export function validarCatalogo(archivos: ArchivoCargado[], opts: { estricto: boolean }) {
  const errores: string[] = [];
  const avisos: string[] = [];
  const lecciones: Leccion[] = []; const tramos: Tramo[] = []; const glosario: EntradaGlosario[] = [];
  const evaluaciones: { ev: Evaluacion; demo: boolean }[] = [];
  const demoIds = new Set<string>();

  for (const a of archivos) {
    if (a.errorLectura !== undefined) { errores.push(`${a.ruta}: YAML mal formado: ${a.errorLectura}`); continue; }
    const r = archivoSchema.safeParse(a.datos);
    if (!r.success) {
      for (const i of r.error.issues) errores.push(`${a.ruta}: ${i.path.join('.') || '(raíz)'}: ${i.message}`);
      continue;
    }
    const d = r.data;
    if (!a.demo) errores.push(...reglasArchivo(a.ruta, d));
    if (d.tipo === 'evaluacion') { evaluaciones.push({ ev: d, demo: a.demo }); continue; }
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

  const videosContenido = new Set([...lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])), ...tramos.map((t) => t.fuente.youtubeId)]);
  const porNivel = new Map<string, { ev: Evaluacion; demo: boolean }>();
  for (const x of evaluaciones) {
    errores.push(...reglasEvaluacion(x.ev, x.demo, videosContenido));
    if (!x.ev.revisado && !x.demo) (opts.estricto ? errores : avisos).push(`evaluacion-${x.ev.nivel.toLowerCase()}: revisado: false`);
    const previa = porNivel.get(x.ev.nivel);
    if (!previa) porNivel.set(x.ev.nivel, x);
    else if (previa.demo !== x.demo) {
      avisos.push(`evaluación ${x.ev.nivel}: se usa el banco de demo`);
      if (x.demo) porNivel.set(x.ev.nivel, x);
    } else errores.push(`evaluación ${x.ev.nivel} duplicada`);
  }
  const catalogo: Catalogo = { lecciones, tramos, glosario, evaluaciones: [...porNivel.values()].map((x) => x.ev) };
  return { errores, avisos, catalogo };
}
