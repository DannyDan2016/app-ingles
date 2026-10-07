export type Paso = 'pasada-1' | 'pasada-2' | 'pasada-3' | 'preguntas' | 'hecho';

export const PASADAS = [
  { n: 1, nombre: 'Escucha global', velocidad: 1, ayuda: false },
  { n: 2, nombre: 'Con palabras clave', velocidad: 0.75, ayuda: true },
  { n: 3, nombre: 'Sin ayuda', velocidad: 1, ayuda: false },
] as const;

const SIGUIENTE: Record<Paso, Paso> = {
  'pasada-1': 'pasada-2',
  'pasada-2': 'pasada-3',
  'pasada-3': 'preguntas',
  preguntas: 'hecho',
  hecho: 'hecho',
};

export const siguientePaso = (paso: Paso): Paso => SIGUIENTE[paso];
