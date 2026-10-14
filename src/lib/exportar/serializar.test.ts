import { describe, it, expect } from 'vitest';
import { serializarProgreso, nombreArchivo, VERSION_EXPORTACION, type DatosExportacion } from './serializar';

const BASE: DatosExportacion = {
  alias: 'ana',
  nivelInicial: 'A2',
  metaDiariaMin: 10,
  lecciones: [{ leccionId: 'api-rest', nivel: 'A2', completadaAt: new Date('2026-10-07T03:30:00Z') }],
  tarjetas: [{ termino: 'endpoint', nivel: 'A2', caja: 3, proximaAt: new Date('2026-10-10T12:00:00Z'), aciertos: 2, fallos: 1 }],
  actividad: [{ fecha: '2026-10-07', segundos: 300 }],
  respuestas: [{ origen: 'repaso', total: 4, correctas: 3 }],
};
const AHORA = new Date('2026-10-08T03:00:00Z'); // 2026-10-07 22:00 en Bogotá

describe('serializarProgreso', () => {
  it('incluye versión, fecha de exportación en Bogotá y los datos del perfil', () => {
    const r = serializarProgreso(BASE, AHORA);
    expect(r.version).toBe(VERSION_EXPORTACION);
    expect(r.exportadoEn).toBe('2026-10-07');
    expect(r.perfil).toEqual({ alias: 'ana', nivelInicial: 'A2', metaDiariaMin: 10 });
  });
  it('fechas en zona America/Bogota (una lección a las 03:30Z cae el día anterior)', () => {
    const r = serializarProgreso(BASE, AHORA);
    expect(r.lecciones[0]).toEqual({ leccionId: 'api-rest', nivel: 'A2', completadaEn: '2026-10-06' });
    expect(r.tarjetas[0]).toMatchObject({ termino: 'endpoint', caja: 3, proximaRevision: '2026-10-10' });
  });
  it('respuestas agregadas', () => {
    const r = serializarProgreso(BASE, AHORA);
    expect(r.respuestas).toEqual([{ origen: 'repaso', total: 4, correctas: 3 }]);
  });
  it('no filtra datos sensibles aunque la entrada traiga campos extra', () => {
    const sucio = {
      ...BASE, passwordHash: '$argon2id$secreto', id: 'uuid-1', userId: 'uuid-1', idHash: 'abc', token: 'tok',
      lecciones: [{ ...BASE.lecciones[0], userId: 'uuid-1' }],
    } as unknown as DatosExportacion;
    const texto = JSON.stringify(serializarProgreso(sucio, AHORA));
    for (const prohibido of ['argon2', 'secreto', 'uuid-1', 'passwordHash', 'userId', 'idHash', 'token', 'password']) {
      expect(texto).not.toContain(prohibido);
    }
  });
  it('sin datos devuelve listas vacías', () => {
    const r = serializarProgreso({ ...BASE, lecciones: [], tarjetas: [], actividad: [], respuestas: [] }, AHORA);
    expect(r.lecciones).toEqual([]);
    expect(r.actividad).toEqual([]);
  });
});

describe('nombreArchivo', () => {
  it('progreso-AAAA-MM-DD.json con el día de Bogotá', () => {
    expect(nombreArchivo(AHORA)).toBe('progreso-2026-10-07.json');
  });
});
