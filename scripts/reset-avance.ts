import 'dotenv/config';
import { createDb } from '../src/lib/db/client';
import { normalizeAlias } from '../src/lib/auth/alias';
import { resetAvance } from '../src/lib/progreso/reset';

// Deja el avance en cero (progreso, respuestas, tarjetas, actividad y sesiones) y el nivel inicial en A2.
// Cuentas, contraseñas, metas e invitaciones no se tocan. Haz antes una rama de respaldo en Neon.
// Uso (Windows PowerShell 5.1). La URL se lee sin eco:
//   $s = Read-Host 'DATABASE_URL (Neon, URL directa)' -AsSecureString
//   $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
//   $env:ALIAS = '<alias>'        # opcional: solo ese usuario; sin ALIAS, todos
//   npm run admin:reset-avance    # simulación: solo cuenta
//   $env:CONFIRMAR = 'si'; npm run admin:reset-avance
//   Remove-Item Env:DATABASE_URL, Env:CONFIRMAR, Env:ALIAS -ErrorAction SilentlyContinue
// Nunca pegues la URL de la base de datos en la línea de comandos: PSReadLine la guarda en texto plano.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está definida');
  let alias: string | undefined;
  if (process.env.ALIAS) {
    const a = normalizeAlias(process.env.ALIAS);
    if (!a.ok) throw new Error('ALIAS inválido (3 a 20 caracteres: a-z, 0-9 y _)');
    alias = a.alias;
  }
  const confirmar = process.env.CONFIRMAR === 'si';

  const { db, pool } = createDb(url);
  try {
    const r = await resetAvance(db, { confirmar, alias });
    console.log(`Alcance: ${alias ? `usuario "${alias}"` : 'todos los usuarios'}`);
    console.table({ antes: r.antes, despues: r.despues });
    console.log(r.aplicado ? 'Avance reseteado y nivel inicial en A2.' : 'Simulación: no se borró nada. Repite con CONFIRMAR=si para aplicar.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message.split(String.fromCharCode(10))[0] : 'Error desconocido');
  process.exit(1);
});
