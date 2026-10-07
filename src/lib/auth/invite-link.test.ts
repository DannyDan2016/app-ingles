import { describe, it, expect } from 'vitest';
import { buildInviteLink } from './invite-link';
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
});
