/**
 * Único sitio con la lista de hosts locales (allowlist EXPLÍCITA; sin heurísticas como «sin punto = local»).
 * `db` es el servicio de docker compose (docker-compose.yml y tests/docker-compose.yml).
 * Nombres extra: variable `DB_LOCAL_HOSTS` (lista separada por comas).
 */
export const LOCAL_URL_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'db'] as const;

const FIJOS = new Set<string>([...LOCAL_URL_HOSTS, '::1']);

function extra(): string[] {
  return (process.env.DB_LOCAL_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return FIJOS.has(h) || extra().includes(h);
}
