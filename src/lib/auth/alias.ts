const ALIAS_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeAlias(raw: string): { ok: true; alias: string } | { ok: false; error: 'alias_invalido' } {
  const alias = raw.trim().toLowerCase();
  return ALIAS_RE.test(alias) ? { ok: true, alias } : { ok: false, error: 'alias_invalido' };
}
