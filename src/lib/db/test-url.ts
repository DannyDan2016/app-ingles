/** Devuelve DATABASE_URL_TEST solo si apunta a una BD cuyo nombre acaba en `_test`. */
export function testDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const url = env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST no está definida');
  const name = testDatabaseName(url);
  if (!/^[a-z0-9_]+$/.test(name) || !name.endsWith('_test')) {
    throw new Error(`DATABASE_URL_TEST debe apuntar a una BD cuyo nombre acabe en "_test" (solo a-z, 0-9 y _); recibido "${name}"`);
  }
  return url;
}

export function testDatabaseName(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}
