import 'dotenv/config';
import { createDb } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { hashPassword, validatePasswordPolicy } from '../src/lib/auth/password';
import { normalizeAlias } from '../src/lib/auth/alias';

// Uso (Windows PowerShell 5.1; `Read-Host -MaskInput` solo existe desde PS 7.1). Los secretos se leen sin eco:
//   $s = Read-Host 'Contraseña' -AsSecureString
//   $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
//   $s = Read-Host 'DATABASE_URL (Neon, URL directa)' -AsSecureString
//   $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
//   $env:ADMIN_ALIAS = '<tu_alias>'
//   npm run admin:crear
//   Remove-Item Env:ADMIN_PASSWORD, Env:DATABASE_URL
// Nunca pegues la contraseña ni la URL de la base de datos en la línea de comandos: PSReadLine las guarda
// en ConsoleHost_history.txt, en disco y en texto plano. Usa un alias de producción que no figure en el repo.
// DATABASE_URL solo vive en esa sesión; nunca se imprime ni se guarda.
async function main() {
  const a = normalizeAlias(process.env.ADMIN_ALIAS ?? '');
  const pwd = process.env.ADMIN_PASSWORD ?? '';
  const url = process.env.DATABASE_URL;
  if (!a.ok) throw new Error('ADMIN_ALIAS inválido (3 a 20 caracteres: a-z, 0-9 y _)');
  if (!validatePasswordPolicy(pwd).ok) throw new Error('ADMIN_PASSWORD debe tener de 12 a 128 caracteres');
  if (!url) throw new Error('DATABASE_URL no está definida');

  const { db, pool } = createDb(url);
  try {
    await db
      .insert(users)
      .values({ alias: a.alias, passwordHash: await hashPassword(pwd), rol: 'admin', nivelInicial: 'A2' })
      .onConflictDoNothing({ target: users.alias });
  } finally {
    await pool.end();
  }
  console.log(`Admin "${a.alias}" listo (si ya existía, no se modificó).`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message.split(String.fromCharCode(10))[0] : "Error desconocido"); // 1.ª línea: drizzle añade los params (hash) después
  process.exit(1);
});
