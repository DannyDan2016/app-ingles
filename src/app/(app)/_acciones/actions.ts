'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { getEjercicio, getItem, getLeccion, caminoDeNivel } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { NIVELES } from '@/lib/progreso/niveles';
import { registrarRespuesta, registrarRespuestaConTarjetas } from '@/lib/aprendizaje/respuestas.repo';
import { agregarTarjetas } from '@/lib/aprendizaje/tarjetas.repo';
import { completarItem, itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { normalizarTermino } from '@/lib/aprendizaje/terminos';

const idSchema = z.string().max(80);

export async function registrarRespuestaAction(input: { ejercicioId: string; correcta: boolean }) {
  const u = await requireUser();
  const p = z.object({ ejercicioId: idSchema, correcta: z.boolean() }).safeParse(input);
  const ref = p.success ? getEjercicio(p.data.ejercicioId) : undefined;
  if (!p.success || !ref) return { ok: false as const };
  const db = getDb();
  const origen = getLeccion(ref.padreId) ? 'leccion' : 'tramo';
  const respuesta = { userId: u.userId, itemId: p.data.ejercicioId, correcta: p.data.correcta, origen } as const;
  const terminos = !p.data.correcta ? ref.ejercicio.terminos ?? [] : [];
  // Atómico: un reintento tras un fallo parcial no duplica la fila de respuestas.
  if (terminos.length) await registrarRespuestaConTarjetas(db, respuesta, { nivel: ref.nivel, terminos, now: new Date() });
  else await registrarRespuesta(db, respuesta);
  return { ok: true as const };
}

export async function completarItemAction(input: { itemId: string }) {
  const u = await requireUser();
  const p = z.object({ itemId: idSchema }).safeParse(input);
  const item = p.success ? getItem(p.data.itemId) : undefined;
  if (!item) return { ok: false as const, motivo: 'no_existe' as const };
  const db = getDb();
  const estado = estadoCamino(caminoDeNivel(item.nivel), await itemsCompletados(db, u.userId, item.nivel))
    .items.find((i) => i.id === item.id)?.estado;
  if (estado === 'bloqueado') return { ok: false as const, motivo: 'bloqueado' as const };
  const r = await completarItem(db, u.userId, item.nivel, item.id);
  const leccion = getLeccion(item.id);
  // Siempre (idempotente): si un intento previo falló tras el insert, se autocorrige.
  if (leccion) await agregarTarjetas(db, u.userId, item.nivel, leccion.terminos, new Date());
  return { ok: true as const, nuevo: r === 'nuevo' };
}

export async function guardarTerminoAction(input: { termino: string; nivel: string }) {
  const u = await requireUser();
  const p = z.object({ termino: z.string().max(60), nivel: z.enum(NIVELES) }).safeParse(input);
  const termino = p.success ? normalizarTermino(p.data.termino) : null;
  if (!p.success || !termino) return { ok: false as const };
  const n = await agregarTarjetas(getDb(), u.userId, p.data.nivel, [termino], new Date());
  return { ok: true as const, nuevo: n > 0 };
}
