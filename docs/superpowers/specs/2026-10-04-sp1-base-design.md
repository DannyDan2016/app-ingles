---
proyecto: app-ingles
subproyecto: SP1 — Base
estado: aprobado (2026-10-04); ajustes en el plan docs/superpowers/plans/2026-10-04-sp1-base.md
fecha: 2026-10-04
fuentes: docs/requisitos.md · _cerebro/10-proyectos/app-ingles/decisiones.md
---
# SP1 — Base: diseño

## 1. Objetivo
Dejar publicada en Vercel una app privada y segura donde un usuario invitado se registra, inicia sesión, elige su nivel (A2 por defecto para el MVP) y ve su mapa de niveles. El framework de QA y la puerta de seguridad quedan funcionando. Todo lo que construyan SP2–SP5 se apoya en esta base.

**Hecho cuando:**
- Hay una URL de producción en Vercel accesible desde el celular y desde el PC.
- El flujo invitación → registro → login → mapa de niveles pasa en E2E en 3 viewports.
- La puerta de seguridad (sección 7) está en verde y `auditor-seguridad-web` da veredicto PASA.
- No hay nada que apunte al PC del usuario (RNF-SEG-07).

## 2. Restricciones (de decisiones.md)
- Coste 0: Vercel Hobby y Neon Free.
- Únicos terceros: Vercel, Neon, GitHub y YouTube embebido (este último llega en SP2).
- Sin LLM en la app.
- Hasta 10 usuarios, cada uno en un solo dispositivo; no se diseña sincronización entre dispositivos.
- Repo **público** en GitHub, porque es para el portfolio. Por eso, ningún secreto en el repo.

## 3. Stack
| Capa | Elección | Por qué |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript estricto | Nativo de Vercel; UI y API en un solo proyecto, sin servidor propio. |
| Estilos | Tailwind CSS + tokens de la skill `disenador-ui-accesible` | Mobile-first, accesible y consistente. |
| Base de datos | Neon Postgres vía `pg` (URL pooled) | Gratis; un solo driver para local, CI y producción. |
| ORM y migraciones | Drizzle ORM + drizzle-kit | Tipado, migraciones SQL versionadas en el repo y sin runtime pesado. |
| Hash | argon2id (`@node-rs/argon2`) | Estándar OWASP para contraseñas. |
| Validación | zod | Validación de entrada en el servidor en todas las acciones. |
| Local / CI | Postgres en Docker (`docker compose`) | No toca Neon al desarrollar ni en el CI. |

Las versiones exactas se fijan en el plan, a partir de `docs/investigacion/stack-qa.md` y de la investigación de dependencias.

## 4. Arquitectura

```
Navegador ──HTTPS──> Vercel (Next.js)
                       ├─ proxy.ts           → exige sesión en todo salvo /login, /registro, /api/salud
                       ├─ app/(publico)      → login, registro con invitación
                       ├─ app/(app)          → inicio, mapa de niveles, ajustes
                       ├─ app/api/...        → route handlers (contenido protegido en SP2)
                       └─ lib/
                           ├─ auth/          → hash, sesiones, rate limit, invitaciones (sin dependencias de UI)
                           ├─ progreso/      → reglas de nivel (funciones puras)
                           └─ db/            → esquema Drizzle + cliente
                     ──TLS──> Neon Postgres
```

Unidades con una sola responsabilidad:
- `lib/auth` no conoce Next.js: recibe datos y devuelve resultados. Se prueba con unit tests.
- `lib/progreso` son funciones puras (estado de cada nivel a partir del progreso). Con unit tests.
- Las páginas y acciones de servidor solo orquestan: validan con zod, llaman a `lib` y renderizan.

## 5. Modelo de datos (SP1)
| Tabla | Campos clave | Notas |
|---|---|---|
| `users` | id (uuid), alias (único, 3-20 chars), password_hash, rol (`admin`/`aprendiz`), nivel_inicial, created_at | Sin email ni datos personales (RNF-PRI-03). |
| `invites` | id, code_hash, creado_por, expira_at, usado_por, usado_at, revocado_at | Se guarda solo el **hash** del código. Un solo uso; caduca en 7 días. |
| `sessions` | id_hash, user_id, expira_at, created_at | Token aleatorio de 256 bits en la cookie; en la BD solo su hash. Caduca a los 30 días (duración fija). |
| `login_attempts` | alias, ip_hash, at | Rate limit: 5 fallos por 15 min por alias y 20 por IP. |
| `progress` | user_id, nivel, leccion_id, completada_at | Las lecciones vienen de YAML (SP2); en SP1, solo el estado de nivel. |

Los niveles A1–C2 son constantes en el código, no una tabla.

## 6. Flujos
1. **Primer admin:** script `npm run admin:crear` que se ejecuta una vez en local contra Neon, con la URL de conexión en una variable de entorno que no se guarda. Crea al usuario admin. No existe ningún endpoint de alta de admin.
2. **Invitar:** el admin genera una invitación en `/admin/invitaciones` → se muestra **una sola vez** el enlace `https://<app>/registro?c=<código>`. Puede revocarla.
3. **Registrarse:** con un código válido → alias + contraseña (mínimo 12 caracteres, sin más reglas de composición; NIST 800-63B) → la invitación queda usada → se inicia sesión.
4. **Login / logout:** si falla, el mensaje es genérico («Usuario o contraseña incorrectos»). Al cerrar sesión se borra la sesión en la BD y en la cookie.
5. **Nivel inicial:** en el primer acceso se elige el nivel (por defecto A2); los niveles anteriores quedan «Omitido». No se vuelve a preguntar.
6. **Mapa de niveles:** A1–C2 con estado `Aprobado` / `En curso` / `Omitido` / `Bloqueado` y el % de lecciones (0 % hasta que exista SP2).

