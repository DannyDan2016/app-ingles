import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDb } from '../src/lib/db/client';
import { users, sessions } from '../src/lib/db/schema';
import { hashPassword, validatePasswordPolicy } from '../src/lib/auth/password';
import { normalizeAlias } from '../src/lib/auth/alias';

// Uso: $env:ALIAS='ana'; $env:NEW_PASSWORD=Read-Host -MaskInput; npm run admin:reset
async function main() {
  const a = normalizeAlias(process.env.ALIAS ?? '');
  const pwd = process.env.NEW_PASSWORD ?? '';
  const url = process.env.DATABASE_URL;
  if (!a.ok) throw new Error('ALIAS inválido (3 a 20 caracteres: a-z, 0-9 y _)');
  if (!validatePasswordPolicy(pwd).ok) throw new Error('NEW_PASSWORD debe tener de 12 a 128 caracteres');
  if (!url) throw new Error('DATABASE_URL no está definida');

  const { db, pool } = createDb(url);
  try {
    const r = await db
      .update(users)
      .set({ passwordHash: await hashPassword(pwd) })
      .where(eq(users.alias, a.alias))
      .returning({ id: users.id });
    if (!r.length) throw new Error(`No existe el usuario "${a.alias}"`);
    await db.delete(sessions).where(eq(sessions.userId, r[0].id)); // cierra sus sesiones abiertas
  } finally {
    await pool.end();
  }
  console.log(`Contraseña de "${a.alias}" cambiada y sesiones cerradas.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message.split(String.fromCharCode(10))[0] : "Error desconocido"); // 1.ª línea: drizzle añade los params (hash) después
  process.exit(1);
});
