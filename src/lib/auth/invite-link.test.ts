import { describe, it, expect } from 'vitest';
import { buildInviteLink, inviteLinkProblem } from './invite-link';
import { LOCAL_URL_HOSTS } from '@/lib/net/local-host';

describe('buildInviteLink', () => {
  it('usa APP_URL si está definida', () => {
    expect(buildInviteLink({ appUrl: 'https://app.example.com', host: 'evil.com', proto: 'http', code: 'abc' }))
      .toBe('https://app.example.com/registro?c=abc');
  });
  it('normaliza la barra final', () => {
    expect(buildInviteLink({ appUrl: 'https://app.example.com/', host: null, proto: null, code: 'abc' }))
      .toBe('https://app.example.com/registro?c=abc');
  });
  it.each(LOCAL_URL_HOSTS)('acepta http en el host local %s', (h) => {
    expect(buildInviteLink({ appUrl: `http://${h}:3000/`, host: null, proto: null, code: 'x' })).toBe(`http://${h}:3000/registro?c=x`);
  });
  it('rechaza http en un host que parece interno pero no está en la allowlist', () => {
    expect(buildInviteLink({ appUrl: 'http://postgres:3000', host: 'h.com', proto: 'https', code: 'x' })).toBeNull();
  });
  it.each(['http://app.example.com', 'ftp://x.com', 'no-es-url', 'https://a.com/ruta'])('rechaza APP_URL inválida %s', (appUrl) => {
    expect(buildInviteLink({ appUrl, host: 'h.com', proto: 'https', code: 'x' })).toBeNull();
  });
  it('sin APP_URL usa Host y x-forwarded-proto', () => {
    expect(buildInviteLink({ appUrl: undefined, host: 'h.com', proto: 'http', code: 'x' })).toBe('http://h.com/registro?c=x');
    expect(buildInviteLink({ appUrl: '', host: 'h.com', proto: null, code: 'x' })).toBe('https://h.com/registro?c=x');
  });
  it('sin APP_URL ni Host devuelve null', () => {
    expect(buildInviteLink({ appUrl: undefined, host: null, proto: null, code: 'x' })).toBeNull();
  });
  it('sin APP_URL solo acepta http/https del primer valor de x-forwarded-proto', () => {
    const f = (proto: string | null) => buildInviteLink({ appUrl: undefined, host: 'h.com', proto, code: 'x' });
    expect(f('https, http')).toBe('https://h.com/registro?c=x');
    expect(f('http, https')).toBe('http://h.com/registro?c=x');
    expect(f(' HTTP ')).toBe('http://h.com/registro?c=x');
    expect(f('javascript')).toBe('https://h.com/registro?c=x');
    expect(f('ftp')).toBe('https://h.com/registro?c=x');
    expect(f('')).toBe('https://h.com/registro?c=x');
  });
  describe('VERCEL_ENV=production', () => {
    const prod = 'production';
    it('exige APP_URL: sin ella o inválida no cae al Host', () => {
      expect(buildInviteLink({ appUrl: undefined, host: 'h.com', proto: 'https', code: 'x', vercelEnv: prod })).toBeNull();
      expect(buildInviteLink({ appUrl: 'no-es-url', host: 'h.com', proto: 'https', code: 'x', vercelEnv: prod })).toBeNull();
    });
    it('con APP_URL válida funciona', () => {
      expect(buildInviteLink({ appUrl: 'https://app.example.com', host: 'h.com', proto: null, code: 'x', vercelEnv: prod }))
        .toBe('https://app.example.com/registro?c=x');
    });
    it('en preview sigue permitiendo el fallback', () => {
      expect(buildInviteLink({ appUrl: undefined, host: 'h.com', proto: 'https', code: 'x', vercelEnv: 'preview' }))
        .toBe('https://h.com/registro?c=x');
    });
  });
  describe('inviteLinkProblem', () => {
    it('en producción sin APP_URL válida da el mensaje claro', () => {
      expect(inviteLinkProblem({ appUrl: undefined, host: 'h.com', proto: null, vercelEnv: 'production' })).toBe('Falta configurar APP_URL');
      expect(inviteLinkProblem({ appUrl: 'x', host: 'h.com', proto: null, vercelEnv: 'production' })).toBe('Falta configurar APP_URL');
    });
    it('fuera de producción o con configuración correcta no hay problema genérico de APP_URL', () => {
      expect(inviteLinkProblem({ appUrl: 'https://a.example.com', host: null, proto: null, vercelEnv: 'production' })).toBeNull();
      expect(inviteLinkProblem({ appUrl: undefined, host: 'h.com', proto: null, vercelEnv: undefined })).toBeNull();
    });
    it('el mensaje no incluye el valor de APP_URL', () => {
      const m = inviteLinkProblem({ appUrl: 'https://secreto-xyz.example.com/ruta', host: null, proto: null, vercelEnv: 'production' });
      expect(m).toBe('Falta configurar APP_URL');
      expect(m).not.toContain('secreto-xyz');
    });
  });
});
