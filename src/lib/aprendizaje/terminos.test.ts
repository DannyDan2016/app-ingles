import { describe, it, expect } from 'vitest';
import { normalizarTermino } from './terminos';

describe('normalizarTermino', () => {
  it.each([
    ['Tested,', 'tested'], ['  API ', 'api'], ['Don’t', "don't"], ['test  case', 'test case'], ['«bug».', 'bug'],
  ])('%s → %s', (entrada, salida) => expect(normalizarTermino(entrada)).toBe(salida));
  it.each(['', '   ', '!!!', 'x'.repeat(41)])('rechaza %j', (s) => expect(normalizarTermino(s)).toBeNull());
});
