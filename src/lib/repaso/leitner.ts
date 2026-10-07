import { sumarDias } from '@/lib/tiempo/bogota';

export const INTERVALOS_DIAS = [1, 3, 7, 14, 30] as const;
export const MAX_SESION = 20;
export type Caja = 1 | 2 | 3 | 4 | 5;
export function siguienteEstado(caja: Caja, sabia: boolean, hoy: string): { caja: Caja; proximaDia: string } {
  const nueva = (sabia ? Math.min(5, caja + 1) : 1) as Caja;
  return { caja: nueva, proximaDia: sumarDias(hoy, INTERVALOS_DIAS[nueva - 1]) };
}
