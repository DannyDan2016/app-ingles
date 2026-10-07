import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { enforceSslUrl } from './src/lib/db/ssl-url';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // `db:generate` no necesita BD: solo se normaliza la URL si existe.
  dbCredentials: { url: process.env.DATABASE_URL ? enforceSslUrl(process.env.DATABASE_URL) : '' },
});
