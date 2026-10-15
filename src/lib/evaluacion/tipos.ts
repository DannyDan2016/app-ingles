import type { Bloque, Recurso } from '@/lib/contenido/esquema';
import type { EjercicioVista } from '@/lib/contenido/vista';

/** Lo que el navegador recibe de cada pregunta del examen (nunca la pregunta completa). */
export type PreguntaExamen = { bloque: Bloque; vista: EjercicioVista; recurso?: Recurso };
export const ETIQUETA_BLOQUE: Record<Bloque, string> = { lectura: 'Lectura', listening: 'Listening', vocabulario: 'Vocabulario', gramatica: 'Gramática' };
