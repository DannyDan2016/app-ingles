import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const getCurrentUser = vi.fn();
const sumarActividad = vi.fn();
const DB = { marca: 'db' };
vi.mock('@/lib/auth/current-user', () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock('@/lib/db/client', () => ({ getDb: () => DB }));
vi.mock('@/lib/aprendizaje/actividad.repo', () => ({ sumarActividad: (...a: unknown[]) => sumarActividad(...a) }));

import { POST } from './route';

const URL_API = 'https://app.example/api/actividad';
const PROPIO = 'https://app.example';
function peticion(cuerpo: unknown, headers: Record<string, string> = { origin: PROPIO }, crudo = false) {
  return new NextRequest(URL_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: crudo ? (cuerpo as string) : JSON.stringify(cuerpo),
  });
}

beforeEach(() => {
  getCurrentUser.mockReset().mockResolvedValue({ userId: 'u1' });
  sumarActividad.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /api/actividad', () => {
  it('Origin ajeno → 403 y no registra', async () => {
    const r = await POST(peticion({ segundos: 30 }, { origin: 'https://evil.example' }));
    expect(r.status).toBe(403);
    expect(sumarActividad).not.toHaveBeenCalled();
  });
  it('mismo Origin sin sesión → 401', async () => {
    getCurrentUser.mockResolvedValue(null);
    const r = await POST(peticion({ segundos: 30 }));
    expect(r.status).toBe(401);
    expect(sumarActividad).not.toHaveBeenCalled();
  });
  it('sin Origin pero Sec-Fetch-Site same-origin y con sesión → 204', async () => {
    const r = await POST(peticion({ segundos: 30 }, { 'sec-fetch-site': 'same-origin' }));
    expect(r.status).toBe(204);
  });
  it('sin Origin ni Sec-Fetch-Site → 403', async () => {
    const r = await POST(peticion({ segundos: 30 }, {}));
    expect(r.status).toBe(403);
  });
  it.each([[{ segundos: 0 }], [{ segundos: 601 }], [{ segundos: 1.5 }], [{}]])('cuerpo %j → 400', async (c) => {
    const r = await POST(peticion(c));
    expect(r.status).toBe(400);
    expect(sumarActividad).not.toHaveBeenCalled();
  });
  it('cuerpo que no es JSON → 400', async () => {
    const r = await POST(peticion('no es json', { origin: PROPIO }, true));
    expect(r.status).toBe(400);
  });
  it('válido → 204 y registra (db, userId, día YYYY-MM-DD, segundos)', async () => {
    const r = await POST(peticion({ segundos: 30 }));
    expect(r.status).toBe(204);
    expect(sumarActividad).toHaveBeenCalledTimes(1);
    expect(sumarActividad).toHaveBeenCalledWith(DB, 'u1', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), 30);
  });
  it('Docker: nextUrl 0.0.0.0, Host web:3000 y Origin http://web:3000 → 204', async () => {
    const r = await POST(new NextRequest('http://0.0.0.0:3000/api/actividad', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'web:3000', origin: 'http://web:3000' },
      body: JSON.stringify({ segundos: 30 }),
    }));
    expect(r.status).toBe(204);
  });
  it('Host evil.example con Origin de otro sitio → 403', async () => {
    const r = await POST(new NextRequest('http://0.0.0.0:3000/api/actividad', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'evil.example', origin: 'https://otro.example' },
      body: JSON.stringify({ segundos: 30 }),
    }));
    expect(r.status).toBe(403);
    expect(sumarActividad).not.toHaveBeenCalled();
  });
  it('APP_URL definida (con barra final) y Origin igual → 204', async () => {
    vi.stubEnv('APP_URL', 'https://publico.example/');
    const r = await POST(peticion({ segundos: 30 }, { origin: 'https://publico.example' }));
    expect(r.status).toBe(204);
  });
});
