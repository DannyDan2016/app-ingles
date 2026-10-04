---
tipo: investigacion
proyecto: app-ingles
estado: borrador
actualizado: 2026-10-04
tags: [qa, playwright, bdd, seguridad, ci]
---
# Stack QA para app-ingles (investigación a 2026-10-04)

Alcance: requisitos §6 (RNF) y §7 (estrategia QA esencial) de `docs/requisitos.md`, más el estándar del usuario en `_cerebro/20-areas/qa-automation.md` (POM, YAML por ambiente, multiambiente, BDD en español, Docker, CI con Pages, muestra curada de 10-15 escenarios).

Convenciones del informe:
- "Verificado" = leído en la fuente primaria (registro npm, API de releases de GitHub, documentación oficial) el 2026-10-04.
- "Por confirmar" = dato que no pude comprobar en fuente primaria; hay que probarlo al implementar. Está marcado así en el texto.
- Los snippets son de referencia, no probados. El agente `qa-implementer` debe ejecutarlos y ajustarlos.

---

## 0. Decisiones recomendadas (resumen)

| Tema | Recomendación |
|---|---|
| Runtime | Node 24 LTS (`.nvmrc` = 24). Es el denominador común de todo el stack. |
| E2E + BDD | `@playwright/test` 1.63.0 + `playwright-bdd` 9.2.1. Gherkin con `# language: es`. |
| API y rutas protegidas | Mismo Playwright (fixture `request`, proyecto `api` sin navegador) con service objects. |
| Unit | Vitest 5.0.3 sobre lógica pura en TypeScript. Lo async de servidor se cubre con E2E. |
| Accesibilidad | `@axe-core/playwright` 4.13.0 dentro del E2E, filtrando por impacto serious/critical. |
| Rendimiento | `@lhci/cli` 0.15.1 contra el preview, 3 ejecuciones y aserciones sobre LCP, CLS y score. |
| Seguridad CI | gitleaks 8.30.1 (binario o Docker), `npm audit` como puerta + osv-scanner 2.6.0 como complemento, ZAP baseline 2.17.0 en Docker. |
| Base de datos de prueba | Postgres en Docker (service container) para CI de cada PR. Rama Neon por PR solo para la puerta sobre el preview. |
| Reportes | Pages publica solo el reporte generado contra el stack local (sin secretos). Los de preview van a artefactos privados. |
| Estructura | Monorepo con `tests/` autocontenido (su propio `package.json`, `Dockerfile`, `compose`). |

Hallazgos críticos que cambian el diseño:
1. Los previews de Vercel están protegidos por defecto y Password Protection no existe en Hobby. Los tests y ZAP necesitan el bypass de automatización (`x-vercel-protection-bypass`), que sí está en todos los planes.
2. Los trazas de Playwright guardan cabeceras de petición. Si publicas el reporte HTML de una ejecución contra preview en GitHub Pages, filtras el secreto de bypass. No publiques trazas de preview.
3. `typescript-eslint` 8.71.0 declara `typescript >=4.8.4 <6.1.0`. TypeScript 7.0.2 ya es `latest`, pero rompería el lint. Fijar `typescript@~6.0.3`.
4. ZAP baseline contra una app con acceso privado solo ve la pantalla de acceso. Para cubrir rutas internas hay que inyectar una cookie de sesión de un usuario de prueba.
5. Neon Free: 10 ramas por proyecto, 100 CU-hora al mes y autosuspensión obligatoria a los 5 minutos. La rama por PR funciona, pero exige borrar al cerrar el PR y tolerar arranques en frío.
6. `@lhci/cli` sigue empaquetando Lighthouse 12.6.1 aunque Lighthouse 13.5.0 ya existe (requiere Node >= 22.19). No es bloqueante, pero hay que saberlo.

---

## 1. Versiones vigentes (verificadas 2026-10-04)

### Runtime y framework

| Componente | Versión | Fuente |
|---|---|---|
| Node.js LTS activo | 24.21.0 "Krypton" (2026-09-07) | https://nodejs.org/dist/index.json |
| Node.js mantenimiento | 22.23.3 "Jod" (2026-09-23) | idem |
| Node.js Current | 26.10.0 (2026-09-21) | idem |
| Node.js 20 | EOL (última 20.20.2, 2026-03-24) | https://nodejs.org/en/about/previous-releases |
| Next.js | 16.3.8 (engines >= 20.9.0) | https://registry.npmjs.org/next/latest |
| Vercel CLI | 62.2.0 | https://registry.npmjs.org/vercel/latest |

