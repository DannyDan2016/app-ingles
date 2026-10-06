import { describe, it, expect } from 'vitest';
import { loginSchema, registroSchema, nivelSchema, revocarSchema, parseInviteCode, mensajeRegistro } from './schemas';

const CODE = 'A'.repeat(43);

describe('loginSchema', () => {
  it('acepta alias y contraseña de texto', () => {
    expect(loginSchema.safeParse({ alias: 'ana', password: 'x' }).success).toBe(true);
  });
  it('rechaza contraseña de más de 128 caracteres', () => {
    expect(loginSchema.safeParse({ alias: 'ana', password: 'x'.repeat(129) }).success).toBe(false);
  });
  it('rechaza valores que no son texto (p. ej. archivos o null)', () => {
    expect(loginSchema.safeParse({ alias: null, password: 'x' }).success).toBe(false);
    expect(loginSchema.safeParse({ alias: 'a', password: new Blob(['x']) }).success).toBe(false);
  });
});

describe('registroSchema', () => {
  it('acepta un código base64url de 43 caracteres', () => {
    expect(registroSchema.safeParse({ code: CODE, alias: 'ana', password: 'x' }).success).toBe(true);
  });
  it('rechaza códigos mal formados', () => {
    for (const code of ['', 'corto', CODE + 'A', 'A'.repeat(42) + '+', 'A'.repeat(42) + ' ']) {
      expect(registroSchema.safeParse({ code, alias: 'ana', password: 'x' }).success).toBe(false);
    }
  });
});

describe('parseInviteCode', () => {
  it('devuelve el código válido', () => expect(parseInviteCode(CODE)).toBe(CODE));
  it('devuelve null para arrays, undefined o basura', () => {
    expect(parseInviteCode([CODE, CODE])).toBeNull();
    expect(parseInviteCode(undefined)).toBeNull();
    expect(parseInviteCode('basura')).toBeNull();
  });
});

describe('nivelSchema y revocarSchema', () => {
  it('solo acepta niveles CEFR', () => {
    expect(nivelSchema.safeParse('B1').success).toBe(true);
    expect(nivelSchema.safeParse('D1').success).toBe(false);
    expect(nivelSchema.safeParse(null).success).toBe(false);
  });
  it('exige un uuid', () => {
    expect(revocarSchema.safeParse({ id: crypto.randomUUID() }).success).toBe(true);
    expect(revocarSchema.safeParse({ id: 'no-uuid' }).success).toBe(false);
  });
});

describe('mensajeRegistro', () => {
  it('traduce errores conocidos y cae en un mensaje genérico', () => {
    expect(mensajeRegistro('usada')).toBe('Esta invitación ya se usó.');
    expect(mensajeRegistro('algo_raro')).toBe('No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.');
  });
});
