# Seguridad

Modelo de amenazas y controles de app-ingles (SP1). La app es privada, de acceso solo por invitación y para pocos usuarios (≤10). El riesgo máximo es el acceso no autorizado y la exposición del PC del autor.

## Modelo de amenazas

| Activo | Amenaza | Control principal |
| --- | --- | --- |
| Cuentas y progreso | Fuerza bruta, robo de contraseñas, enumeración de usuarios | argon2id, rate limit, lockout por alias, mensaje de login genérico |
| Acceso a la app | Registro sin permiso | Alta solo con invitación de un solo uso y caducidad |
| Sesión | Robo o fijación de cookie | Cookie `__Host-` `Secure`, `HttpOnly`, `SameSite=Lax` |
| Navegador del usuario | XSS, clickjacking, carga de recursos ajenos | CSP con nonce y `strict-dynamic`, cabeceras de seguridad |
| PC del autor | Que el despliegue exponga archivos o servicios locales | Guardia no-PC (`npm run check:no-pc`), la app solo escucha en 127.0.0.1 en local |
| Cadena de suministro y despliegue | Secretos filtrados, dependencias vulnerables, deploy sin control | gitleaks, `npm audit`, Dependabot, GitHub Environments |

## Controles

- **Autenticación**: contraseñas con argon2id (`crypto.argon2` de Node 24). Login con mensaje genérico y hash señuelo cuando el alias no existe.
- **Invitaciones**: enlace de un solo uso que caduca a los 7 días y puede revocarse. El registro exige invitación válida.
- **Cookies**: en producción la sesión es `__Host-sesion` (`Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`). Solo en el stack local sobre http se usa `sesion` sin `Secure`.
- **CSP con nonce**: `proxy.ts` genera un nonce por petición; `script-src 'self' 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `frame-ancestors 'none'`, `frame-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- **Cabeceras** (desde `next.config.ts`, definidas en `src/lib/security/csp.ts`): HSTS con preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-origin`. Verificadas en `tests/api/cabeceras.spec.ts`.
- **Rate limit**: por IP y por alias en el login (lockout de 5 fallos en 15 minutos).
- **Guardia no-PC**: `npm run check:no-pc` falla si el repositorio o la configuración pueden exponer el PC del autor.
- **TLS a Neon**: `sslmode=verify-full` forzado en código (`src/lib/db/ssl-url.ts`, usado por `client.ts` y `drizzle.config.ts`) para hosts remotos.
- **CI/CD**: `ci.yml` (lint, tipos, unit, integración, E2E, `npm audit --omit=dev --audit-level=high`, gitleaks con la imagen fijada por digest) y `deploy.yml` con GitHub Environments: `preview` → puerta de seguridad (E2E/API + ZAP baseline) → `production` con revisor obligatorio. Los secretos viven por environment.
- **ZAP**: escaneo baseline sobre `/login` del preview como puerta antes de producción. Las reglas en WARN y sus justificaciones están más abajo.

## Riesgos aceptados y justificaciones

### Hallazgos de ZAP

- **10031 (parámetros reflejados en el DOM)**: falso positivo. ZAP muta los campos ocultos `$ACTION_*` de las Server Actions. Se probó `?alias="><script>` en producción: aparece solo codificado como URL en el payload RSC dentro de un `<script nonce>`. La CSP con nonce y `strict-dynamic` lo mitigaría igualmente.
- **10050 y 10109**: informativas (cabecera `Age` de la CDN en estáticos con hash; detección de aplicación moderna).
- **90004 (aislamiento de origen cruzado)**: se añadieron COOP y CORP. COEP no: no hay `SharedArrayBuffer` y solo arriesgaría romper recursos. `frame-ancestors 'none'` ya impide el framing.
- **10098 en WARN (ACAO `*`)**: la CDN de Vercel sirve los estáticos públicos con `Access-Control-Allow-Origin: *`; no contienen datos de usuario. Las rutas propias no devuelven ACAO (`tests/api/cabeceras.spec.ts` y `curl` con un `Origin` ajeno). `OUTOFSCOPE` excluye instancias, pero ZAP 2.17.0 cuenta el FAIL como «x 0»; está corregido en ZAP weekly D-2026-09-30. Cuando salga una versión estable posterior a 2.17.0 se repinea el digest y se pasa a `10098 FAIL` más `10098 OUTOFSCOPE <regex de estáticos>`.

### Cabeceras y rutas

- **`/favicon.ico` y `/_next/static` sin CSP**: están excluidos del matcher del proxy. Son ficheros públicos que no son HTML; el resto de cabeceras sí llegan desde `next.config`.
- **`Permissions-Policy microphone=()` y `frame-src 'none'`**: se abrirán más adelante (micrófono solo para `self` en SP4; `frame-src` a `youtube-nocookie` en SP2).

### Autenticación y rate limit

- **`x-forwarded-for`**: se confía solo porque Vercel lo sobrescribe.
- **`ipHash`**: sha256 sin sal, e IPv6 sin agrupar por /64. Aceptado para ≤10 usuarios.
- **Carrera check/record del rate limit**: acotada por la latencia de argon2.
- **Lockout por alias** (5 fallos en 15 minutos): permite bloquear a propósito un alias conocido. DoS aceptado.
- **Enumeración**: el login responde con mensaje genérico y hash señuelo (sin enumeración anónima). El registro revela «Ese usuario ya existe» solo a quien tiene una invitación válida.
- **`proxy.ts` es optimista**: solo comprueba que exista la cookie. La validación real está en `requireUser` y `requireAdmin`. **Regla: todo route handler `/api/*` futuro debe llamar a `requireUser()` dentro del handler.**
- **Enlace de invitación con `?c=`**: un solo uso y caduca en 7 días; los logs de Vercel pueden registrar la query.

### CI y dependencias

- **Trazas de Playwright** en el artefacto y en Pages del repositorio público: pueden contener la contraseña de `admin_e2e`, que es efímera (`openssl rand`, BD desechable del job). Aceptado.
- **Dependencias de desarrollo**: `npm audit --omit=dev --audit-level=high` = 0 (es el gate de CI). Las altas restantes son transitivas de lint (fast-glob, micromatch, braces; ReDoS) y del loader de drizzle-kit (servidor de desarrollo de esbuild). No llegan al bundle; las vigila Dependabot.

## Pendiente manual

- Verificar en los paneles que `DATABASE_URL` (Vercel) y `DATABASE_URL_UNPOOLED` (GitHub) de cada entorno apuntan a la rama Neon correcta (`main` para producción, `preview` para preview).
