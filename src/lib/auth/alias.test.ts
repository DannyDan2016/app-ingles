import { describe, it, expect } from 'vitest';
import { normalizeAlias } from './alias';

describe('normalizeAlias', () => {
  it('pasa a minúsculas y recorta espacios', () => {
    expect(normalizeAlias('  Danny_QA ')).toEqual({ ok: true, alias: 'danny_qa' });
  });
  it.each(['ab', 'a'.repeat(21), 'con espacio', 'ñandú', 'a-b', ''])('rechaza "%s"', (raw) => {
    expect(normalizeAlias(raw)).toEqual({ ok: false, error: 'alias_invalido' });
  });
});
