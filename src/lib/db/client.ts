import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

export function createDb(url: string): { db: Db; pool: Pool } {
  const pool = new Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 10_000 });
  // Sin listener, un error de un cliente inactivo (Neon suspendido, conexión cortada) tumba el proceso.
  pool.on('error', (e) => console.error('pg pool:', e.message));
  return { db: drizzle(pool, { schema }), pool };
}

const globalForDb = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  if (!globalForDb.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no está definida');
    globalForDb.__db = createDb(url).db;
  }
  return globalForDb.__db;
}
