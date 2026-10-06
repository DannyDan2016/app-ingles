/** Archivos que pueden mencionar localhost/IPs privadas (los túneles y runners se vigilan siempre). */
export const ALLOWLIST: RegExp[] = [
  /^docker-compose\.ya?ml$/,
  /^tests\/docker-compose\.ya?ml$/,
  /^\.env\.example$/,
  /^tests\/\.env\.example$/,
  /^Dockerfile$/,
  /^tests\/Dockerfile$/,
  /^docs\/.+\.md$/,
  /^tests\/data\/local\//,
  /^\.github\/workflows\/ci\.yml$/, // servicios de CI en el propio runner de GitHub
];

/** La propia guardia y su test contienen los patrones como texto: se excluyen de todo. */
const SELF = /^scripts\/no-pc(\.test)?\.ts$/;

/** Host local e IPs privadas: se toleran en los archivos de la allowlist. */
const LOCAL_PATTERNS = [
  /\blocalhost\b/i,
  /(?<![\w.])127(\.\d{1,3}){1,3}\b/,
  /\b0\.0\.0\.0\b/,
  /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
  /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/,
  /\b169\.254\.\d{1,3}\.\d{1,3}\b/,
  /\[::1\]|(?<![\w:])::1(?![\w:])/,
  /(?:-H|--hostname)[\s=]+::(?![\w:])/,
  /\bhost\.docker\.internal\b/i,
  /\b[a-z0-9-]+\.local\b/i,
];

/** Cualquier `self-hosted` en un workflow (cubre runners en matrix). */
const WORKFLOW = /^\.github\/workflows\/.+\.ya?ml$/;
const SELF_HOSTED_TOKEN = /self-hosted/i;

/** Túneles: se vigilan en TODOS los archivos, sin excepción. */
const TUNNEL_PATTERNS = [
  /\bngrok\b/i,
  /\bcloudflared\b/i,
  /\btrycloudflare\b/i,
  /\blocaltunnel\b|\blt --port\b|\bloca\.lt\b/i,
  /\btailscale\s+funnel\b/i,
  /\bserveo\b/i,
  /\bzrok\b/i,
];

/** La documentación describe la regla (menciona ngrok, self-hosted…) y no se ejecuta: solo se exenta docs/. */
const DOCS = /^docs\/.+\.md$/;

/** runs-on con self-hosted, también como lista YAML multilínea (se busca en todo el contenido). */
const SELF_HOSTED = /runs-on:[\s\S]{0,80}?self-hosted/gi;

export function findViolations(files: Array<{ path: string; content: string }>) {
  const out: Array<{ path: string; line: number; match: string }> = [];
  for (const f of files) {
    if (SELF.test(f.path)) continue;
    const isDocs = DOCS.test(f.path);
    const patterns = isDocs ? [] : ALLOWLIST.some((re) => re.test(f.path)) ? TUNNEL_PATTERNS : [...LOCAL_PATTERNS, ...TUNNEL_PATTERNS];
    f.content.split(/\r?\n/).forEach((text, i) => {
      for (const re of patterns) {
        const m = text.match(re);
        if (m) out.push({ path: f.path, line: i + 1, match: m[0] });
      }
    });
    if (isDocs) continue;
    for (const m of f.content.matchAll(SELF_HOSTED)) {
      const line = f.content.slice(0, m.index).split(/\r?\n/).length;
      out.push({ path: f.path, line, match: 'runs-on: self-hosted' });
    }
    if (WORKFLOW.test(f.path)) {
      f.content.split(/\r?\n/).forEach((text, i) => {
        const dup = out.some((x) => x.path === f.path && x.line === i + 1 && x.match === 'runs-on: self-hosted');
        if (!dup && SELF_HOSTED_TOKEN.test(text)) out.push({ path: f.path, line: i + 1, match: 'self-hosted' });
      });
    }
  }
  return out;
}
