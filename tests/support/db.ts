import pg from 'pg';

/** Solo E2E local (stack Docker): marca una lección como completada para no recorrer las 9 por la UI. */
export async function completarLeccion(alias: string, nivel: string, leccionId: string) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query(
      `insert into progress (user_id, nivel, leccion_id) select id, $2, $3 from users where alias = $1 on conflict do nothing`,
      [alias, nivel, leccionId],
    );
  } finally {
    await c.end();
  }
}
