# Estrategia de QA y pruebas de seguridad

Página de síntesis: resume lo que **ya existe** en el repo. El detalle vive en [../seguridad.md](../seguridad.md), [../../tests/README.md](../../tests/README.md) y los workflows de `.github/workflows/`.

## Objetivo y alcance

App privada de inglés técnico (≤10 usuarios, acceso por invitación). Política: **no buscamos cobertura exhaustiva**, solo el **flujo feliz** de cada funcionalidad y la **seguridad importante** (riesgo máximo: acceso no autorizado y exposición del PC del autor). Ver también "Estrategia de QA" en el [README](../../README.md) y los requisitos en [../requisitos.md](../requisitos.md) §7.

## Pirámide real (cifras aproximadas)

| Capa | Herramienta | Tamaño aproximado | Dónde |
| --- | --- | --- | --- |
| Unit | Vitest (proyecto `unit`) | ~58 archivos, ~330 tests | `src/**/*.test.ts`, `scripts/**/*.test.ts` |
| Integración | Vitest (proyecto `integration`) contra Postgres | ~14 archivos, ~66 tests | `src/**/*.int.test.ts` |
| API | Playwright (proyecto `api`) | 6 specs, ~18 tests | `tests/api/` |
| E2E / BDD | Playwright + playwright-bdd, en español | 10 `.feature`, ~24 escenarios | `tests/features/`, `tests/steps/`, `tests/pages/` |

Base ancha de unit, integración acotada a la BD real, y pocos E2E de flujo feliz.

## Qué cubre cada capa

- **Unit**: lógica pura y reglas estáticas, p. ej. el test que exige `requireUser()` en cada página y server action de `src/app/(app)` (`src/lib/auth/guardas-app.test.ts`), la guardia no-PC (`scripts/no-pc.test.ts`) y el endpoint de Neon (`scripts/neon-endpoint.test.ts`).
- **Integración**: acceso a datos y flujos con BD (Postgres 17 en el job `integracion` de CI).
- **API**: cabeceras de seguridad (`cabeceras.spec.ts`), cookie de sesión (`cookie-sesion.spec.ts`), rutas protegidas (`rutas-protegidas.spec.ts`), `/api/recordatorio`, exportar y actividad.
- **E2E**: login, registro con invitación, mapa de niveles, lección, evaluación, repaso, escuchar, glosario, preferencias y entrevistas. Proyectos de Playwright: `chromium` (escritorio), `firefox` y `webkit-movil` solo con `@smoke`, y `responsive-360/768/1366` para el flujo `@responsive`. Accesibilidad con axe en las páginas del MVP (fixtures y `comunes.steps.ts`).

## Puerta de deploy

1. `ci.yml` en cada push/PR: job `calidad` (lint, tipos, unit, build, no-pc, audit, gitleaks), `integracion` y `e2e` (stack Docker; publica el informe en GitHub Pages desde `main`). Son los checks requeridos de `main`.
2. `deploy.yml` se dispara cuando `ci` termina en verde en `main`: `preview` (comprueba la rama Neon, migra, despliega) → `puerta-seguridad` (E2E + API contra el preview con `npm run test:preview`, y ZAP baseline sobre `/login`) → `produccion`.
3. `produccion` está en el environment `production` con **revisor obligatorio**: aprobación manual antes de migrar la rama `main` de Neon y desplegar con `--prod`.

## Controles de seguridad

**Automáticos**