Historias cubiertas:
- EP1: se reescribe así → HU01 = registro por invitación, HU02 = revocar invitación, HU03 = login con usuario y contraseña. Todas son Must.
- EP2-HU01, EP2-HU02 y EP2-HU03 (progreso en servidor; ya no hace falta exportar ni importar).
- EP3-HU01, EP4-HU01 y EP4-HU02.
- EP2-HU04 (prueba de ubicación) queda fuera del SP1.

## 7. Seguridad (requisito duro)
- **No exponer el PC:**
  - La app y la BD viven solo en Vercel y Neon.
  - El CI corre solo en runners `ubuntu-latest` de GitHub.
  - Sin túneles; el código no contiene `localhost` fuera de `docker-compose` y `.env.example`. Un check del CI lo vigila.
  - Postgres local solo escucha en `127.0.0.1`.
- **Secretos:**
  - Solo en las variables de entorno de Vercel (por entorno) y en GitHub Environments.
  - `.env*` en `.gitignore`; solo se versiona `.env.example`, sin valores.
  - gitleaks bloqueante en el CI.
- **Sesión:** cookie `__Host-sesion` con `HttpOnly`, `Secure`, `SameSite=Lax` y `Path=/`. Protección CSRF con la verificación de origen de las Server Actions + SameSite.
- **Cabeceras** (en `next.config`): CSP con nonce, `frame-ancestors 'none'`, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva y `X-Content-Type-Options: nosniff`. En SP2 se añadirá `frame-src` para youtube-nocookie.
- **Previews de Vercel** protegidas (Vercel Authentication) y conectadas a una rama de Neon aparte, no a producción.
- **Dependencias:** `npm audit` / osv-scanner bloqueante (altas y críticas) y Dependabot activado.
- **Puerta antes de publicar:** gitleaks + auditoría de dependencias + pruebas de cabeceras y rutas + ZAP baseline contra la preview + checklist R4. El responsable es `auditor-seguridad-web`; el procedimiento de Vercel sigue la skill `deploy-vercel-seguro`.

## 8. Errores
- Las acciones de servidor devuelven errores tipados, no excepciones a la UI. El usuario ve mensajes en español sin detalles internos.
- La BD dormida (Neon suspendido) puede tardar ~1 s en arrancar; se muestra un estado de carga y no se trata como error.
- Las páginas `not-found` y `error` son propias y no filtran stack traces (en producción `NODE_ENV=production`).

## 9. QA del SP1
Se sigue el estándar del portfolio (POM, datos en YAML por ambiente, multiambiente `local`/`preview`/`prod` con solo humo en prod, BDD en español, Docker, CI y reporte en GitHub Pages). Las herramientas y versiones exactas salen de `docs/investigacion/stack-qa.md`.

| Nivel | Qué |
|---|---|
| Unit | Hash y verificación, generación y validación de invitaciones (caducada, usada, revocada), sesiones (caducidad y renovación), rate limit, reglas de estado de nivel. |
| API / rutas | Toda ruta protegida sin sesión → redirección o 401. Cabeceras presentes en todas las respuestas. |
| E2E BDD (es) | Registro con invitación válida e inválida; login correcto y bloqueado por intentos; ruta interna sin sesión → login; elegir nivel A2 → mapa correcto. En 360×800, 768×1024 y 1366×768, con axe (0 serious/critical). |
| Seguridad | La puerta de la sección 7. |
| Manual | Prueba en un celular real (Android y, si hay, iPhone) y una sesión exploratoria de 30 min al cerrar el SP1. |

Muestra curada del SP1 para el portfolio: unos 5 escenarios BDD (de los 10-15 del proyecto).

## 10. Repo y forma de trabajo
- Repo `app-ingles` (público), rama `main` protegida y una rama por funcionalidad con PR. Se fusiona en orden, sin squash, como en el portfolio.
- Estructura: `app/`, `lib/`, `content/` (SP2), `tests/{unit,api,e2e,features}`, `docs/`, `.github/workflows/`, `docker-compose.yml`.
- Conventional Commits.
- **Reparto:**
  - Opus: plan y revisión.
  - Sonnet: implementación con `subagent-driven-development` + TDD.
  - `qa-implementer`: framework de tests.
  - `auditor-seguridad-web`: la puerta.
  - `verificador`: evidencia de cada entrega.
  - Ollama: microcopy, textos de ayuda y borradores, siempre con revisión.

## 11. Fuera de alcance del SP1
Contenido y lecciones (SP2), traductor (SP2), evaluaciones (SP3), speaking (SP4), recordatorios y PWA (SP5), recuperar contraseña por email (no hay email; el admin la resetea con un script), prueba de ubicación, internacionalización de la UI (solo en español).
