import { describe, it, expect } from 'vitest';
import { endpointDeUrl, comprobarEndpoint } from './neon-endpoint';

const directa = 'postgres://u:secreto@ep-cool-sun-123456.us-east-2.aws.neon.tech/db?sslmode=verify-full';
const pooled = 'postgres://u:secreto@ep-cool-sun-123456-pooler.us-east-2.aws.neon.tech/db?sslmode=verify-full';

describe('endpointDeUrl', () => {
  it('extrae el endpoint y trata igual la URL directa y la del pooler', () => {
    expect(endpointDeUrl(directa)).toBe('ep-cool-sun-123456');
    expect(endpointDeUrl(pooled)).toBe('ep-cool-sun-123456');
  });
  it('rechaza una URL inválida o que no es de Neon sin filtrar el valor', () => {
    expect(() => endpointDeUrl('no es una url con secreto')).toThrow(/no válida/);
    try { endpointDeUrl('no es una url con secreto'); } catch (e) { expect(String(e)).not.toContain('secreto'); }
    expect(() => endpointDeUrl('postgres://u:p@db.example.com/x')).toThrow(/Neon/);
  });
});

describe('comprobarEndpoint', () => {
  it('ok cuando coincide (acepta el host completo o solo el endpoint como esperado)', () => {
    expect(comprobarEndpoint(directa, 'ep-cool-sun-123456').ok).toBe(true);
    expect(comprobarEndpoint(pooled, 'ep-cool-sun-123456.us-east-2.aws.neon.tech').ok).toBe(true);
    expect(comprobarEndpoint(pooled, 'ep-cool-sun-123456-pooler.us-east-2.aws.neon.tech').ok).toBe(true);
  });
  it('falla si es otra rama de Neon', () => {
    const r = comprobarEndpoint(directa, 'ep-otra-rama-999999');
    expect(r.ok).toBe(false);
  });
  it('falla si no hay valor esperado configurado', () => {
    expect(comprobarEndpoint(directa, '').ok).toBe(false);
    expect(comprobarEndpoint(directa, undefined).motivo).toMatch(/NEON_ENDPOINT_ESPERADO/);
  });
  it('el motivo nunca contiene la URL ni la contraseña', () => {
    for (const esperado of ['', 'ep-x-1']) {
      const m = comprobarEndpoint(directa, esperado).motivo ?? '';
      expect(m).not.toContain('secreto');
      expect(m).not.toContain('ep-cool-sun-123456');
    }
  });
});