- **gitleaks** sobre el historial completo, imagen fijada por digest (`.gitleaks.toml`).
- **`npm audit --omit=dev --audit-level=high`** (raíz y `tests/`) como gate; **Dependabot** semanal para npm, GitHub Actions y Docker (`.github/dependabot.yml`).
- **Cabeceras y CSP con nonce**: definidas en `src/lib/security/csp.ts`, verificadas en `tests/api/cabeceras.spec.ts`.
- **Rutas protegidas y cookie**: `rutas-protegidas.spec.ts`, `cookie-sesion.spec.ts` y el test estático de guardas.
- **Rate limit y lockout** del login (5 fallos en 15 min), cubiertos en integración y en E2E.
- **Guardia no-PC** (`npm run check:no-pc`) en CI.
- **Check de rama Neon** (`scripts/comprobar-neon.ts`) antes de cada migración, para no migrar la rama equivocada.
- **ZAP baseline** sobre `/login` con las reglas de [`.zap/rules.tsv`](../../.zap/rules.tsv) (FAIL en riesgo medio/alto y cabeceras/cookies; excepciones justificadas allí y en [../seguridad.md](../seguridad.md)).
- **Contenido**: `contenido-semanal.yml` revisa cada lunes que los videos siguen disponibles y abre un issue si alguno cae.

**Manuales**

- Agente **auditor-seguridad-web** antes de cada release o al tocar auth, cabeceras o CI.
- Agente **verificador** (y comprobación en producción) tras desplegar.
- Checklists y exploratoria en `docs/qa`: [checklist-sp1.md](checklist-sp1.md) (dispositivos reales), [exploratoria-sp1.md](exploratoria-sp1.md) (plantilla de sesión de 30 min) y [muestreo-sp3.md](muestreo-sp3.md) (revisión humana del contenido).
- Paneles: verificar que `DATABASE_URL` / `DATABASE_URL_UNPOOLED` de cada entorno apuntan a la rama Neon correcta (pendiente manual en [../seguridad.md](../seguridad.md)).

## Cómo ejecutar en local

En PowerShell usa `npm.cmd` (la política de ejecución bloquea `npm.ps1`).

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test                 # unit (Vitest)
npm.cmd run test:int         # integración (necesita Postgres local)
npm.cmd run check:no-pc      # guardia no-PC
npm.cmd run content:check-videos
npm.cmd audit --omit=dev --audit-level=high
```

E2E completo en Docker (stack aislado `app-ingles-e2e`, sin publicar puertos):

```powershell
$env:E2E_ADMIN_PASSWORD = '<mínimo 12 caracteres>'
$f = '-f', 'docker-compose.yml', '-f', 'tests/docker-compose.yml'
docker compose @f up -d --build --wait web
docker compose @f run --rm --build tests
docker compose @f down -v
```

Contra un preview: `cd tests; npm.cmd run test:preview` con `BASE_URL` y `E2E_ADMIN_PASSWORD` (excluye `@local-only`). Detalle y variables en [../../tests/README.md](../../tests/README.md).

## Qué NO se prueba a propósito

- Cobertura exhaustiva de ramas, estilos o textos: solo flujo feliz y seguridad.
- Pruebas de carga y rendimiento (app de ≤10 usuarios).
- Voz y micrófono: fuera de alcance por ahora (`Permissions-Policy` mantiene `microphone=()`, ver [../seguridad.md](../seguridad.md)).
- Subtítulos de YouTube: YouTube los bloquea desde automatización; el contenido de listening se valida a mano (muestreo).
- ZAP activo o ataques destructivos: solo el baseline pasivo sobre `/login`.
- Bloqueo por 5 intentos contra el preview (`@local-only`): dejaría bloqueado al alias en un entorno compartido.
- Riesgos ya aceptados y justificados: ver [../seguridad.md](../seguridad.md) (p. ej. 10098 en WARN, lockout por alias).

## Mantenimiento

- **Digests a mano**: gitleaks (en un `run:` de `ci.yml`) y la imagen de ZAP (`deploy.yml`) no los ve Dependabot; repinearlos al revisar versiones. Cuando salga un ZAP estable posterior a 2.17.0, pasar `10098` a FAIL + OUTOFSCOPE (ver [../seguridad.md](../seguridad.md)).
- **Runner**: todos los jobs usan `ubuntu-latest`; vigilar cambios de imagen del runner que rompan Docker, Playwright o los navegadores.
- Revisar `.zap/rules.tsv` al subir de versión de ZAP.
- La contraseña de `admin_e2e` del preview debe coincidir con el secret `E2E_ADMIN_PASSWORD` (si no, `puerta-seguridad` falla en el login).
