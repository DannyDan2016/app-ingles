import { describe, it, expect } from 'vitest';
import { generarIcs } from './ics';
import { parsearParametros } from './parametros';

const r = { dias: ['L', 'M', 'X', 'J', 'V'] as const, hora: '19:00', minutos: 20 };
// Jueves 15 oct 2026, 12:00 en Bogotá
const ahora = new Date('2026-10-15T17:00:00Z');

describe('generarIcs', () => {
  const ics = generarIcs({ ...r, dias: [...r.dias] }, { appUrl: 'https://app.test', ahora, uid: 'u1@app-ingles' });

  it('evento semanal L–V a las 19:00, 20 min, alarma a la hora', () => {
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\n');
    expect(ics).toContain('DTSTART:20261015T190000\r\n'); // flotante: sin Z ni TZID
    expect(ics).toContain('DURATION:PT20M\r\n');
    expect(ics).toContain('TRIGGER:PT0M\r\n');
    expect(ics).toContain('URL:https://app.test/hoy\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('ninguna línea supera 75 octetos y el plegado no rompe UTF-8', () => {
    const largo = generarIcs({ ...r, dias: [...r.dias], minutos: 120 }, { appUrl: 'https://app.test/' + 'á'.repeat(80), ahora });
    for (const linea of largo.split('\r\n')) expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    const desplegado = largo.replace(/\r\n /g, '');
    expect(desplegado).toContain('https://app.test/' + 'á'.repeat(80) + '/hoy');
  });
});

describe('parsearParametros', () => {
  it('acepta dias, hora y min válidos', () => {
    const p = parsearParametros(new URLSearchParams('dias=L,M,X,J,V&hora=19:00&min=20'));
    expect(p).toEqual({ ok: true, valor: { dias: ['L', 'M', 'X', 'J', 'V'], hora: '19:00', minutos: 20 } });
  });
  it('@seguridad rechaza saltos de línea inyectados', () => {
    expect(parsearParametros(new URLSearchParams('dias=L\r\nBEGIN:VEVENT&hora=19:00&min=20')).ok).toBe(false);
    expect(parsearParametros(new URLSearchParams('dias=L&hora=19:00\r\nX:1&min=20')).ok).toBe(false);
  });
});
