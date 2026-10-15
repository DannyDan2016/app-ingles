// Colombia no tiene horario de verano desde 1993: UTC-5 fijo.
const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });

export const diaBogota = (d: Date): string => FMT.format(d);
export const inicioDia = (dia: string): Date => new Date(`${dia}T00:00:00.000-05:00`);
export const finDia = (dia: string): Date => new Date(`${dia}T23:59:59.999-05:00`);
export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function lunesDe(dia: string): string {
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return sumarDias(dia, -((dow + 6) % 7));
}

const FMT_HORA = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
/** «15 oct, 10:30 a. m.» en hora de Bogotá. */
export const formatoFechaHora = (d: Date): string => FMT_HORA.format(d);
