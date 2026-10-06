import { describe, it, expect } from 'vitest';
import { validatePasswordPolicy, hashPassword, verifyPassword } from './password';

describe('validatePasswordPolicy', () => {
  it('rechaza menos de 12 caracteres', () => {
    expect(validatePasswordPolicy('a'.repeat(11))).toEqual({ ok: false, error: 'muy_corta' });
  });
  it('acepta 12 caracteres sin reglas de composición', () => {
    expect(validatePasswordPolicy('aaaaaaaaaaaa')).toEqual({ ok: true });
  });
  it('rechaza más de 128 caracteres (evita DoS del hash)', () => {
    expect(validatePasswordPolicy('a'.repeat(10_000))).toEqual({ ok: false, error: 'muy_larga' });
  });
  it('cuenta caracteres Unicode, no bytes', () => {
    expect(validatePasswordPolicy('ñ'.repeat(12))).toEqual({ ok: true });
  });
});

describe('hash argon2id', () => {
  it('verifica la contraseña correcta y rechaza otra', async () => {
    const hash = await hashPassword('contraseña-larga-1');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'contraseña-larga-1')).toBe(true);
    expect(await verifyPassword(hash, 'contraseña-larga-2')).toBe(false);
  });
  it('devuelve false con un hash corrupto en vez de lanzar', async () => {
    expect(await verifyPassword('no-es-un-hash', 'x')).toBe(false);
  });
});

describe('verifyPassword robustez', () => {
  it('dos hashes de la misma contraseña difieren (sal aleatoria)', async () => {
    const a = await hashPassword('contraseña-larga-1');
    const b = await hashPassword('contraseña-larga-1');
    expect(a).not.toBe(b);
  });
  it('usa formato PHC argon2id con los parámetros esperados', async () => {
    const h = await hashPassword('contraseña-larga-1');
    expect(h).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
  });
  it('devuelve false con hashes basura o mal formados', async () => {
    for (const bad of ['', '$', '$argon2id$', '$argon2id$v=19$m=19456,t=2,p=1$abc', '$argon2i$v=19$m=19456,t=2,p=1$YWJj$YWJj', '$argon2id$v=16$m=19456,t=2,p=1$YWJj$YWJj', '$argon2id$v=19$m=x,t=2,p=1$YWJj$YWJj']) {
      expect(await verifyPassword(bad, 'contraseña-larga-1')).toBe(false);
    }
  });
  it('rechaza parámetros manipulados fuera de rango sin calcular', async () => {
    const h = await hashPassword('contraseña-larga-1');
    for (const p of ['m=1048576,t=2,p=1', 'm=19456,t=11,p=1', 'm=19456,t=2,p=5', 'm=19456,t=0,p=1']) {
      const t = h.replace('m=19456,t=2,p=1', p);
      expect(await verifyPassword(t, 'contraseña-larga-1')).toBe(false);
    }
  });
  it('rechaza un hash con longitud distinta', async () => {
    const h = await hashPassword('contraseña-larga-1');
    expect(await verifyPassword(h.slice(0, -4), 'contraseña-larga-1')).toBe(false);
  });
});
