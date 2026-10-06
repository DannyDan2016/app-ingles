import { describe, it, expect } from 'vitest';
import { isBlocked } from './rate-limit';

describe('isBlocked', () => {
  it('4 fallos por alias no bloquea', () => expect(isBlocked({ alias: 4, ip: 4 })).toBe(false));
  it('5 fallos por alias bloquea', () => expect(isBlocked({ alias: 5, ip: 5 })).toBe(true));
  it('20 fallos por IP bloquea aunque cada alias tenga pocos', () => expect(isBlocked({ alias: 1, ip: 20 })).toBe(true));
});
