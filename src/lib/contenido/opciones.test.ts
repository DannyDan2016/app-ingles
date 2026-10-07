import { describe, it, expect } from 'vitest';
import { opcionesCompilacion } from './opciones';

describe('opcionesCompilacion', () => {
  it('por defecto: sin demo y no estricto', () => expect(opcionesCompilacion({})).toEqual({ incluirDemo: false, estricto: false }));
  it('CONTENT_DEMO=1 incluye la demo', () => expect(opcionesCompilacion({ CONTENT_DEMO: '1' }).incluirDemo).toBe(true));
  it('build de Vercel es estricto', () => expect(opcionesCompilacion({ VERCEL: '1' }).estricto).toBe(true));
  it('CONTENIDO_ESTRICTO=1 es estricto', () => expect(opcionesCompilacion({ CONTENIDO_ESTRICTO: '1' }).estricto).toBe(true));
  it('la demo nunca entra en un build de Vercel', () => {
    expect(() => opcionesCompilacion({ VERCEL: '1', CONTENT_DEMO: '1' })).toThrow(/demo.*Vercel/);
  });
});
