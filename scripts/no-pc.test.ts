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
