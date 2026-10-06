import 'dotenv/config';
import { Client } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from './client';

export default async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error('DATABASE_URL_TEST no está definida');
  const admin = new URL(url);
  const dbName = admin.pathname.slice(1);
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
