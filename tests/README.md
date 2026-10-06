# Framework de QA

Playwright 1.63 + playwright-bdd 9.2.1 (Gherkin en español), pruebas de API, accesibilidad (axe) y
responsive. Muestra curada: pocos escenarios con alto valor, no cobertura total.

## Estructura

```
tests/
  features/      escenarios Gherkin (# language: es) con tags @smoke-local, @regresion, @a11y, @responsive, @local-only
  steps/         definiciones de pasos (declarativos, con las fixtures desestructuradas)
  pages/         Page Objects: locators y acciones, sin aserciones
  fixtures/      fixtures de Playwright (page objects, axe, contexto de admin)
  api/           specs de API (rutas protegidas, cabeceras, cookie de sesión) y services/
  support/       env.ts (zod sobre process.env) y data.ts (YAML por entorno)
  data/<entorno> datos por entorno (local, preview), sin secretos
  auth.setup.ts  login del admin una vez y reutilización del storageState
```

## Entornos

| Entorno | Cómo se ejecuta | BASE_URL |
|---|---|---|
| `local` | Stack Docker completo (BD + migración + web (la app) + tests) | `http://web:3000` (lo fija el compose) |
| `preview` | `npm run test:preview` contra un despliegue | variable `BASE_URL` obligatoria (+ `VERCEL_BYPASS` opcional) |

Variables (ver `.env.example`): `TEST_ENV`, `BASE_URL`, `E2E_ADMIN_ALIAS`, `E2E_ADMIN_PASSWORD`, `VERCEL_BYPASS`.
Los valores reales van en `.env` (ignorado) o en la sesión; nunca en git.

## Ejecutar en local (Docker)

El proyecto de Compose es `app-ingles-e2e` y no publica puertos: no choca con la BD de desarrollo.
Desde la raíz del repo (PowerShell):

```powershell
$env:E2E_ADMIN_PASSWORD = '<mínimo 12 caracteres>'
$f = '-f', 'docker-compose.yml', '-f', 'tests/docker-compose.yml'
docker compose @f down -v                    # BD limpia: el rate limit por IP no se acumula entre ejecuciones
docker compose @f up -d --build --wait web   # BD + migración + admin + app (espera al healthcheck de /api/salud)
docker compose @f run --rm --build tests     # suite completa; informe en tests/playwright-report/
docker compose @f down -v                    # limpieza
```

Un solo proyecto: `docker compose @f run --rm tests npm test -- --project=chromium`.

## Ejecutar contra un preview

```bash
cd tests && npm ci && npx playwright install --with-deps chromium firefox webkit
BASE_URL=<url del preview> E2E_ADMIN_PASSWORD=<clave del admin del preview> npm run test:preview
```

`test:preview` excluye `@local-only` (p. ej. el bloqueo por 5 intentos, que dejaría bloqueado al alias en un entorno compartido).

## Decisiones

- **El servicio se llama `web`, no `app`**: `.app` es un TLD con HSTS precargado y Chromium fuerza https para el host `app` (ERR_SSL_PROTOCOL_ERROR por http).
- **workers=1**: los escenarios localizan su invitación por diferencia de filas en `/admin/invitaciones`
  y la revocan por id; en paralelo podrían verse filas ajenas.
- **Cookie de sesión**: en el stack local (http, `COOKIE_INSECURE=true`) se llama `sesion` y no es Secure;
  en preview se exige `__Host-sesion` con `Secure`, `HttpOnly`, `SameSite=Lax` y `Path=/`.
- **Trazas** desactivadas fuera de local porque guardarían la cabecera de bypass.
- Los errores de formulario se localizan dentro de `main`, porque Next inyecta otro `role=alert` (route announcer).
