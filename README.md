# app-ingles

App privada para practicar inglés técnico (niveles CEFR A1-C2).

Documentación en `docs/`.

## Despliegue

Lo que hay que configurar a mano antes del primer despliegue. Nada de esto vive en el repositorio.

### Vercel

- Integración Git de Vercel **desactivada**: el despliegue lo hará el workflow de GitHub (`vercel.json` y `deploy.yml` llegan en la Task 12).
- **Deployment Protection** activada también en los previews. El bypass de protección se guarda solo como secret de GitHub y nunca en el código ni en variables públicas.
- Nunca definir `COOKIE_INSECURE` ni variables `NEXT_PUBLIC_*` con secretos en Vercel.

### Neon

- Dos ramas: `main` (producción) y `preview`. Crear `preview` **antes** de que `main` tenga datos, para que los hashes de producción no se copien al preview.
- La app usa la URL **con pooler** y `?sslmode=require`.
- Las migraciones (`npm run db:migrate`) usan la URL **directa** (sin pooler).

### GitHub

- Proteger `main` con los checks requeridos `calidad`, `integracion` y `e2e`.
- Activar secret scanning con push protection y las alertas de Dependabot.
- En Actions, "Require approval for all outside collaborators".

### Variables de entorno por entorno

| Variable | Producción | Preview | Notas |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon `main`, con pooler | Neon `preview`, con pooler | Solo en Vercel; nunca en el repo |
| `DATABASE_URL` para migraciones | Neon `main`, directa | Neon `preview`, directa | Solo como secret de GitHub |
| Bypass de protección | no aplica | secret de GitHub | Solo lo usa el E2E contra el preview |

### Crear el administrador

Se hace una vez por base de datos, desde tu PC y con Windows PowerShell 5.1. Los secretos se leen sin eco y no se escriben en la línea de comandos (PSReadLine los guardaría en el historial):

```powershell
$s = Read-Host 'Contraseña' -AsSecureString
$env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
$s = Read-Host 'DATABASE_URL (URL directa de Neon)' -AsSecureString
$env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
$env:ADMIN_ALIAS = '<tu_alias>'
npm run admin:crear
Remove-Item Env:ADMIN_PASSWORD, Env:DATABASE_URL
```

Usa un alias de producción que no aparezca en el repositorio. Para restablecer una contraseña, `npm run admin:reset` con `ALIAS` y `NEW_PASSWORD` (receta en `scripts/reset-password.ts`).
