import { describe, it, expect } from 'vitest';
import { drizzleDbUrl } from './drizzle-url';

const url = 'postgres://u:p@ep-x.eu-central-1.aws.neon.tech/d';

describe('drizzleDbUrl', () => {
  it('generate no necesita BD: sin DATABASE_URL devuelve cadena vacía', () => {
    expect(drizzleDbUrl(['node', 'drizzle-kit', 'generate'], {})).toBe('');
  });
  it.each(['migrate', 'push', 'pull', 'studio'])('%s sin DATABASE_URL da un error claro', (cmd) => {
    expect(() => drizzleDbUrl(['node', 'drizzle-kit', cmd], {})).toThrow(/DATABASE_URL/);
  });
  it('un comando desconocido o ausente también exige la URL (más seguro)', () => {
    expect(() => drizzleDbUrl(['node', 'drizzle-kit'], {})).toThrow(/DATABASE_URL/);
  });
  it('con DATABASE_URL la normaliza (verify-full en remoto), sea cual sea el comando', () => {
    expect(new URL(drizzleDbUrl(['node', 'drizzle-kit', 'migrate'], { DATABASE_URL: url })).searchParams.get('sslmode')).toBe('verify-full');
    expect(drizzleDbUrl(['node', 'drizzle-kit', 'generate'], { DATABASE_URL: url })).toContain('verify-full');
  });
  it('el error no incluye la URL', () => {
    expect(() => drizzleDbUrl(['x', 'y', 'migrate'], { DATABASE_URL: 'no es url con secreto-xyz' })).toThrow();
    try { drizzleDbUrl(['x', 'y', 'migrate'], { DATABASE_URL: 'no es url con secreto-xyz' }); } catch (e) { expect(String(e)).not.toContain('secreto-xyz'); }
  });
});
