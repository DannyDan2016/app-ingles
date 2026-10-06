import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDb } from './client';

export const { db: testDb, pool: testPool } = createDb(process.env.DATABASE_URL_TEST!);

export async function resetDb() {
  await testDb.execute(sql`TRUNCATE progress, login_attempts, sessions, invites, users RESTART IDENTITY CASCADE`);
}
