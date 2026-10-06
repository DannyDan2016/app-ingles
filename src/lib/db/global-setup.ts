import 'dotenv/config';
import { Client } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client';
import { testDatabaseUrl, testDatabaseName } from './test-url';

export default async function setup() {
  const url = testDatabaseUrl();
  const admin = new URL(url);
  const dbName = testDatabaseName(url);
  admin.pathname = '/postgres';
  const c = new Client({ connectionString: admin.toString() });
  await c.connect();
  const exists = await c.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) await c.query(`CREATE DATABASE "${dbName}"`);
  await c.end();
  const { db, pool } = createDb(url);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
}
