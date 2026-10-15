import type { Db } from '@/lib/db/client';
import type { Evaluacion, Pregunta } from '@/lib/contenido/esquema';
import { corregir, type RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import * as repo from './evaluacion.repo';
import { aleatorio, seleccionarPreguntas } from './seleccionar';
import { calcularNota } from './nota';
import { caducado } from './elegibilidad';
import { parsearRespuesta } from './respuesta';

export async function iniciarIntento(db: Db, userId: string, banco: Evaluacion, rnd: () => number = aleatorio): Promise<string> {
  const anterior = await repo.ultimoTerminado(db, userId, banco.nivel);
  return repo.crearIntento(db, { userId, nivel: banco.nivel, preguntas: seleccionarPreguntas(banco.preguntas, anterior?.preguntas ?? [], rnd) });
}

export async function responder(db: Db, userId: string, banco: Evaluacion, intentoId: string, preguntaId: string, respuesta: RespuestaUsuario, ahora: Date): Promise<boolean> {
  const i = await repo.getIntento(db, userId, intentoId);
  if (!i || i.nivel !== banco.nivel || i.estado !== 'en_curso' || caducado(i, ahora) || !i.preguntas.includes(preguntaId)) return false;
  await repo.guardarRespuesta(db, intentoId, preguntaId, JSON.stringify(respuesta));
  return true;
}

export async function finalizar(db: Db, userId: string, banco: Evaluacion, intentoId: string, ahora: Date)
  : Promise<{ ok: true; intentoId: string } | { ok: false; motivo: 'no_existe' | 'incompleto' | 'caducado' }> {
  const i = await repo.getIntento(db, userId, intentoId);
  if (!i || i.nivel !== banco.nivel) return { ok: false, motivo: 'no_existe' };
  if (i.estado === 'aprobado' || i.estado === 'suspendido') return { ok: true, intentoId: i.id };
  const porId = new Map(banco.preguntas.map((p) => [p.id, p]));
  const preguntas = i.preguntas.map((id) => porId.get(id));
  if (i.estado === 'caducado' || caducado(i, ahora) || preguntas.some((p) => !p)) {
    await repo.marcarCaducado(db, i.id);
    return { ok: false, motivo: 'caducado' };
  }
  const resp = await repo.respuestasDe(db, i.id);
  if (i.preguntas.some((id) => !resp.has(id))) return { ok: false, motivo: 'incompleto' };
  const ps = preguntas as Pregunta[];
  const aciertos = new Set(ps.filter((p) => { const r = parsearRespuesta(resp.get(p.id)!); return r !== null && corregir(p, r); }).map((p) => p.id));
  const n = calcularNota(ps, aciertos);
  await repo.cerrarIntento(db, i.id, { estado: n.aprobado ? 'aprobado' : 'suspendido', nota: n.nota, bloques: n.bloques, ahora });
  return { ok: true, intentoId: i.id };
}
