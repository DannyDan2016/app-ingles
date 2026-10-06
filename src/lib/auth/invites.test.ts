import { describe, it, expect } from 'vitest';
import { evaluateInvite } from './invites';

const now = new Date('2026-10-10T12:00:00Z');
const base = { expiraAt: new Date('2026-10-11T00:00:00Z'), usadoAt: null, revocadoAt: null };

describe('evaluateInvite', () => {
  it('inexistente', () => expect(evaluateInvite(null, now)).toBe('inexistente'));
  it('valida', () => expect(evaluateInvite(base, now)).toBe('valida'));
  it('caducada en el instante exacto de expiración', () =>
    expect(evaluateInvite({ ...base, expiraAt: now }, now)).toBe('caducada'));
  it('usada gana sobre caducada', () =>
    expect(evaluateInvite({ ...base, expiraAt: new Date(0), usadoAt: new Date(0) }, now)).toBe('usada'));
  it('revocada gana sobre todo', () =>
    expect(evaluateInvite({ ...base, usadoAt: new Date(0), revocadoAt: new Date(0) }, now)).toBe('revocada'));
});
