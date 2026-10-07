import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDb } from './client';
import { testDatabaseUrl } from './test-url';

export const { db: testDb, pool: testPool } = createDb(testDatabaseUrl());

export async function resetDb() {
  await testDb.execute(sql`TRUNCATE respuestas, tarjetas, actividad_diaria, progress, login_attempts, sessions, invites, users RESTART IDENTITY CASCADE`);
}
