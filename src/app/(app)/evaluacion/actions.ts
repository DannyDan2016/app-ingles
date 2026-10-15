'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { getEvaluacion } from '@/lib/contenido/catalogo';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { finalizar, iniciarIntento, responder } from '@/lib/evaluacion/servicio';
import { respuestaSchema } from '@/lib/evaluacion/respuesta';
import { getIntento, marcarRefuerzo } from '@/lib/evaluacion/evaluacion.repo';

const intentoSchema = z.object({ intentoId: z.uuid() });

export async function iniciarEvaluacionAction(form: FormData) {
  const u = await requireUser();
  const nivel = form.get('nivel');
  if (!u.nivelInicial || !isNivel(nivel)) redirect('/camino');
  const db = getDb();
  const ctx = await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  if (ctx.elegibilidad.tipo === 'puede' && ctx.banco) await iniciarIntento(db, u.userId, ctx.banco);
  redirect(`/evaluacion/${nivel}`);
}

export async function guardarRespuestaAction(input: { intentoId: string; preguntaId: string; respuesta: RespuestaUsuario }) {
  const u = await requireUser();
  const p = intentoSchema.extend({ preguntaId: z.string().max(80), respuesta: respuestaSchema }).safeParse(input);
  if (!p.success) return { ok: false };
  if (JSON.stringify(p.data.respuesta).length > 500) return { ok: false };
  const db = getDb();
  const i = await getIntento(db, u.userId, p.data.intentoId);
  const banco = i ? getEvaluacion(i.nivel) : undefined;
  if (!banco) return { ok: false };
  return { ok: await responder(db, u.userId, banco, p.data.intentoId, p.data.preguntaId, p.data.respuesta, new Date()) };
}

export async function finalizarEvaluacionAction(input: { intentoId: string }) {
  const u = await requireUser();
  const p = intentoSchema.safeParse(input);
  if (!p.success) return { ok: false as const, motivo: 'no_existe' as const };
  const db = getDb();
  const i = await getIntento(db, u.userId, p.data.intentoId);
  const banco = i ? getEvaluacion(i.nivel) : undefined;
  if (!banco) return { ok: false as const, motivo: 'no_existe' as const };
  return finalizar(db, u.userId, banco, p.data.intentoId, new Date());
}

export async function completarRefuerzoAction(input: { intentoId: string }) {
  const u = await requireUser();
  const p = intentoSchema.safeParse(input);
  if (!p.success) return { ok: false };
  await marcarRefuerzo(getDb(), u.userId, p.data.intentoId, new Date());
  return { ok: true };
}
