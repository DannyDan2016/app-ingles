import { describe, it, expect } from 'vitest';
import { mismoOrigen, origenesPropios } from './origen';
const P = 'https://app-ingles-mauve.vercel.app';
describe('mismoOrigen', () => {
  it('Origin igual → sí', () => expect(mismoOrigen(P, null, P)).toBe(true));
  it('Origin distinto → no', () => expect(mismoOrigen('https://evil.example', 'cross-site', P)).toBe(false));
  it('sin Origin, Sec-Fetch-Site same-origin → sí (sendBeacon en algunos navegadores)', () => expect(mismoOrigen(null, 'same-origin', P)).toBe(true));
  it('sin Origin ni Sec-Fetch-Site → no', () => expect(mismoOrigen(null, null, P)).toBe(false));
  it('Origin "null" → no', () => expect(mismoOrigen('null', 'same-origin', P)).toBe(false));
});

describe('origenesPropios', () => {
  const h = (o: Record<string, string>) => new Headers(o);
  it('incluye nextUrl.origin siempre', () => expect(origenesPropios(h({}), 'https://a.example')).toEqual(['https://a.example']));
  it('Docker: Host web:3000 con nextUrl 0.0.0.0 → añade http://web:3000', () =>
    expect(origenesPropios(h({ host: 'web:3000' }), 'http://0.0.0.0:3000')).toEqual(['http://0.0.0.0:3000', 'http://web:3000']));
  it('x-forwarded-host y x-forwarded-proto (primer valor) mandan sobre Host', () =>
    expect(origenesPropios(h({ host: 'interno:3000', 'x-forwarded-host': 'app.example, otro', 'x-forwarded-proto': 'https, http' }), 'http://0.0.0.0:3000'))
      .toContain('https://app.example'));
  it('protocolo no http/https se ignora', () =>
    expect(origenesPropios(h({ host: 'a.example', 'x-forwarded-proto': 'javascript' }), 'https://x.example')).toEqual(['https://x.example']));
  it('host inválido se ignora', () =>
    expect(origenesPropios(h({ host: 'a b' }), 'https://x.example')).toEqual(['https://x.example']));
  it('APP_URL normalizada (sin barra final)', () =>
    expect(origenesPropios(h({}), 'https://x.example', 'https://publico.example/')).toContain('https://publico.example'));
});
