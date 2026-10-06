export const ALLOWLIST: RegExp[] = [
  /^docker-compose\.ya?ml$/,
  /^tests\/docker-compose\.ya?ml$/,
  /^\.env\.example$/,
  /^tests\/\.env\.example$/,
  /^Dockerfile$/,
  /^tests\/Dockerfile$/,
  /^docs\//,
  /^scripts\/no-pc(\.test)?\.ts$/,
  /^tests\/data\/local\//,
  /^\.github\/workflows\/ci\.yml$/, // servicios de CI en el propio runner de GitHub
];

const PATTERNS = [
  /\blocalhost\b/i,
  /\b127\.0\.0\.1\b/,
  /\b0\.0\.0\.0\b/,
  /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
  /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/,
  /\bngrok\b/i,
  /\bcloudflared\b/i,
  /\blocaltunnel\b|\blt --port\b/i,
  /runs-on:\s*\[?\s*self-hosted/i,
];

export function findViolations(files: Array<{ path: string; content: string }>) {
  const out: Array<{ path: string; line: number; match: string }> = [];
  for (const f of files) {
    if (ALLOWLIST.some((re) => re.test(f.path))) continue;
    f.content.split(/\r?\n/).forEach((text, i) => {
      for (const re of PATTERNS) {
        const m = text.match(re);
        if (m) out.push({ path: f.path, line: i + 1, match: m[0] });
      }
    });
  }
  return out;
}
