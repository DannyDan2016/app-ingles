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
- **CSP con nonce**: `src/proxy.ts` genera un nonce por petición; `script-src 'self' 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `frame-ancestors 'none'`, `frame-src https://www.youtube-nocookie.com`, `base-uri 'self'`, `form-action 'self'`.
- **YouTube (SP2)**: `frame-src` solo `https://www.youtube-nocookie.com`; `img-src` añade `https://i.ytimg.com` (miniaturas). `script-src` no cambia: no hay hosts nuevos; la IFrame API (`https://www.youtube.com/iframe_api`) entra por `strict-dynamic` porque la inyecta un script con nonce, y solo tras pulsar «Reproducir» (`VideoFacade`, `cargarApiYouTube`). Sin COEP. Antes del clic no hay `<iframe>` ni peticiones a YouTube. Resultado del spike en navegador: pendiente (ver informe de A4); si la IFrame API chocara con la CSP se dejaría `api` desactivado (0,75x con el control nativo), sin abrir `script-src`.
- **Cabeceras** (desde `next.config.ts`, definidas en `src/lib/security/csp.ts`): HSTS con preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Resource-Policy: same-origin`. Verificadas en `tests/api/cabeceras.spec.ts`.
- **Rate limit**: por IP y por alias en el login (lockout de 5 fallos en 15 minutos).
- **Purga de `login_attempts` y `sessions`**: oportunista (probabilidad 1/20) tras un login correcto, un fallo de login o un fallo de registro (los fallos anónimos son quienes generan las filas). Corre con `after()` de `next/server`, tras responder, y borra como máximo 1000 filas por tabla y ejecución, apoyada en los índices `login_attempts(at)` y `sessions(expira_at)`. Si falla, solo registra el error.
- **Hosts locales**: `src/lib/net/local-host.ts` es la única allowlist explícita (`localhost`, `127.0.0.1`, `::1`, `db` —servicio de docker compose— y los nombres extra de `DB_LOCAL_HOSTS`, separados por comas). Nada de «sin punto = local»: un host como `postgres` o `2130706433` se trata como remoto (TLS verificado). La guardia no-PC solo exime a ese helper y a su test.
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

- **`/favicon.ico`, `/_next/static` y `/_next/image` sin CSP**: están excluidos del matcher del proxy. Son ficheros públicos que no son HTML; el resto de cabeceras sí llegan desde `next.config`.
- **`Permissions-Policy microphone=()`**: se abrirá más adelante (micrófono solo para `self` en SP4).
- **YouTube (SP2), ya abierto**: `frame-src https://www.youtube-nocookie.com` e `img-src https://i.ytimg.com` (miniaturas de la facade), solo con esos orígenes; `script-src` no cambia (la IFrame API entra por `strict-dynamic` solo tras el clic). Nunca añadir COEP (`Cross-Origin-Embedder-Policy`): bloquearía el iframe y las miniaturas. Spike de navegador pendiente de verificación por el controlador.

### Autenticación y rate limit

- **`x-forwarded-for`**: se confía solo porque Vercel lo sobrescribe.
- **`ipHash`**: sha256 sin sal, e IPv6 sin agrupar por /64. Aceptado para ≤10 usuarios.
- **Carrera check/record del rate limit**: acotada por la latencia de argon2.
- **Lockout por alias** (5 fallos en 15 minutos): permite bloquear a propósito un alias conocido. DoS aceptado.
- **Enumeración**: el login responde con mensaje genérico y hash señuelo (sin enumeración anónima). El registro revela «Ese usuario ya existe» solo a quien tiene una invitación válida.
- **`src/proxy.ts` es optimista**: solo comprueba que exista la cookie. La validación real está en `requireUser` y `requireAdmin`. **Regla: todo route handler `/api/*` futuro debe llamar a `requireUser()` dentro del handler.**
- **Regla del grupo `(app)`: toda `page.tsx` y toda server action exportada de `src/app/(app)` llama a `requireUser()` o `requireAdmin()`; el layout NO protege** (no consulta la BD para que `loading.tsx` cubra el arranque en frío). Lo exige el test estático `src/lib/auth/guardas-app.test.ts`; la única excepción es `salir/actions.ts` (cerrar sesión debe poder limpiar una cookie caducada).
- **Comportamiento con cookie inventada** (verificado en la build de producción y en `tests/api/rutas-protegidas.spec.ts`): una página protegida responde **200** con streaming, no 307, porque `loading.tsx` ya ha enviado la cabecera. El cuerpo lleva `<meta http-equiv="refresh" content="1;url=/login">` y el `NEXT_REDIRECT` de `requireUser`; contiene solo la navegación estática del layout («Inglés técnico», «Salir») y ningún dato protegido ni el enlace «Invitaciones». El navegador acaba en `/login`.
- **Enlace de invitación con `?c=`**: un solo uso y caduca en 7 días; los logs de Vercel pueden registrar la query.

### CI y dependencias

- **Digest de gitleaks**: la imagen se fija por digest dentro de un `run:` de `ci.yml`, donde Dependabot no la ve; el digest se actualiza a mano al revisar las versiones de gitleaks.
- **Trazas de Playwright** en el artefacto y en Pages del repositorio público: pueden contener la contraseña de `admin_e2e`, que es efímera (`openssl rand`, BD desechable del job). Aceptado.
- **Dependencias de desarrollo**: `npm audit --omit=dev --audit-level=high` = 0 (es el gate de CI). Las altas restantes son transitivas de lint (fast-glob, micromatch, braces; ReDoS) y del loader de drizzle-kit (servidor de desarrollo de esbuild). No llegan al bundle; las vigila Dependabot.

## Pendiente manual

- Verificar en los paneles que `DATABASE_URL` (Vercel) y `DATABASE_URL_UNPOOLED` (GitHub) de cada entorno apuntan a la rama Neon correcta (`main` para producción, `preview` para preview).
