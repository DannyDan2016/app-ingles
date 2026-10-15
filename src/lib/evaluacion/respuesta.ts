import { z } from 'zod';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

const corto = z.string().max(200);
export const respuestaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('opcion_multiple'), indice: z.number().int().min(0).max(3) }),
  z.object({ tipo: z.literal('completar'), texto: corto }),
  z.object({ tipo: z.literal('ordenar'), orden: z.array(corto).max(8) }),
  z.object({ tipo: z.literal('emparejar'), asignacion: z.record(corto, corto) }),
  z.object({ tipo: z.literal('verdadero_falso'), valor: z.boolean() }),
]);

export function parsearRespuesta(json: string): RespuestaUsuario | null {
  try {
    const r = respuestaSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
