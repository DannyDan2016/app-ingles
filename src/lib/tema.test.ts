import { describe, it, expect } from 'vitest';
import { temaDesdeCookie, dataThemeDe } from './tema';

describe('tema', () => {
  it('valores válidos', () => {
    expect(temaDesdeCookie('oscuro')).toBe('oscuro');
    expect(temaDesdeCookie('claro')).toBe('claro');
  });
  it('desconocido o ausente → sistema', () => {
    expect(temaDesdeCookie(undefined)).toBe('sistema');
    expect(temaDesdeCookie('<script>')).toBe('sistema');
  });
  it('data-theme', () => {
    expect(dataThemeDe('claro')).toBe('light');
    expect(dataThemeDe('oscuro')).toBe('dark');
    expect(dataThemeDe('sistema')).toBeUndefined();
  });
});
