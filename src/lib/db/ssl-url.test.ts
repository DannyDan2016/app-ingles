import { describe, it, expect } from 'vitest';
import { enforceSslUrl } from './ssl-url';
import { LOCAL_URL_HOSTS } from '@/lib/net/local-host';

const mode = (u: string) => new URL(u).searchParams.get('sslmode');

describe('enforceSslUrl', () => {
  it.each(LOCAL_URL_HOSTS.flatMap((h) => [`postgres://u:p@${h}:5432/d`, `postgres://u:p@${h}:5432/d?sslmode=disable`]))(
    'deja igual el host local %s',
    (u) => expect(enforceSslUrl(u)).toBe(u),
  );
  it.each(['postgres', '2130706433', 'db.example.com'])('trata %s como remoto: fuerza verify-full y rechaza disable', (h) => {
    expect(mode(enforceSslUrl(`postgres://u:p@${h}:5432/d`))).toBe('verify-full');
    expect(() => enforceSslUrl(`postgres://u:p@${h}:5432/d?sslmode=disable`)).toThrow(/disable/);
  });

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
