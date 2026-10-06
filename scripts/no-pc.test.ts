import { describe, it, expect } from 'vitest';
import { findViolations } from './no-pc';

describe('findViolations', () => {
  it('detecta localhost, IPs privadas, túneles y runners self-hosted', () => {
    const v = findViolations([
      { path: 'src/a.ts', content: 'fetch("http://localhost:3000")' },
      { path: 'src/b.ts', content: 'const h = "192.168.1.10"' },
      { path: '.github/workflows/x.yml', content: 'runs-on: self-hosted' },
      { path: 'src/c.ts', content: 'npx ngrok http 3000' },
      { path: 'src/d.ts', content: 'cloudflared tunnel run' },
    ]);
    expect(v.map((x) => x.path)).toEqual(['src/a.ts', 'src/b.ts', '.github/workflows/x.yml', 'src/c.ts', 'src/d.ts']);
  });
  it('ignora los archivos permitidos (compose, .env.example y docs)', () => {
    expect(findViolations([
      { path: 'docker-compose.yml', content: '127.0.0.1:5432:5432' },
      { path: '.env.example', content: 'postgres://app@localhost:5432/x' },
      { path: 'docs/requisitos.md', content: 'ni localhost ni túneles' },
    ])).toEqual([]);
  });
  it('informa la línea', () => {
    expect(findViolations([{ path: 'src/a.ts', content: 'ok\nok\n10.0.0.5' }])[0].line).toBe(3);
  });
});

describe('findViolations: túneles y runners se vigilan en TODOS los archivos', () => {
  const paths = ['.github/workflows/ci.yml', 'Dockerfile', 'docker-compose.yml', 'src/x.ts'];
  it.each([
    ['runs-on: self-hosted'],
    ['RUN npx ngrok http 3000'],
    ['https://abc.trycloudflare.com'],
    ['https://x.loca.lt'],
    ['tailscale funnel 3000'],
    ['ssh -R 80:x serveo.net'],
    ['zrok share public'],
    ['runs-on:\n  - self-hosted'],
  ])('detecta %j incluso en archivos permitidos', (content) => {
    for (const path of paths) expect(findViolations([{ path, content }]).length, path).toBeGreaterThan(0);
  });
  it('informa la línea de runs-on en listas YAML multilínea', () => {
    const v = findViolations([{ path: 'src/x.yml', content: 'a: 1\nruns-on:\n  - self-hosted' }]);
    expect(v[0].line).toBe(2);
  });
});

describe('findViolations: variantes de host local', () => {
  it.each([
    ['127.1'], ['127.0.1.1'], ['http://[::1]:3000'], ['listen ::1'], ['next dev -H ::'],
    ['next dev -H 0.0.0.0'], ['host.docker.internal'], ['mipc.local'], ['169.254.10.2'],
  ])('detecta %j en src/x.ts', (content) => {
    expect(findViolations([{ path: 'src/x.ts', content }]).length).toBeGreaterThan(0);
  });
  it('no da falsos positivos', () => {
    expect(findViolations([{ path: 'src/x.ts', content: 'a.localeCompare(b); localStorage.x; v1.27.1; std::1x; 1.127.0' }])).toEqual([]);
  });
  it('los hosts locales siguen permitidos en archivos de la allowlist', () => {
    expect(findViolations([{ path: 'Dockerfile', content: 'host.docker.internal 127.0.1.1' }])).toEqual([]);
  });
});

describe('findViolations: docs', () => {
  it('la documentación puede describir túneles y runners', () => {
    expect(findViolations([{ path: 'docs/x.md', content: 'prohibido: ngrok, runs-on: self-hosted' }])).toEqual([]);
  });
});
