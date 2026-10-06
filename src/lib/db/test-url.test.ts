import { describe, it, expect } from 'vitest';
import { testDatabaseUrl } from './test-url';

describe('testDatabaseUrl', () => {
  it('falla si DATABASE_URL_TEST no está definida', () => {
    expect(() => testDatabaseUrl({})).toThrow(/DATABASE_URL_TEST/);
  });

  it('falla si la BD no acaba en _test', () => {
    expect(() => testDatabaseUrl({ DATABASE_URL_TEST: 'postgres://app:x@db.example.test:5432/app_ingles' })).toThrow(/_test/);
  });

  it('falla si el nombre tiene caracteres no permitidos', () => {
    expect(() => testDatabaseUrl({ DATABASE_URL_TEST: 'postgres://app:x@db.example.test:5432/a-b";x_test' })).toThrow();
  });

  it('devuelve la URL válida', () => {
    const url = 'postgres://app:x@db.example.test:5432/app_ingles_test';
    expect(testDatabaseUrl({ DATABASE_URL_TEST: url })).toBe(url);
  });
});
