import { describe, it, expect } from 'vitest';
import { mismoOrigen } from './origen';
const P = 'https://app-ingles-mauve.vercel.app';
describe('mismoOrigen', () => {
  it('Origin igual → sí', () => expect(mismoOrigen(P, null, P)).toBe(true));
  it('Origin distinto → no', () => expect(mismoOrigen('https://evil.example', 'cross-site', P)).toBe(false));
  it('sin Origin, Sec-Fetch-Site same-origin → sí (sendBeacon en algunos navegadores)', () => expect(mismoOrigen(null, 'same-origin', P)).toBe(true));
  it('sin Origin ni Sec-Fetch-Site → no', () => expect(mismoOrigen(null, null, P)).toBe(false));
  it('Origin "null" → no', () => expect(mismoOrigen('null', 'same-origin', P)).toBe(false));
});
