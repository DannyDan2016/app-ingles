import { diaBogota, sumarDias } from '@/lib/tiempo/bogota';
import { DIAS, type Dia, type Recordatorio } from './parametros';

export const NOMBRE_ICS = 'recordatorio-ingles.ics';
const BYDAY: Record<Dia, string> = { L: 'MO', M: 'TU', X: 'WE', J: 'TH', V: 'FR', S: 'SA', D: 'SU' };

const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 §3.1: líneas de ≤ 75 octetos; la continuación empieza por un espacio. No parte caracteres UTF-8. */
function plegar(linea: string): string {
  const enc = new TextEncoder();
  const partes: string[] = [];
  let actual = '';
  let limite = 75;
  for (const ch of linea) {
    if (enc.encode(actual + ch).length > limite) {
      partes.push(actual);
      actual = ch;
      limite = 74; // el espacio inicial ocupa 1 octeto
    } else actual += ch;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Primera fecha (desde hoy en Bogotá, incluido) que cae en uno de los días elegidos. */
function primeraFecha(dias: Dia[], ahora: Date): string {
  const hoy = diaBogota(ahora);
  for (let i = 0; i < 7; i++) {
    const f = sumarDias(hoy, i);
    const dow = new Date(`${f}T12:00:00Z`).getUTCDay(); // 0 = domingo
    if (dias.includes(DIAS[(dow + 6) % 7])) return f;
  }
  return hoy;
}

export function generarIcs(r: Recordatorio, { appUrl, ahora, uid = `${crypto.randomUUID()}@app-ingles` }: { appUrl: string; ahora: Date; uid?: string }): string {
  const url = `${appUrl.replace(/\/$/, '')}/hoy`;
  const inicio = `${primeraFecha(r.dias, ahora).replace(/-/g, '')}T${r.hora.replace(':', '')}00`;
  const lineas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//app-ingles//recordatorio//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utc(ahora)}`,
    `DTSTART:${inicio}`,
    `DURATION:PT${r.minutos}M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${r.dias.map((d) => BYDAY[d]).join(',')}`,
    `SUMMARY:${escapar(`Inglés técnico — ${r.minutos} min`)}`,
    `DESCRIPTION:${escapar(`Tu práctica de hoy te espera: ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${escapar('Hora de practicar inglés')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lineas.map(plegar).join('\r\n') + '\r\n';
}
