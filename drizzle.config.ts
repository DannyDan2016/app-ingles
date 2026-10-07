import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { drizzleDbUrl } from './src/lib/db/drizzle-url';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // `db:generate` no necesita BD; migrate/push/studio sin DATABASE_URL fallan con un error claro.
  dbCredentials: { url: drizzleDbUrl(process.argv, process.env) },
});
