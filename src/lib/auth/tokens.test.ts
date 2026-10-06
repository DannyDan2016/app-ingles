import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from './tokens';

describe('tokens', () => {
  it('genera 256 bits en base64url (43 chars) y distintos cada vez', () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });
  it('hashToken es SHA-256 hex determinista', () => {
    expect(hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
