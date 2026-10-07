# app-ingles

App privada para practicar inglés técnico (niveles CEFR A1-C2). Es también una pieza de portfolio de QA: el proyecto incluye un framework de pruebas completo (E2E/BDD, API, accesibilidad, seguridad) y su pipeline de CI/CD.

## Demo y producción

https://app-ingles-mauve.vercel.app

El acceso es solo por invitación: no hay registro abierto.

## Stack

- Next.js 16 (App Router) y React 19, Tailwind CSS 4, TypeScript.
- Drizzle ORM sobre PostgreSQL (Neon en producción, Postgres 17 en local).
- Node 24 (argon2id con `crypto.argon2`).
- Pruebas: Vitest (unit e integración) y Playwright con playwright-bdd (Gherkin en español), axe-core.
- Despliegue: Vercel desde GitHub Actions; ZAP baseline y gitleaks en CI.

## Arquitectura

- `src/app/`: rutas, Server Actions y páginas.
- `src/lib/`: autenticación y sesiones, base de datos (`db/`), seguridad (`security/`: CSP y cabeceras).
- `src/proxy.ts`: genera la CSP con nonce y filtra de forma optimista por la cookie de sesión; la validación real está en `requireUser` y `requireAdmin`.
- `drizzle/`: migraciones SQL. `scripts/`: crear admin, restablecer contraseña y guardia no-PC.
- `tests/`: framework de QA (ver `tests/README.md`). `docs/`: requisitos, seguridad y QA manual.

## Correr en local

Requisitos: Node 24 y Docker.

```powershell
npm ci
Copy-Item .env.example .env        # y ajusta DATABASE_URL a la BD local
docker compose up -d db            # Postgres 17 en 127.0.0.1:5432
npm run db:migrate                 # aplica las migraciones
npm run dev                        # http://127.0.0.1:3000
```

Como el desarrollo es por http, define `COOKIE_INSECURE=true` solo en tu `.env` local. Para crear el administrador usa `npm run admin:crear` (receta en "Crear el administrador", más abajo).

## Tests

| Comando | Qué ejecuta |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos de Next y TypeScript |
| `npm test` | Unit (Vitest) |
| `npm run test:int` | Integración contra Postgres (`DATABASE_URL_TEST`, BD acabada en `_test`) |
| `npm run check:no-pc` | Guardia contra la exposición del PC |

La suite E2E (Playwright + BDD) corre en Docker; los comandos y los entornos (`local`, `preview`) están en [tests/README.md](tests/README.md). En local:

```powershell
$env:E2E_ADMIN_PASSWORD = '<mínimo 12 caracteres>'
$f = '-f', 'docker-compose.yml', '-f', 'tests/docker-compose.yml'
docker compose @f up -d --build --wait web
docker compose @f run --rm --build tests
docker compose @f down -v
```

## Reporte de pruebas

El informe de Playwright de `main` se publica en GitHub Pages: https://dannydan2016.github.io/app-ingles/

## Estrategia de QA

Se automatiza por riesgo, no por cobertura (resumen de `docs/requisitos.md` §7):

- Acceso no autorizado y exposición del PC (riesgo máximo): rutas protegidas, invitaciones inválidas o revocadas, cookie, cabeceras, secretos, dependencias y escaneo dinámico (API, E2E y CI de seguridad).
- Responsive y accesibilidad: tres viewports, axe en las páginas del MVP y navegación con teclado.
- Framework de portfolio: Page Objects, datos en YAML por entorno, BDD en español, Docker y GitHub Actions.
- Manual, con checklist en el repo: pruebas en dispositivos reales (`docs/qa/checklist-sp1.md`) y sesión exploratoria por subproyecto (`docs/qa/exploratoria-sp1.md`).

## Seguridad

Modelo de amenazas, controles y riesgos aceptados en [docs/seguridad.md](docs/seguridad.md).

## Despliegue

Lo que hay que configurar a mano antes del primer despliegue. Nada de esto vive en el repositorio.

### Vercel

- Integración Git de Vercel **desactivada**: el despliegue lo hace el workflow `.github/workflows/deploy.yml` (`vercel.json` lo refuerza con `git.deploymentEnabled: false`).
- **Deployment Protection** activada también en los previews. El bypass de protección se guarda solo como secret de GitHub y nunca en el código ni en variables públicas.
- Nunca definir `COOKIE_INSECURE` ni variables `NEXT_PUBLIC_*` con secretos en Vercel.

### Neon

- Dos ramas: `main` (producción) y `preview`. Crear `preview` **antes** de que `main` tenga datos, para que los hashes de producción no se copien al preview.
- La app usa la URL **con pooler** y `?sslmode=verify-full`.
- Las migraciones (`npm run db:migrate`) usan la URL **directa** (sin pooler).

### GitHub

- Proteger `main` con los checks requeridos `calidad`, `integracion` y `e2e`.
- Activar secret scanning con push protection y las alertas de Dependabot.
- En Actions, "Require approval for all outside collaborators".

### Flujo de deploy y GitHub Environments

Se publica con `push` a `main`. Cuando `ci` termina en verde, `deploy.yml` ejecuta `preview` (migra Neon preview, despliega) → `puerta-seguridad` (E2E/API + ZAP baseline sobre `/login`) → `produccion` (migra Neon main, despliega con `--prod`).

Crear en GitHub → Settings → Environments:

| Environment | Secrets (solo nombres) |
| --- | --- |
| `preview` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL_UNPOOLED` (Neon preview, URL directa), `VERCEL_BYPASS`, `E2E_ADMIN_PASSWORD` |
| `production` | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL_UNPOOLED` (Neon main, URL directa) |

- **`production` debe tener un revisor obligatorio** (Required reviewers): sin él, el job de producción se ejecutaría sin aprobación manual.
- **URL de Neon directa vs. con pooler**: `DATABASE_URL_UNPOOLED` es la URL **directa** (host sin `-pooler`) y solo sirve para migrar desde Actions. La app en Vercel usa `DATABASE_URL` **con pooler** (variable de entorno de Vercel, no secret de GitHub). Las migraciones no funcionan bien a través del pooler.
- Usar `sslmode=verify-full` en las URLs de Neon.
- **Usuario `admin_e2e` del preview**: debe crearse en la rama Neon `preview` (con la receta de PowerShell 5.1 de "Crear el administrador", `ADMIN_ALIAS=admin_e2e` y la URL **directa** de `preview`) con **la misma contraseña** que el secret `E2E_ADMIN_PASSWORD` del environment `preview`. Si no coinciden, `puerta-seguridad` falla en el login.
- **Deployment branches**: en ambos environments, Settings → Deployment branches → *Selected branches* → `main`.
- **Concurrencia**: el grupo `deploy` no cancela ejecuciones; un run que espera la aprobación de `production` bloquea los siguientes deploys hasta que se apruebe o se rechace.
- **Migraciones y rollback**: las migraciones se aplican **antes** del deploy, así que la versión anterior de la app corre un rato sobre el esquema nuevo. Regla expand/contract: migraciones compatibles hacia atrás, sin `DROP` ni `RENAME` en la misma release que cambia el código que los usa (primero se añade, en una release posterior se elimina). Como rollback de datos se usa la ventana de restauración (restore) de Neon.

### Variables de entorno por entorno

| Variable | Producción | Preview | Notas |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon `main`, con pooler | Neon `preview`, con pooler | Solo en Vercel; nunca en el repo |
| `DATABASE_URL_UNPOOLED` (migraciones) | Neon `main`, directa | Neon `preview`, directa | Solo como secret de GitHub (por environment) |
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