Notas:
- Node 26 es "Current" desde 2026-05-05. La página oficial indica que desde Node 27 el ciclo pasa a ser anual. No pude confirmar la fecha exacta en que Node 26 pasa a LTS (por confirmar en https://github.com/nodejs/release#release-schedule). Mientras tanto, Node 24 es la opción segura.
- Requisitos de Node de cada pieza: Playwright 1.63 >= 20; Vitest 5.0.3 `^22.12 || ^24 || >=26`; jsdom 30.1.2 `^22.22.2 || ^24.15 || >=26`; Lighthouse 13.5.0 >= 22.19; cucumber-js 13.2.1 `22 || 24 || >=26`. Node 24 cumple todos.
- La imagen oficial de Playwright 1.63.0 instala Node 24 (`ARG NODE_VERSION=24` en `utils/docker/Dockerfile.noble` del tag v1.63.0). Coincide con el `.nvmrc`.

### Pruebas

| Paquete | Versión | Fuente y fecha |
|---|---|---|
| `@playwright/test` | 1.63.0 (2026-09-04). Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6 | https://github.com/microsoft/playwright/releases |
| `playwright-bdd` | 9.2.1 (2026-09-06, "soporta Playwright 1.63") | https://api.github.com/repos/vitalets/playwright-bdd/releases/latest |
| `@cucumber/cucumber` | 13.2.1 (13.0.0 el 2026-06-02 quitó Node 20) | https://raw.githubusercontent.com/cucumber/cucumber-js/main/CHANGELOG.md |
| `@axe-core/playwright` | 4.13.0 (axe-core ~4.13.0) | https://registry.npmjs.org/@axe-core/playwright/latest |
| `vitest` | 5.0.3 | https://registry.npmjs.org/vitest/latest |
| `vite` | 8.3.2 | registro npm |
| `@vitejs/plugin-react` | 6.1.1 (peer `vite ^8`) | registro npm |
| `jsdom` | 30.1.2 | registro npm |
| `@testing-library/react` | 16.3.3 (soporta React 18 a 19; por confirmar con la versión de React de la app) | registro npm |
| `jest` (alternativa) | 30.5.2 | registro npm |
| `@lhci/cli` | 0.15.1 (publicado 2025-06-26; Lighthouse 12.6.1 fijo) | https://registry.npmjs.org/@lhci/cli/0.15.1 |
| `lighthouse` | 13.5.0 (Node >= 22.19) | https://registry.npmjs.org/lighthouse/latest |

Detalle de `playwright-bdd`:
- La rama `main` ya está en `9.3.0-next.1` y sube el mínimo de Playwright de 1.44 a 1.53 (CHANGELOG, sección sin publicar). Usar la 9.2.1 estable.
- Es compatible con "Playwright actual y 10 menores anteriores" según el CHANGELOG.
- Requiere Node >= 20 desde la 9.0.0.

### Calidad de código y utilidades

| Paquete | Versión |
|---|---|
| `typescript` | Fijar `~6.0.3` (2026-04-16). Existe 7.0.2 (2026-08-20) pero `typescript-eslint` 8.71.0 exige `<6.1.0` |
| `eslint` | 10.12.0 |
| `typescript-eslint` | 8.71.0 |
| `eslint-plugin-playwright` | 2.12.0 |
| `prettier` | 3.9.9 |
| `zod` | 4.6.5 |
| `yaml` | 2.9.1 |
| `dotenv` | 18.0.5 |

Fuente: registro npm (`https://registry.npmjs.org/<paquete>/latest`) y https://api.github.com/repos/microsoft/TypeScript/releases. Next.js 16 admite TypeScript 7 solo para `next build` con el CLI local (https://nextjs.org/docs/app/api-reference/config/typescript, actualizada 2026-08-25). Revisar cuando `typescript-eslint` suba su rango.

### Seguridad y CI

| Herramienta | Versión | Fuente |
|---|---|---|
| gitleaks | v8.30.1 (2026-03-21) | https://api.github.com/repos/gitleaks/gitleaks/releases/latest |
| `gitleaks/gitleaks-action` | v3 (runtime Node 24; exige licencia gratuita solo en cuentas de organización) | https://github.com/gitleaks/gitleaks-action |
| osv-scanner | v2.6.0 (2026-09-14) | https://api.github.com/repos/google/osv-scanner/releases/latest |
| `google/osv-scanner-action` | v2.6.0 | https://api.github.com/repos/google/osv-scanner-action/releases/latest |
| OWASP ZAP | 2.17.0 estable (la 2.18 figura como planificada en la hoja de ruta; sin versión estable posterior encontrada) | https://api.github.com/repos/zaproxy/zaproxy/releases/latest y https://www.zaproxy.org/download/ |
| Imagen ZAP | `ghcr.io/zaproxy/zaproxy:stable` (o `zaproxy/zap-stable` en Docker Hub) | https://www.zaproxy.org/docs/docker/about/ |
| `zaproxy/action-baseline` | v0.15.0 | https://github.com/zaproxy/action-baseline |
| `neondatabase/create-branch-action` | 6.3.1 (2026-03-31) | https://api.github.com/repos/neondatabase/create-branch-action/releases/latest |
| Imagen Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble` (Ubuntu 24.04) | https://playwright.dev/docs/docker |

### GitHub Actions (fijar a la versión mayor vigente)

| Action | Versión |
|---|---|
| `actions/checkout` | v7 (7.0.1, 2026-07-20) |
| `actions/setup-node` | v7 (7.0.0, 2026-07-14) |
| `actions/cache` | v6 (6.1.0, 2026-06-26) |
| `actions/upload-artifact` | v7 (7.0.1, 2026-04-10) |
| `actions/download-artifact` | v8 (8.0.1, 2026-03-11) |
| `actions/configure-pages` | v6 (6.0.0, 2026-03-25) |
| `actions/upload-pages-artifact` | v5 (5.0.0, 2026-04-10) |
| `actions/deploy-pages` | v5 (5.0.1, 2026-09-01) |
| `treosh/lighthouse-ci-action` | 12.6.2 (2026-03-12, usa `@lhci/cli` 0.15.1) |

Fuente: `https://api.github.com/repos/<owner>/<repo>/releases/latest`, consultado el 2026-10-04. La guía oficial de Playwright aún muestra `upload-artifact@v4` y `download-artifact@v5`; funcionan, pero no son las últimas.

---

## 2. E2E: Playwright + BDD en español

### 2.1 Comparación

| Criterio | `playwright-bdd` 9.2.1 | `@cucumber/cucumber` 13.2.1 + Playwright |
|---|---|---|
| Idea | Convierte los `.feature` en tests nativos de Playwright (`bddgen`) y los ejecuta con `playwright test` | Cucumber ejecuta los escenarios; Playwright es solo una librería que tú arrancas en hooks y `World` |
| Gherkin en español | Sí. Opción `language` y cabecera `# language: es` por archivo. El parser es `@cucumber/gherkin` ^39.1.0 | Sí. Es una funcionalidad del propio Gherkin |
| Auto-wait, fixtures, `expect` web-first | Nativos (los pasos reciben `page`, `request`, etc.) | Hay que construir el ciclo de vida del navegador y el contexto a mano |
| Proyectos multi-navegador, sharding, retries, trazas, UI mode, `blob` y reporte HTML | Todo el runner de Playwright | Runner propio de Cucumber; paralelo con worker threads (13.0.0). Sin trazas ni proyectos de Playwright por defecto |
| Reportes | HTML de Playwright, y también HTML, JSON y JUnit de Cucumber | Reportes de Cucumber (message, html, json, junit) |
| Fixtures y POM | Se inyectan como fixtures de Playwright | `World` con propiedades; patrón más manual |
| Madurez | Mantenedor único (vitalets), liberaciones frecuentes y alineadas a cada Playwright | Proyecto oficial de Cucumber, muy estable |
| Riesgo | Depende de un mantenedor. Mitigado por el seguimiento rápido de versiones (1.61 en 9.1.0, 1.63 en 9.2.1) | Más código de pegamento y menos funciones de diagnóstico |

Recomendación: `playwright-bdd`. Para un portfolio muestra el estándar actual de Playwright (trazas, proyectos, sharding, `request` para API en el mismo runner) y deja el BDD como capa fina. `@cucumber/cucumber` es defendible si el reclutador prioriza "Cucumber puro", pero cuesta más mantenerlo y pierde las trazas.

Fuentes: https://github.com/vitalets/playwright-bdd (README y `docs/configuration/options.md` en `main`), https://raw.githubusercontent.com/vitalets/playwright-bdd/main/package.json, https://raw.githubusercontent.com/cucumber/cucumber-js/main/package.json.

### 2.2 Gherkin en español (confirmado)

- `playwright-bdd`: la opción `language` ("Default language for your feature files", por defecto `en`) está en `docs/configuration/options.md`. La cabecera `# language: es` es estándar de Gherkin y la usa el parser incluido.
- Palabras clave en español (https://cucumber.io/docs/gherkin/languages/): `Característica`, `Antecedentes`, `Escenario` o `Ejemplo`, `Esquema del escenario`, `Ejemplos`, `Dado`/`Dada`/`Dados`/`Dadas`, `Cuando`, `Entonces`, `Y`/`E`, `Pero`.
- En los step definitions se siguen usando `Given`, `When`, `Then` (son funciones de `createBdd`). El idioma solo afecta a los `.feature`. El texto del paso excluye la palabra clave: en `Dado que tengo un enlace válido`, la expresión es `'que tengo un enlace válido'`.
- Por confirmar: que los tags especiales `@only`, `@skip`, `@fixme` y `@fail` existan tal cual en la 9.2.1 (leer la sección "special tags" de la documentación antes de usarlos). `@fail` sería el equivalente a `xfail strict`: pasa a rojo si el test empieza a pasar.

### 2.3 Estructura BDD recomendada

```gherkin
# language: es
@acceso @smoke
Característica: Acceso con usuario y contraseña
  Para recuperar mi progreso
  Como aprendiz
  Quiero entrar con mi cuenta

  Antecedentes:
    Dado que estoy en la pantalla de acceso

  @seguridad
  Escenario: Acceso directo a una lección sin sesión
    Dado que no tengo sesión
    Cuando abro directamente la URL de una lección
    Entonces me redirige a la pantalla de acceso

  @responsive
  Esquema del escenario: Sin scroll horizontal en <dispositivo>
    Dado que abro la app en una pantalla de <ancho>x<alto>
    Cuando navego a una lección
    Entonces no aparece scroll horizontal

    Ejemplos:
      | dispositivo | ancho | alto |
      | celular     | 360   | 800  |
      | tablet      | 768   | 1024 |
      | desktop     | 1366  | 768  |
```

Reglas:
- Un `.feature` por característica, carpeta por dominio (`acceso`, `evaluacion`, `traductor`, `video`, `seguridad`, `responsive`).
- Tags de ciclo: `@smoke` (corre en prod, solo lectura), `@regresion`, `@seguridad`, `@a11y`, `@responsive`, `@api`. Tags de entorno: `@local-only` (p. ej. bloqueo por intentos, que bloquearía una cuenta real), `@preview-only`. Tag de bug conocido: `@known-bug` más `@fail`.
- Los pasos son declarativos (negocio), sin selectores ni URLs ni literales. Los literales salen del YAML por ambiente.
- Muestra curada del portfolio (10-15 escenarios), tomados de las historias del MVP: EP1-HU01 (3 escenarios de acceso), EP2-HU03 (importar archivo inválido), EP7-HU01 (aprobar y suspender), EP6-HU01 (traducir palabra encontrada y no encontrada), EP5-HU02 (video sin redirección y video no disponible), EP4-HU02 (cabecera CSP ausente), EP3-HU01 (esquema multi-viewport), EP1-HU03 (intentos fallidos, solo local).

### 2.4 Configuración de referencia

```ts
// tests/playwright.config.ts  (snippet de referencia; validar con `npx bddgen`)
import { defineConfig, devices } from '@playwright/test';
import { defineBddProject } from 'playwright-bdd';
import { env } from './support/env';

const bdd = (name: string, tags?: string) =>
  defineBddProject({
    name,
    language: 'es',
    features: 'features/**/*.feature',
    steps: ['steps/**/*.ts', 'fixtures/**/*.ts'],
    tags,
  });

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['blob'], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: env.VERCEL_BYPASS
      ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }
      : undefined,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { ...bdd('chromium'),  use: { ...devices['Desktop Chrome'],  viewport: { width: 1366, height: 768 } }, dependencies: ['setup'] },
    { ...bdd('firefox',  '@smoke or @responsive'), use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { ...bdd('webkit',   '@smoke or @responsive'), use: { ...devices['Desktop Safari'] },  dependencies: ['setup'] },
    { name: 'api', testDir: 'api', use: { baseURL: env.BASE_URL } },
  ],
});
```

Notas:
- `defineBddProject` y la opción `tags` por proyecto: por confirmar contra la documentación de la 9.2.1 (la opción `tags` figura en `options.md`; el uso por proyecto no lo verifiqué).
- Orden de ejecución: `npx bddgen && npx playwright test`.
- Multi-viewport: el `Esquema del escenario` con `ancho` y `alto` y un paso que llama a `page.setViewportSize()` evita multiplicar proyectos. Los 3 navegadores se cubren con proyectos y tags (RNF-RES-02), no con 9 combinaciones.
- `isMobile` no está soportado en Firefox (https://playwright.dev/docs/api/class-testoptions). Para emular celular en Firefox solo se cambia el viewport. Para "Safari iOS" lo más fiel es WebKit con viewport 360x800 y `hasTouch: true`; las pruebas en iPhone real siguen siendo manuales (§7 de requisitos).
- Protección de Vercel: con `extraHTTPHeaders` el secreto viaja en todas las peticiones, incluidas las de terceros. En este proyecto casi no hay terceros (YouTube va en iframe), pero conviene interceptar `youtube-nocookie.com` con `page.route` para no depender de la red externa. Ver riesgo de trazas en §9.

---

## 3. POM, service objects y capas

Estructura, separación de responsabilidades y reglas (aplican a Playwright y siguen el estándar del usuario):

| Capa | Carpeta | Responsabilidad | Prohibido |
|---|---|---|---|
| Page objects | `pages/` | Locators y acciones de una pantalla (`AccesoPage.entrar(usuario, clave)`) | `expect` de negocio, datos literales |
| Componentes | `pages/components/` | Piezas reutilizables (menú, tarjeta de nivel, traductor) | Lógica de test |
| Service objects (API) | `api/services/` | Clientes tipados de rutas (`SesionService.login()`, `ContenidoService.get(ruta)`) | Selectores de UI |
| Steps | `steps/` | Traducen Gherkin a llamadas de page o service. Aquí viven las aserciones | Selectores, `waitForTimeout` |
| Fixtures | `fixtures/index.ts` | `createBdd(test)`, inyección de pages, `datos`, `axe` | Estado compartido entre tests |
| Datos | `data/<env>/*.yaml` + `support/data.ts` | Entradas y esperados por ambiente, validados con Zod | Secretos (van en `.env` o GitHub Secrets) |

- Locators por rol y texto de usuario (`getByRole`, `getByLabel`); `data-testid` solo como último recurso (https://playwright.dev/docs/best-practices).
- Las aserciones web-first (`expect(locator).toBeVisible()`, `toHaveURL`, `toHaveText`) viven en los steps `Entonces`, no dentro del POM. Excepción aceptable: métodos `esperarCargada()` que solo esperan carga, sin juicio de negocio.
- Los datos YAML se cargan con `yaml` y se validan con `zod`; si falta un campo, el test falla al arrancar con el archivo y el campo.
- Credenciales: el YAML guarda alias y roles. La contraseña real viene de `E2E_PASSWORD` en el entorno (R8: nunca en el repo).

---

## 4. Anti-patrones de espera y su reemplazo

| Anti-patrón | Reemplazo |
|---|---|
| `page.waitForTimeout(n)` o `sleep` | Aserción web-first (`await expect(loc).toBeVisible()`); o `expect.poll` / `expect(...).toPass()` para condiciones no DOM |
| `expect(await loc.isVisible()).toBe(true)` | `await expect(loc).toBeVisible()` (las no reintentables dan flakiness) |
| `waitForLoadState('networkidle')` | Esperar el elemento o la respuesta concreta: `const r = page.waitForResponse(...)` antes de la acción, `await r` después |
| `locator.count()` como espera | `await expect(loc).toHaveCount(n)` |
| Reintentos manuales en bucles | `expect.poll(() => fetchEstado()).toBe('listo')` |
| Timeouts globales enormes | `expect.timeout` y `actionTimeout` razonables; en CI `retries: 1` y trazas |

- Playwright ya espera por actionability (visible, estable, habilitado) antes de cada acción. No se necesitan esperas implícitas globales.
- No uses `cy.intercept` ni alias: eso es Cypress. El equivalente es `page.waitForResponse` o `page.route`.
- Lint: `eslint-plugin-playwright` 2.12.0 con `no-wait-for-timeout`, `no-networkidle`, `no-force-option`, `missing-playwright-await`, `prefer-web-first-assertions`. Hace cumplir esta tabla en CI.
- Ejemplo de comprobación de "0 peticiones durante la grabación" (RNF-PRI-02): registrar `page.on('request')` antes de la acción y aserción sobre el arreglo después; sin timeouts.

Fuentes: https://playwright.dev/docs/test-assertions, https://playwright.dev/docs/best-practices.

---

## 5. API y rutas protegidas en el mismo framework

- Proyecto `api` de Playwright sin navegador, usando el fixture `request` (respeta `baseURL` y `extraHTTPHeaders`). Fuente: https://playwright.dev/docs/api-testing.
- `request` y el contexto del navegador pueden compartir sesión con `storageState()`, lo que permite iniciar sesión por API una vez y reutilizarla en UI (https://playwright.dev/docs/auth).
- Matriz de rutas protegidas (RNF-SEG-04): `data/<env>/rutas.yaml` con ruta, método y resultado esperado sin sesión (redirección o 401). El test recorre el YAML. Usar `maxRedirects: 0` para comprobar el `302` y su `Location`, sin seguir la redirección.
- Next.js 16 renombró `middleware.ts` a `proxy.ts`. La guía oficial advierte que el proxy es una comprobación optimista y que la autorización real debe estar cerca de los datos (DAL). Eso justifica la matriz de rutas: prueba rutas y archivos de contenido y diccionario, no solo páginas. Fuente: https://nextjs.org/docs/app/guides/authentication (v16.3.8).
- Cookie de sesión (RNF-SEG-06): login por API y análisis de `set-cookie` (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path`).
- Cabeceras (RNF-SEG-05): un test que recorre N rutas del YAML y comprueba CSP (frames solo `youtube-nocookie.com`), HSTS, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy` (micrófono `self`) y `X-Content-Type-Options`. Si falta una, el mensaje debe indicar la ruta (escenario de EP4-HU02).
- Bloqueo por intentos (EP1-HU03): 5 fallos en 15 minutos. Marcarlo `@local-only` o usar un usuario inexistente distinto por ejecución; si no, bloqueas la cuenta de pruebas del preview.
- Datos secretos (usuario, contraseña, código de invitación): `E2E_USER`, `E2E_PASSWORD`, `E2E_INVITE_CODE` en el entorno.

```ts
// tests/api/services/rutas.service.ts (referencia)
export class RutasService {
  constructor(private request: APIRequestContext) {}
  async sinSesion(ruta: string) {
    return this.request.get(ruta, { maxRedirects: 0, headers: { cookie: '' } });
  }
}
```

---

## 6. Unit tests de la lógica

Recomendación: Vitest 5.0.3, con la configuración oficial de Next.js (https://nextjs.org/docs/app/guides/testing/vitest, v16.3.8, actualizada 2026-08-25).

```bash
npm i -D vitest@5.0.3 @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
```

- Por qué Vitest y no Jest: configuración mínima en TypeScript y ESM, y es el ejemplo oficial `with-vitest` de Next.js. Jest 30.5.2 sigue siendo válido (hay guía oficial), pero exige más transformación.
- Limitación oficial: Vitest no soporta Server Components `async`. Se pueden probar los síncronos; los `async` se cubren con E2E.
- Unit en funciones puras en `src/lib/domain/` (sin Next, sin red):
  - cálculo de nota y umbral del 80 % (EP7-HU01), desbloqueo de nivel;
  - selección del banco de preguntas con al menos 50 % distintas en el reintento (EP7-HU03);
  - exportar e importar progreso y rechazo de archivo inválido (EP2-HU03);
  - búsqueda del diccionario (encontrada, no encontrada, duplicados en vocabulario);
  - validación de esquema YAML de contenido (EP11-HU01, con Zod);
  - límite de intentos 5 en 15 minutos y entropía mínima del código (RNF-SEG-06).
- Cobertura: umbral informativo (no 100 %). Principio de §7: automatizar por riesgo.
- Las pruebas contra la base de datos (repositorios) van como integración con Postgres en Docker, no con mocks de SQL.

---

## 7. Accesibilidad, rendimiento y multi-viewport

### 7.1 axe-core (RNF-ACC-01)

- `@axe-core/playwright` 4.13.0 con `AxeBuilder`. Etiquetas WCAG: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` (la documentación oficial de Playwright lista hasta `wcag21aa`; `wcag22aa` es etiqueta de axe-core, por confirmar en https://github.com/dequelabs/axe-core/blob/develop/doc/API.md).
- Cumplir "0 violaciones serious o critical": filtrar por `impact`, y adjuntar el JSON al reporte con `testInfo.attach`.
- Playwright avisa de que la automatización solo detecta una parte de los problemas: los criterios manuales (foco, orden lógico, lector de pantalla) se quedan en el checklist.

```ts
// tests/fixtures/axe.ts (referencia)
import AxeBuilder from '@axe-core/playwright';
export async function auditar(page: Page, testInfo: TestInfo) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  await testInfo.attach('axe.json', { body: JSON.stringify(r.violations, null, 2), contentType: 'application/json' });
  return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
}
```

- Paso BDD: `Entonces la página no tiene violaciones de accesibilidad graves`, reutilizado en las páginas del MVP (inicio, lección, evaluación, vocabulario).
- Teclado (RNF-ACC-02): escenario propio con `page.keyboard.press('Tab')` y aserciones de foco (`toBeFocused`); tamaño de objetivos con `boundingBox()` >= 24x24.

### 7.2 Lighthouse CI (RNF-REN-01 y RNF-REN-02)

- `@lhci/cli` 0.15.1 usa Lighthouse 12.6.1 fijo. Lighthouse 13.5.0 existe pero `@lhci/cli` aún no lo adopta (requiere Node >= 22.19; búsqueda en abril a octubre sin versión nueva de LHCI). Es aceptable para un portfolio. Alternativa: ejecutar `lighthouse@13.5.0` directo y evaluar el JSON con un script propio.
- `treosh/lighthouse-ci-action` 12.6.2 usa `@lhci/cli` 0.15.1. Alternativa: `npx @lhci/cli@0.15.1 autorun` sin acción de terceros (menos dependencias de terceros, afín a R1).
- El preview está protegido: pasar el bypass por `settings.extraHeaders` (por confirmar el nombre exacto de la opción en la documentación de configuración de LHCI).

```js
// tests/lighthouserc.cjs (referencia)
module.exports = {
  ci: {
    collect: {
      url: [`${process.env.BASE_URL}/`, `${process.env.BASE_URL}/lecciones/a2-apis-rest`],
      numberOfRuns: 3,
      settings: { extraHeaders: JSON.stringify({ 'x-vercel-protection-bypass': process.env.VERCEL_BYPASS }) },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 204800 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse' },
  },
};
```

- Las páginas de lección requieren sesión: usar el `storageState` del proyecto `setup` y pasar la cookie por `extraHeaders` o ejecutar Lighthouse a través de Playwright. Si resulta complejo, medir inicio (pública) y una lección con la cookie.
- Los runners compartidos de GitHub son ruidosos. Por eso 3 ejecuciones (mediana) y recalibrar umbrales tras las primeras corridas.
- `resource-summary:script:size` mide transferencia, es una aproximación al presupuesto de 200 KB comprimidos (RNF-REN-02). El presupuesto formal de bundle en CI puede salir también de la salida de `next build`.

### 7.3 Navegadores y viewports

Ver §2.4. Resumen: Chromium con la suite completa, Firefox y WebKit con `@smoke or @responsive`, y el `Esquema del escenario` de viewports (360x800, 768x1024, 1366x768) como contenido BDD. Pruebas en iPhone y Android reales: manuales (requisitos §7).

---

## 8. Seguridad en CI (RNF-SEG-01 a 07)

### 8.1 Escáner de secretos: gitleaks

- Usar el binario o la imagen oficial, no la acción: `gitleaks/gitleaks-action` v3 pide licencia gratuita en repos de organización (https://github.com/gitleaks/gitleaks-action). En cuenta personal no hace falta, pero el binario evita la dependencia.
- `fetch-depth: 0` para escanear todo el historial (RNF-SEG-01 dice repo e historial).
- Añadir también un hook de pre-commit local. Salida con `--redact`.

```yaml
- uses: actions/checkout@v7
  with: { fetch-depth: 0 }
- name: gitleaks
  run: |
    docker run --rm -v "$PWD:/repo" ghcr.io/gitleaks/gitleaks:v8.30.1 \
      git /repo --redact --exit-code 1 --report-format sarif --report-path /repo/gitleaks.sarif
```
Por confirmar: que la etiqueta `ghcr.io/gitleaks/gitleaks:v8.30.1` exista (también se publica como `zricethezav/gitleaks`); alternativa: descargar el binario de https://github.com/gitleaks/gitleaks/releases.

### 8.2 Dependencias (RNF-SEG-02: 0 altas o críticas)

- Puerta bloqueante: `npm audit --omit=dev --audit-level=high` (devuelve código distinto de 0 solo si hay alta o crítica). Informativo: `npm audit --audit-level=high` incluyendo dev.
- Complemento: osv-scanner 2.6.0 sobre `package-lock.json`. Por confirmar: osv-scanner falla ante cualquier vulnerabilidad y no tengo verificado un filtro por severidad; úsalo como segunda opinión en modo informativo, o con su archivo de configuración de ignorados para excepciones justificadas.
- `google/osv-scanner-action` v2.6.0 ofrece flujos reutilizables para PR y programado; revisar su README antes de elegir la ruta del flujo.
- Dependabot (version updates y security updates) activado en el repo, con agrupación semanal.

### 8.3 ZAP baseline contra el preview de Vercel (RNF-SEG-03)

Hechos verificados:
- Imagen oficial: `ghcr.io/zaproxy/zaproxy:stable` (también `zaproxy/zap-stable`). La etiqueta `stable` se mueve en cada versión completa y se regenera mensualmente (https://www.zaproxy.org/docs/docker/about/). Para reproducibilidad, fijar una etiqueta de versión o un digest (por confirmar que `ghcr.io/zaproxy/zaproxy:2.17.0` exista; si no, fijar el digest de `stable`).
- Códigos de salida de `zap-baseline.py`: 0 correcto; 1 al menos un FAIL; 2 solo avisos; 3 otros fallos. Opciones: `-t`, `-c` (archivo de reglas), `-g` (generar plantilla), `-r`/`-J`/`-w`/`-x` (informes), `-m` (minutos de spider), `-z` (opciones ZAP), `-I` (no fallar por avisos). Fuente: https://www.zaproxy.org/docs/docker/baseline-scan/.
- El baseline es pasivo (spider limitado más reglas pasivas): no ataca. Aun así, no pude abrir la política de Vercel sobre pruebas de seguridad (404 en `vercel.com/docs/security/penetration-testing`). Antes de la primera ejecución, revisar los términos de Vercel; escanear solo tu propio preview.
- `zaproxy/action-baseline` v0.15.0 existe con entradas `target`, `rules_file_name`, `cmd_options`, `fail_action`, `allow_issue_writing`. Se prefiere `docker run` directo (menos terceros, y reproducible en local).

Diseño recomendado:
1. Bypass: ZAP no sabe del header de Vercel. Se inyecta con una regla del Replacer en `-z`. Sintaxis habitual de ZAP (por confirmar en una ejecución real):
   ```
   -z "-config replacer.full_list(0).description=vercel-bypass \
       -config replacer.full_list(0).enabled=true \
       -config replacer.full_list(0).matchtype=REQ_HEADER \
       -config replacer.full_list(0).matchstr=x-vercel-protection-bypass \
       -config replacer.full_list(0).regex=false \
       -config replacer.full_list(0).replacement=$VERCEL_BYPASS"
   ```
2. Cobertura de rutas internas: sin sesión, todo redirige al acceso y ZAP solo analiza esa pantalla. Para cubrir lecciones y APIs, añadir una segunda regla del Replacer que fije `Cookie: session=...` con la sesión de un usuario de prueba obtenida por el `setup` de Playwright (nunca la de un usuario real).
3. Reglas y excepciones: `-g` genera `.zap/rules.tsv`; marcar como `FAIL` las alertas medias y altas, y las justificadas como `IGNORE` con comentario y fecha (RNF-SEG-03: "0 medias sin justificar"). Este archivo versionado es la evidencia de la justificación.
4. Permisos: el directorio montado en `/zap/wrk` debe ser escribible (`chmod a+w`), si no, no se guardan los informes.

```bash
mkdir -p reports/zap && chmod a+w reports/zap
docker run --rm -v "$PWD/reports/zap:/zap/wrk:rw" -v "$PWD/.zap:/zap/rules:ro" \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t "$PREVIEW_URL" -c /zap/rules/rules.tsv -m 2 -r zap.html -J zap.json -w zap.md \
  -z "-config replacer.full_list(0)... "
```

- Checklist R4 automatizada (RNF-SEG-07), como paso de CI que falla si encuentra coincidencias en `app/`/`src/`, `next.config.*`, `vercel.json` y `.github/`: `localhost`, `127.0.0.1`, rangos privados (`10.`, `172.16-31.`, `192.168.`), `ngrok`, `cloudflared`, `tailscale`, `self-hosted`. Excluir `tests/data/local`, `docker-compose*.yml` y `.env.example`, donde `localhost` es legítimo.
- Token de Vercel: alcance mínimo y como secreto de GitHub (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

### 8.4 Preview de Vercel desde CI y bypass (EP4-HU01)

Hechos verificados (https://vercel.com/docs/deployment-protection, actualizada 2026-09-15):
- Standard Protection (todas las URL salvo dominios de producción) está disponible en todos los planes. Password Protection no existe en Hobby. Protection Bypass for Automation está disponible en todos los planes (https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation, actualizada 2026-09-16).
- Cabecera `x-vercel-protection-bypass: <secreto>`; opcionalmente `x-vercel-set-bypass-cookie: true`. El secreto se expone al despliegue como `VERCEL_AUTOMATION_BYPASS_SECRET`. Si se regenera, hay que volver a desplegar.

Dos formas de obtener la URL del preview:
- A) Vercel con integración Git y evento `repository_dispatch` `vercel.deployment.success` (el payload trae `client_payload.url`). Es lo que documenta Vercel (https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment). Problema: Vercel publica antes de que CI pase.
- B) Recomendada para EP4-HU01 ("publicar solo si CI pasa"): desactivar los despliegues automáticos con `"git": { "deploymentEnabled": false }` en `vercel.json` y desplegar desde Actions con `vercel pull`, `vercel build`, `vercel deploy --prebuilt` (guía oficial: https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel). Producción con `--prod` solo en `main` y con todos los jobs verdes.

Flujo recomendado de jobs:
```
estatico (lint, tipos, unit, gitleaks, npm audit, check R4)  ->
  e2e-local (Postgres service + app local; reporte para Pages)  ->
    preview (vercel deploy --prebuilt; rama Neon por PR)  ->
      puerta-preview (e2e @smoke @seguridad + axe + lhci + ZAP) ->
        produccion (solo main: vercel deploy --prebuilt --prod + humo @readonly)
```

---

## 9. Base de datos de prueba: Neon por rama o Postgres en Docker

Hechos verificados (https://neon.com/docs/introduction/plans y https://neon.com/docs/postgresql/postgres-version-policy):
- Plan Free: 10 ramas por proyecto, 100 CU-hora por proyecto al mes, autoescala hasta 2 CU, autosuspensión obligatoria a los 5 minutos, 1 GB por proyecto, ventana de restauración de 6 horas, transferencia de 5 GB al mes. Al agotar cómputo, el cómputo se suspende hasta el siguiente periodo.
- Postgres admitido: 14 a 18 (menores 18.6, 17.11, 16.15, 15.19, 14.24 en agosto de 2026). Postgres 14 llega a fin de vida el 2026-11-12. Elegir 17 o 18 y usar la misma mayor en Docker (comprobar con `SELECT version();`).
- Neon da `DATABASE_URL` (pooled) y `DATABASE_URL_UNPOOLED` (directa, para migraciones). Para arranques en frío, añadir `connect_timeout` a la cadena (https://neon.com/docs/guides/prisma).
- Acciones oficiales: `create-branch-action` 6.3.1, `delete-branch-action`, `reset-branch-action`, `schema-diff-action`; requieren el secreto `NEON_API_KEY` y la variable `NEON_PROJECT_ID` (https://neon.com/docs/guides/branching-github-actions).
- La integración nativa Vercel-Neon crea una rama por preview, pero (a) solo aplica a despliegues disparados por la integración Git de Vercel, que desactivamos en el flujo B, y (b) factura a través de Vercel (documentado); revisar contra R1/R3 antes de usarla.

Comparación:

| Criterio | Postgres en Docker (service container) | Rama Neon por PR |
|---|---|---|
| Velocidad y determinismo | Alta; sin cold start; arranque de segundos | Cold start tras 5 min; red externa |
| Coste y límites | 0; sin cuota | Cuota Free (10 ramas, 100 CU-h) |
| Fidelidad con producción | Misma mayor de Postgres, sin pooler PgBouncer | Idéntica (mismo motor, pooler, extensiones) |
| Aislamiento | Total por job | Total por rama (copy-on-write) |
| Preview en Vercel | No alcanzable (Vercel no ve tu contenedor) | Sí: el preview usa la cadena de la rama |
| Secretos | Ninguno | `NEON_API_KEY` en GitHub |
| Tercero | No | Sí (ya aceptado para la BD; ver R3) |

Recomendación (híbrida, pensando en R1 y en < 20 usuarios):
1. CI de cada PR (unit, integración y E2E local): Postgres en Docker con service container y la misma mayor que Neon. Es el que genera el reporte público de Pages.
2. Puerta sobre el preview (ZAP, Lighthouse, humo): una rama Neon por PR, creada con `create-branch-action`, migrada y sembrada con un script, y pasada al despliegue como variable de entorno de ejecución (por confirmar el flag `--env`/`-e` de `vercel deploy` en la versión 62.2.0). Borrar la rama al cerrar el PR y con un job nocturno de limpieza para no tocar el límite de 10.
3. Producción: nunca se ejecutan E2E mutantes contra ella. Solo humo de lectura (`@smoke @readonly`) con cuenta dedicada.
4. Credenciales de Neon con el mínimo alcance. Nunca la URL de producción en CI de PR.

---

## 10. Reportes, Pages y Docker

### 10.1 Qué se publica en GitHub Pages

- El HTML de Playwright incluye trazas, y las trazas incluyen cabeceras de petición. Contra el preview, esas cabeceras contienen `x-vercel-protection-bypass`. GitHub enmascara los secretos en los logs, no en los artefactos ni en Pages.
- Regla: Pages publica solo el reporte de la ejecución contra el stack local (Docker), que no usa secretos de Vercel. Los reportes de preview y ZAP van a artefactos con `retention-days: 14` y acceso restringido al repo. Si se quiere publicar ZAP y Lighthouse (no contienen el secreto, pero sí URLs del preview), revisar su contenido antes.
- Pages en repositorio privado requiere plan de pago. Para el portfolio el repo debe ser público (por confirmar la regla vigente en https://docs.github.com/en/pages). Esto refuerza R8: nada sensible en el repo ni en los reportes.
- Permisos del job de despliegue: `pages: write` e `id-token: write`, entorno `github-pages`, y `needs` del job de build (https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### 10.2 Reporte con sharding y fusión

La documentación oficial (https://playwright.dev/docs/test-sharding): reporter `blob` en CI, matriz `shardIndex`/`shardTotal`, `actions/download-artifact` con `pattern: blob-report-*` y `merge-multiple: true`, y `npx playwright merge-reports --reporter html ./all-blob-reports`. Con una muestra curada de 10-15 escenarios no hace falta shardear; usar el `blob` solo si se separan los proyectos en jobs.

```yaml
# .github/workflows/qa.yml (fragmento de referencia)
name: qa
on:
  pull_request:
  push: { branches: [main] }
  schedule: [{ cron: '0 6 * * 1' }]   # semanal: enlaces de YouTube y regresión
  workflow_dispatch:
permissions: { contents: read }
concurrency: { group: qa-${{ github.ref }}, cancel-in-progress: true }

jobs:
  e2e-local:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:17.11            # misma mayor que Neon; confirmar etiqueta
        env: { POSTGRES_PASSWORD: ci, POSTGRES_DB: app }
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s
          --health-timeout 5s --health-retries 10
    container:
      image: mcr.microsoft.com/playwright:v1.63.0-noble
      options: --ipc=host --init
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci && npm ci --prefix tests
      - run: npm run build && (npm start &) && npx wait-on http://localhost:3000
      - run: npx bddgen && npx playwright test
        working-directory: tests
        env: { TEST_ENV: local, DATABASE_URL: postgres://postgres:ci@postgres:5432/app }
      - uses: actions/upload-artifact@v7
        if: ${{ !cancelled() }}
        with: { name: playwright-report, path: tests/reports/html, retention-days: 14 }

  publicar-reporte:
    needs: e2e-local
    if: github.ref == 'refs/heads/main' && !cancelled()
    runs-on: ubuntu-latest
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }
    steps:
      - uses: actions/download-artifact@v8
        with: { name: playwright-report, path: site }
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with: { path: site }
      - id: deploy
        uses: actions/deploy-pages@v5
```

- Dentro de un `container:` el servicio Postgres se resuelve por nombre (`postgres`), no por `localhost`. Si la app corre en el mismo contenedor que los tests, `localhost:3000` sigue valiendo para la app.
- Cache: `setup-node` con `cache: npm` cubre `node_modules`. No cachear los navegadores de Playwright si se usa la imagen oficial (ya vienen incluidos).
- Programado (cron): job semanal que valida YouTube (EP11-HU02) y repite la batería sobre producción en modo humo.
- Badges en el README: estado del workflow (`https://github.com/<usuario>/<repo>/actions/workflows/qa.yml/badge.svg`) y enlace al reporte en Pages.

### 10.3 Docker

La imagen del runner de tests debe fijarse a la misma versión que `@playwright/test`; si no, Playwright no encuentra los navegadores.

```dockerfile
# tests/Dockerfile
FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /work
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV CI=1
CMD ["sh", "-c", "npx bddgen && npx playwright test"]
```

```yaml
# tests/docker-compose.yml
services:
  db:
    image: postgres:17.11           # confirmar etiqueta; misma mayor que Neon
    profiles: [local]
    environment: { POSTGRES_PASSWORD: local, POSTGRES_DB: app }
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: 5s, retries: 10 }
  e2e:
    build: .
    init: true
    ipc: host
    env_file: .env
    environment: { TEST_ENV: ${TEST_ENV:-local} }
    volumes:
      - ./reports:/work/reports       # extracción de reportes al host
```

- Banderas recomendadas por Playwright: `--init` y `--ipc=host`; `--cap-add=SYS_ADMIN` solo en local si Chromium no arranca. Alpine no está soportado (https://playwright.dev/docs/docker).
- Contra el preview no hace falta la BD de Docker. En el perfil `local` se levanta `db` y la app.
- Extracción de reportes: volumen `./reports` (HTML, `blob`, `zap`, `lighthouse`) o `docker cp` de un contenedor detenido.
- Fijar siempre versión: nada de `latest`. Para ZAP, ver §8.3.

---

## 11. Multiambiente y `.env`

- `TEST_ENV` en `local | preview | prod`. `tests/support/env.ts` valida con Zod y falla si falta algo. En `prod` el config acepta solo `@smoke and @readonly`; cualquier otro tag falla al arrancar.
- `.env` se ignora en git; `.env.example` se versiona con nombres y valores ficticios, sin secretos reales (R8).

```dotenv
# tests/.env.example
TEST_ENV=local                 # local | preview | prod
BASE_URL=http://localhost:3000 # preview: URL del despliegue; prod: dominio de producción
E2E_USER=alumno-ci
E2E_PASSWORD=
E2E_INVITE_CODE=
VERCEL_BYPASS=                 # solo preview; secreto de automatización de Vercel
DATABASE_URL=postgres://postgres:local@localhost:5432/app   # solo local
```

- Datos por ambiente: `data/local/*.yaml`, `data/preview/*.yaml`, `data/prod/*.yaml` (solo humo). El código lee `data/${TEST_ENV}`.
- En CI, los secretos van en GitHub Secrets (`E2E_PASSWORD`, `VERCEL_BYPASS`, etc.) y nunca se escriben en el repo, los logs ni los reportes publicados.

---

## 12. Estructura de carpetas: monorepo o repo separado

Recomendación: **monorepo con `tests/` autocontenido**.

```
app-ingles/
  src/ (o app/)                   # app Next.js; unit con Vitest junto al código (*.test.ts)
    lib/domain/                   # lógica pura (nota, desbloqueo, progreso, diccionario)
  content/                        # YAML de lecciones (EP11)
  scripts/                        # validador de contenido y de enlaces de YouTube
  tests/                          # framework E2E/BDD/API: se puede extraer a otro repo
    package.json  tsconfig.json  playwright.config.ts
    Dockerfile  docker-compose.yml  .env.example
    features/{acceso,evaluacion,traductor,video,seguridad,responsive}/*.feature
    steps/  fixtures/  pages/  pages/components/
    api/{services,specs}/
    data/{local,preview,prod}/*.yaml
    support/{env.ts,data.ts,schemas.ts}
    reports/                      # ignorado en git
  .zap/rules.tsv                  # reglas y excepciones justificadas de ZAP
  .github/workflows/{qa.yml,security.yml,deploy.yml}
  .github/PULL_REQUEST_TEMPLATE.md
  docs/ (requisitos, investigacion, decisiones)
```

Por qué monorepo para un portfolio:
- Un cambio de comportamiento y su prueba van en el mismo PR (lo que pide el flujo "una rama, un PR"). En repos separados habría PR cruzados y deriva de versiones.
- La puerta de despliegue (EP4-HU01) necesita que el pipeline de la app y las pruebas vivan juntos; con repos separados se complica `repository_dispatch` entre ellos y los permisos.
- Los tests comparten esquemas (Zod) y contratos de rutas con la app; el unit de lógica es imposible de separar.
- Un solo enlace para el reclutador, un solo README y un solo badge.
- Con `tests/` autocontenido (su propio `package.json`, `Dockerfile` y `compose`) se conserva la señal de "framework de QA presentable" y se puede extraer a otro repo apuntando solo `BASE_URL` (también sirve para mostrarlo contra otras apps).

Cuándo preferir repo separado: si el framework se reutiliza contra varias apps, o si distintos equipos son dueños de cada parte. No es el caso aquí. Mitigación del riesgo de "parece un solo proyecto": README propio en `tests/` con su arquitectura, comandos y capturas del reporte.

---

## 13. Calidad de código, Git y portfolio (resumen)

- Linter y formateador: ESLint 10.12.0 con `typescript-eslint` 8.71.0 y `eslint-plugin-playwright` 2.12.0 (reglas de §4), Prettier 3.9.9. Hook de pre-commit con gitleaks, lint-staged y commitlint (versiones de `husky` y `lint-staged` no verificadas en esta pasada).
- `.gitignore`: `node_modules`, `.next`, `.env`, `.env.*` salvo `.env.example`, `tests/reports/`, `tests/.features-gen/` (salida de `bddgen`, carpeta por defecto), `playwright/.auth/`, `test-results/`, `.vercel/`, `.zap/*.html`.
- Git: ramas `tipo/descripcion-kebab`, Conventional Commits en español, un PR por rama (estándar del usuario) y plantilla de PR con checklist de seguridad (R4, secretos, `@known-bug`).
- Qué suelen valorar reclutadores y tech leads en un portfolio QA (criterio general; no verificado con fuente primaria en esta pasada, conviene contrastarlo con otra investigación): README con arquitectura y cómo ejecutar en un comando, CI verde con badge y reporte público, tests fiables (sin `sleep`, 0 flakiness visible), decisiones documentadas (ADR) con compromisos, estrategia de qué se automatiza y por qué (§7), seguridad y accesibilidad como parte del pipeline, y muestra curada en vez de volumen.

---

## 14. Riesgos y puntos por confirmar al implementar

| # | Punto | Acción |
|---|---|---|
| 1 | `defineBddProject` y `tags` por proyecto en playwright-bdd 9.2.1 | Probar con `npx bddgen`; leer https://vitalets.github.io/playwright-bdd/ |
| 2 | Tags especiales `@fail`, `@fixme`, `@skip` | Confirmar en la documentación antes de basar `@known-bug` en ellos |
| 3 | Etiqueta Docker de ZAP fija (`2.17.0`) y de gitleaks (`v8.30.1`) | `docker pull` de la etiqueta; si no existe, fijar digest |
| 4 | Opción `extraHeaders` de LHCI y acceso a rutas con sesión | Probar con una URL del preview; si falla, usar Lighthouse CLI con Playwright |
| 5 | Replacer de ZAP para cabecera y cookie | Ejecutar un baseline real y revisar que ve rutas autenticadas |
| 6 | Política de Vercel sobre escaneos | Leer los términos antes del primer escaneo |
| 7 | Flag `--env` en `vercel deploy` para la cadena de la rama Neon | Probar con CLI 62.2.0 |
| 8 | Fecha de paso a LTS de Node 26 | Consultar el calendario oficial; mientras tanto Node 24 |
| 9 | osv-scanner y severidad | Usar `npm audit` como puerta; osv-scanner informativo |
| 10 | Etiqueta `postgres:17.11` (o 18.6) | Verificar que exista en Docker Hub |
| 11 | Versiones de `husky`, `lint-staged`, `commitlint` | No verificadas aquí |
| 12 | Pages con repo privado | Verificar la regla vigente; el portfolio debe ser público |

Los datos de fechas de algunos resúmenes automáticos de páginas web contenían años erróneos (por ejemplo, el resumen de releases de `playwright-bdd` mostraba "2024"). Las fechas de este informe provienen de los campos `published_at` de la API de GitHub y de `dist/index.json` de Node, que son consistentes entre sí.

---

## 15. Fuentes (consultadas 2026-10-04)

- Node: https://nodejs.org/dist/index.json, https://nodejs.org/en/about/previous-releases
- Playwright: https://github.com/microsoft/playwright/releases, https://playwright.dev/docs/docker, /docs/test-sharding, /docs/api-testing, /docs/auth, /docs/test-assertions, /docs/best-practices, /docs/accessibility-testing, /docs/test-reporters, /docs/ci-intro, /docs/api/class-testoptions
- playwright-bdd: https://github.com/vitalets/playwright-bdd (README, CHANGELOG, package.json, docs/configuration/options.md), https://api.github.com/repos/vitalets/playwright-bdd/releases/latest
- Cucumber: https://raw.githubusercontent.com/cucumber/cucumber-js/main/package.json, .../CHANGELOG.md, https://cucumber.io/docs/gherkin/languages/
- Next.js: https://nextjs.org/docs/app/guides/testing/vitest, /docs/app/guides/authentication, /docs/app/api-reference/config/typescript
- npm (registro): https://registry.npmjs.org/<paquete>/latest para next, vitest, vite, @vitejs/plugin-react, jsdom, @testing-library/react, jest, @axe-core/playwright, @lhci/cli, lighthouse, typescript-eslint, eslint, eslint-plugin-playwright, prettier, zod, yaml, dotenv, vercel
- TypeScript: https://api.github.com/repos/microsoft/TypeScript/releases
- Vercel: https://vercel.com/docs/deployment-protection, https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation, https://vercel.com/docs/deployments/environments, https://vercel.com/docs/project-configuration/git-configuration, https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel, https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment
- Neon: https://neon.com/docs/introduction/plans, https://neon.com/docs/guides/branching-github-actions, https://neon.com/docs/guides/vercel-managed-integration, https://neon.com/docs/postgresql/postgres-version-policy, https://neon.com/docs/guides/prisma
- PostgreSQL: https://www.postgresql.org/support/versioning/
- ZAP: https://www.zaproxy.org/docs/docker/baseline-scan/, https://www.zaproxy.org/docs/docker/about/, https://www.zaproxy.org/download/, https://github.com/zaproxy/action-baseline
- gitleaks: https://github.com/gitleaks/gitleaks/releases, https://github.com/gitleaks/gitleaks-action
- osv-scanner: https://github.com/google/osv-scanner/releases, https://github.com/google/osv-scanner-action
- GitHub Actions: https://api.github.com/repos/actions/{checkout,setup-node,cache,upload-artifact,download-artifact,upload-pages-artifact,deploy-pages,configure-pages}/releases/latest, https://github.com/treosh/lighthouse-ci-action, https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Lighthouse CI: https://api.github.com/repos/GoogleChrome/lighthouse-ci/releases/latest
