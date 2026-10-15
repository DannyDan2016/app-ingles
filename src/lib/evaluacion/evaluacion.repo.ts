import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { evaluacionIntentos as ei, evaluacionRespuestas as er } from '@/lib/db/schema';
import type { Bloque, Nivel } from '@/lib/contenido/esquema';

export type Intento = typeof ei.$inferSelect;

export async function crearIntento(db: Db, x: { userId: string; nivel: Nivel; preguntas: string[] }): Promise<string> {
  const [r] = await db.insert(ei).values(x).onConflictDoNothing().returning({ id: ei.id });
  if (r) return r.id;
  const abierto = await intentoAbierto(db, x.userId, x.nivel);
  if (!abierto) throw new Error('No se pudo crear el intento de evaluación');
  return abierto.id;
}

const uno = async (q: Promise<Intento[]>) => (await q)[0] ?? null;

export const intentoAbierto = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), eq(ei.estado, 'en_curso'))).limit(1));
export const intentoAprobado = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), eq(ei.estado, 'aprobado'))).limit(1));
export const ultimoTerminado = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), inArray(ei.estado, ['aprobado', 'suspendido']))).orderBy(desc(ei.terminadoAt)).limit(1));
/** Siempre filtra por dueño: un intento ajeno no existe para este usuario. */
export const getIntento = (db: Db, userId: string, intentoId: string) =>
  uno(db.select().from(ei).where(and(eq(ei.id, intentoId), eq(ei.userId, userId))).limit(1));

export async function guardarRespuesta(db: Db, intentoId: string, preguntaId: string, respuesta: string): Promise<void> {
  await db.insert(er).values({ intentoId, preguntaId, respuesta })
    .onConflictDoUpdate({ target: [er.intentoId, er.preguntaId], set: { respuesta, respondidaAt: new Date() } });
}

export async function respuestasDe(db: Db, intentoId: string): Promise<Map<string, string>> {
  const filas = await db.select({ p: er.preguntaId, r: er.respuesta }).from(er).where(eq(er.intentoId, intentoId));
  return new Map(filas.map((f) => [f.p, f.r]));
}

export async function cerrarIntento(db: Db, intentoId: string, x: { estado: 'aprobado' | 'suspendido'; nota: number; bloques: Record<Bloque, number>; ahora: Date }): Promise<void> {
  await db.update(ei).set({
    estado: x.estado, nota: x.nota, terminadoAt: x.ahora,
    notaLectura: x.bloques.lectura, notaListening: x.bloques.listening, notaVocabulario: x.bloques.vocabulario, notaGramatica: x.bloques.gramatica,
  }).where(and(eq(ei.id, intentoId), eq(ei.estado, 'en_curso')));
}

export async function marcarCaducado(db: Db, intentoId: string): Promise<void> {
  await db.update(ei).set({ estado: 'caducado' }).where(and(eq(ei.id, intentoId), eq(ei.estado, 'en_curso')));
}

export async function marcarRefuerzo(db: Db, userId: string, intentoId: string, ahora: Date): Promise<void> {
  await db.update(ei).set({ refuerzoCompletadoAt: ahora })
    .where(and(eq(ei.id, intentoId), eq(ei.userId, userId), eq(ei.estado, 'suspendido'), isNull(ei.refuerzoCompletadoAt)));
}

export async function nivelesAprobados(db: Db, userId: string): Promise<Nivel[]> {
  const filas = await db.selectDistinct({ nivel: ei.nivel }).from(ei).where(and(eq(ei.userId, userId), eq(ei.estado, 'aprobado')));
  return filas.map((f) => f.nivel);
}

export const historial = (db: Db, userId: string) =>
  db.select({ id: ei.id, nivel: ei.nivel, estado: ei.estado, nota: ei.nota, iniciadoAt: ei.iniciadoAt, terminadoAt: ei.terminadoAt })
    .from(ei).where(eq(ei.userId, userId)).orderBy(desc(ei.iniciadoAt), asc(ei.nivel)).limit(50);

export const notasBloques = (i: Intento): Record<Bloque, number> => ({
  lectura: i.notaLectura ?? 0, listening: i.notaListening ?? 0, vocabulario: i.notaVocabulario ?? 0, gramatica: i.notaGramatica ?? 0,
});
