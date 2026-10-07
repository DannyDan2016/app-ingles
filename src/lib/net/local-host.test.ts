import { describe, it, expect, afterEach, vi } from 'vitest';
import { isLocalHost, LOCAL_URL_HOSTS } from './local-host';

afterEach(() => vi.unstubAllEnvs());

describe('isLocalHost', () => {
  it.each(['localhost', '127.0.0.1', '::1', '[::1]', 'db', 'LOCALHOST'])('%s es local', (h) => {
    expect(isLocalHost(h)).toBe(true);
  });
  it.each(['postgres', '2130706433', 'db.example.com', 'redis', 'localhost.evil.com', '127.0.0.2', '', 'ep-x.neon.tech'])(
    '%s NO es local (sin heurística de «sin punto»)',
    (h) => {
      expect(isLocalHost(h)).toBe(false);
    },
  );
  it('admite nombres extra por DB_LOCAL_HOSTS (separados por comas, con espacios)', () => {
    vi.stubEnv('DB_LOCAL_HOSTS', 'postgres, otro-servicio ,');
    expect(isLocalHost('postgres')).toBe(true);
    expect(isLocalHost('otro-servicio')).toBe(true);
    expect(isLocalHost('redis')).toBe(false);
  });
  it('LOCAL_URL_HOSTS exporta los hosts tal como aparecen en una URL', () => {
    expect(LOCAL_URL_HOSTS.every((h) => isLocalHost(h))).toBe(true);
  });
});
