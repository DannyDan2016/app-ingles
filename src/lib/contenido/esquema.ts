import { z } from 'zod';

export const NIVELES_CONTENIDO = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const TEMAS = ['ia', 'qa', 'backend', 'frontend'] as const;
const nivel = z.enum(NIVELES_CONTENIDO);
const tema = z.enum(TEMAS);
/** Forma base: minúsculas, letras/números, espacios, guion y apóstrofo recto (p. ej. «test case», «don't»). */
export const terminoSchema = z.string().regex(/^[a-z0-9][a-z0-9 '\-]{0,39}$/, 'término en minúsculas (máx. 40)');
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)+$/, 'id en minúsculas con guiones');
const texto = z.string().trim().min(1);

export const videoSchema = z.object({
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtubeId de 11 caracteres'),
  start: z.number().int().min(0),
  end: z.number().int().min(1),
  titulo: texto,
  canal: texto,
});

const comun = { id, enunciado: texto, explicacion: texto, terminos: z.array(terminoSchema).optional() };
export const ejercicioSchema = z.discriminatedUnion('tipo', [
  z.object({ ...comun, tipo: z.literal('opcion_multiple'), opciones: z.array(texto).min(2).max(4), correcta: z.number().int().min(0) }),
  z.object({ ...comun, tipo: z.literal('completar'), texto, respuesta: texto, aceptadas: z.array(texto).optional() }),
  z.object({ ...comun, tipo: z.literal('ordenar'), piezas: z.array(texto).min(2).max(8) }),
  z.object({ ...comun, tipo: z.literal('emparejar'), pares: z.array(z.object({ a: texto, b: texto })).min(3).max(5) }),
  z.object({ ...comun, tipo: z.literal('verdadero_falso'), afirmacion: texto, correcta: z.boolean() }),
]);

export const leccionSchema = z.object({
  tipo: z.literal('leccion'), id, nivel, tema, orden: z.number().int().min(0),
  titulo: texto, objetivo: texto, gramatica: texto, lectura: texto,
  video: videoSchema.optional(),
  terminos: z.array(terminoSchema).min(1),
  ejercicios: z.array(ejercicioSchema).min(5).max(8),
  revisado: z.boolean(),
});

export const tramoSchema = z.object({
  tipo: z.literal('tramo'), id, nivel, tema, orden: z.number().int().min(0),
  fuente: videoSchema.extend({ podcast: texto }),
  preguntaGuia: texto,
  palabrasClave: z.array(terminoSchema).min(1),
  preguntas: z.array(ejercicioSchema).min(3).max(5),
  revisado: z.boolean(),
});

export const entradaGlosarioSchema = z.object({
  termino: terminoSchema,
  categoria: z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase']),
  traduccion_es: texto, definicion_en: texto, ejemplo_en: texto, nivel, tema,
});
export const glosarioSchema = z.object({ tipo: z.literal('glosario'), nivel, tema, entradas: z.array(entradaGlosarioSchema).min(1) });

export const archivoSchema = z.discriminatedUnion('tipo', [leccionSchema, tramoSchema, glosarioSchema]);

export type Nivel = z.infer<typeof nivel>;
export type Tema = z.infer<typeof tema>;
export type Video = z.infer<typeof videoSchema>;
export type Ejercicio = z.infer<typeof ejercicioSchema>;
export type Leccion = z.infer<typeof leccionSchema>;
export type Tramo = z.infer<typeof tramoSchema>;
export type EntradaGlosario = z.infer<typeof entradaGlosarioSchema>;
export type Catalogo = { lecciones: Leccion[]; tramos: Tramo[]; glosario: EntradaGlosario[] };
