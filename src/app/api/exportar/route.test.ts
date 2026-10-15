import { describe, it, expect, vi, beforeEach } from 'vitest';

const getCurrentUser = vi.fn();
const datosExportacion = vi.fn();
const DB = { marca: 'db' };
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock('@/lib/db/client', () => ({ getDb: () => DB }));
vi.mock('@/lib/exportar/exportar.repo', () => ({ datosExportacion: (...a: unknown[]) => datosExportacion(...a) }));

import { GET } from './route';


beforeEach(() => {
  getCurrentUser.mockReset().mockResolvedValue({ userId: 'u1' });
  datosExportacion.mockReset().mockResolvedValue({
    alias: 'ana', nivelInicial: 'A2', metaDiariaMin: 10, lecciones: [], tarjetas: [], actividad: [], respuestas: [], evaluaciones: [],
  });
});

describe('GET /api/exportar', () => {
  it('sin sesión → 401 y no consulta datos', async () => {
    getCurrentUser.mockResolvedValue(null);
    const r = await GET();
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: 'no_autenticado' });
    expect(datosExportacion).not.toHaveBeenCalled();
  });
  it('con sesión → 200 JSON adjunto, sin caché, solo del usuario autenticado', async () => {
    const r = await GET();
    expect(r.status).toBe(200);
    expect(datosExportacion).toHaveBeenCalledWith(DB, 'u1');
    expect(r.headers.get('content-type')).toContain('application/json');
    expect(r.headers.get('content-disposition')).toMatch(/^attachment; filename="progreso-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(r.headers.get('cache-control')).toBe('no-store');
    expect(r.headers.get('x-content-type-options')).toBe('nosniff');
    const cuerpo = await r.json();
    expect(cuerpo.version).toBe(1);
    expect(cuerpo.perfil.alias).toBe('ana');
  });
  it('usuario que ya no existe → 401', async () => {
    datosExportacion.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
});
