# SP5 — Recordatorios (.ics) y PWA instalable

- **Fecha:** 2026-10-15 · **Estado:** borrador, pendiente de revisión del usuario
- **Depende de:** SP3 en producción (`79e5c6b`).
- **Insumos:** [requisitos](../../requisitos.md) (EP10-HU01, EP10-HU02; P6), decisión 2026-10-04 «`.ics` primero, push opcional».
- **Enfoque:** spec corto de flujo feliz para avanzar rápido. Pruebas solo de happy path + seguridad importante.

## 1. Objetivo y criterio de éxito

Que el aprendiz mantenga el hábito: su celular le avisa aunque la app esté cerrada y puede abrir la app como una más.

**Éxito:** en Perfil elijo lunes a viernes, 19:00 y 20 min, pulso «Añadir a mi calendario» y mi calendario (iPhone, Android o PC) crea un evento semanal con alarma a la hora. En Chrome/Android instalo la app con un botón; en iPhone sigo las instrucciones «Compartir → Añadir a pantalla de inicio». La app abre a pantalla completa en `/hoy` con su icono y nombre.

## 2. Alcance

**Incluye:** ruta `GET /api/recordatorio` que devuelve un `.ics`, generador puro, tarjeta «Recordatorio» y tarjeta «Instalar la app» en Perfil, `manifest.ts`, iconos generados con `ImageResponse`, metadatos Apple, rutas públicas exactas para manifest e iconos.

**Fuera (YAGNI):**
| Qué | Motivo |
|---|---|
| Notificaciones push (EP10-HU03) | Servicio push de terceros, cron del plan gratis, iPhone. Decisión 2026-10-15: fuera de SP5 |
| Service worker / modo sin conexión | No hace falta para instalar; evita caché obsoleta y cambios de CSP |
| Guardar preferencias del recordatorio | El recordatorio vive en el calendario del usuario |
| Suscripción `webcal://` | Exigiría endpoint público con token |

## 3. Decisiones (brainstorming 2026-10-15)

| # | Decisión |
|---|---|
| D1 | Alcance: `.ics` + PWA, sin push |
| D2 | `.ics` servido por el servidor (no Blob en el cliente): Safari de iPhone abre «Añadir al calendario» directamente |
| D3 | Hora **flotante** (sin `TZID`): «19:00» es la hora local del dispositivo; sin `VTIMEZONE` |
| D4 | Sin service worker |
| D5 | UI en Perfil; duración por defecto = meta diaria del usuario |

## 4. Diseño

### 4.1 Generador `.ics` — `src/lib/recordatorio/ics.ts`
Función pura `generarIcs({ dias, hora, minutos, appUrl, ahora })` → `string`.
- `VCALENDAR` (`VERSION:2.0`, `PRODID:-//app-ingles//recordatorio//ES`, `CALSCALE:GREGORIAN`) con un `VEVENT`:
  - `UID` aleatorio `@app-ingles`, `DTSTAMP` en UTC desde `ahora`.
  - `DTSTART` flotante = próxima fecha de uno de los días elegidos a la `hora` (fecha local Bogotá como referencia, `src/lib/tiempo/bogota`); `DURATION:PT{minutos}M`.
  - `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,...`.
  - `SUMMARY:Inglés técnico — {minutos} min`, `DESCRIPTION` y `URL` con `{appUrl}/hoy`.
  - `VALARM` con `ACTION:DISPLAY`, `TRIGGER:PT0M`, `DESCRIPTION`.
- RFC 5545: líneas con CRLF, plegado a 75 octetos, escape de `\ ; , \n` en texto.

### 4.2 Validación — `src/lib/recordatorio/parametros.ts`
Esquema zod sobre la query: `dias` (lista de `L,M,X,J,V,S,D`, al menos uno, sin repetidos), `hora` (`HH:MM` 00:00–23:59), `min` (entero 5–120).

### 4.3 Ruta — `src/app/api/recordatorio/route.ts`
- `GET` con sesión (`requireUser`; sin sesión el proxy ya responde 401).
- Parámetros inválidos → 400 `{ error: 'parametros_invalidos' }`.
- OK → 200, `Content-Type: text/calendar; charset=utf-8`, `Content-Disposition: attachment; filename="recordatorio-ingles.ics"`, `Cache-Control: no-store`.
- `appUrl` = `APP_URL` (ya configurada).

### 4.4 PWA
- `src/app/manifest.ts`: `name: "App de inglés técnico"`, `short_name: "Inglés"`, `start_url: "/hoy"`, `display: "standalone"`, `background_color`/`theme_color` de los tokens de «Terminal Calma», iconos 192, 512 y 512 `purpose: "maskable"`.
- Iconos con `ImageResponse` (`next/og`), sin binarios nativos (Smart App Control): rutas de iconos estáticas generadas en build; `apple-touch-icon` 180.
- `layout.tsx`: `metadata.appleWebApp` (`capable`, `title`, `statusBarStyle`) y `viewport.themeColor` (claro/oscuro).
- `PUBLIC_PATHS` añade **solo** las rutas exactas del manifest y de cada icono (el login debe poder instalarse). Sin comodines.

### 4.5 UI en Perfil (skill `disenador-ui-accesible`)
- **Tarjeta «Recordatorio»** (componente cliente): casillas L–D (L–V marcadas por defecto), campo `time` (19:00 por defecto), selector de duración (por defecto la meta diaria). Botón «Añadir a mi calendario» = enlace a `/api/recordatorio?...`. Sin días marcados: botón deshabilitado y texto «Elige al menos un día». Texto breve: «Tu calendario te avisará aunque la app esté cerrada».
- **Tarjeta «Instalar la app»** (componente cliente): si llega `beforeinstallprompt`, botón «Instalar»; en iOS (sin ese evento) instrucciones «Compartir → Añadir a pantalla de inicio»; si `display-mode: standalone`, no se muestra.

## 5. Seguridad
- `/api/recordatorio` protegida por sesión; no lee ni escribe datos del usuario; salida generada solo con valores validados (sin inyección de líneas en el `.ics`).
- Rutas públicas nuevas: solo manifest e iconos, exactas; test estático de guardas actualizado.
- Sin cambios de CSP ni `Permissions-Policy`. Sin terceros nuevos.

## 6. Pruebas (happy path + seguridad)
- **Unit:** `generarIcs` con L–V 19:00 20 min contiene `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`, `DURATION:PT20M`, `TRIGGER:PT0M` y líneas CRLF.
- **Integración/seguridad:** `/api/recordatorio` sin sesión → 401; `PUBLIC_PATHS` exacto (test existente actualizado).
- **E2E:** en Perfil, pulsar «Añadir a mi calendario» descarga un `.ics` con el evento; `/manifest.webmanifest` se sirve sin sesión con nombre e iconos.
- **Puertas existentes:** check:no-pc, gitleaks, npm audit, E2E Docker, ZAP en la puerta del deploy, auditor y verificador en producción.
- **Manual (usuario):** importar el `.ics` en el celular e instalar la PWA en iPhone/Android.
