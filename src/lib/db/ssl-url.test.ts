import { describe, it, expect } from 'vitest';
import { enforceSslUrl } from './ssl-url';

const mode = (u: string) => new URL(u).searchParams.get('sslmode');

describe('enforceSslUrl', () => {
  it.each([
    'postgres://u:p@localhost:5432/d',
    'postgres://u:p@127.0.0.1:5432/d?sslmode=disable',
    'postgres://u:p@[::1]:5432/d',
    'postgres://u:p@db:5432/d',
    'postgres://u:p@db:5432/d?sslmode=disable',
  ])('deja igual el host local %s', (u) => expect(enforceSslUrl(u)).toBe(u));

  const remoto = 'postgres://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/d';
  it('añade verify-full si falta', () => expect(mode(enforceSslUrl(remoto))).toBe('verify-full'));
  it.each(['require', 'prefer', 'allow', 'verify-ca'])('convierte %s en verify-full', (m) =>
    expect(mode(enforceSslUrl(`${remoto}?sslmode=${m}`))).toBe('verify-full'));
  it('mantiene verify-full y el resto de parámetros', () => {
    const out = enforceSslUrl(`${remoto}?sslmode=verify-full&channel_binding=require`);
    expect(mode(out)).toBe('verify-full');
    expect(new URL(out).searchParams.get('channel_binding')).toBe('require');
  });
  it('lanza error con disable en host remoto', () => {
    expect(() => enforceSslUrl(`${remoto}?sslmode=disable`)).toThrow(/disable/);
  });
  it('no filtra la contraseña en los errores', () => {
    expect(() => enforceSslUrl('no es una url con secreto-xyz')).toThrow();
    try { enforceSslUrl('no es una url con secreto-xyz'); } catch (e) { expect(String(e)).not.toContain('secreto-xyz'); }
  });
});
