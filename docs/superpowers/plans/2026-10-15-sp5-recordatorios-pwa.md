# SP5 — Recordatorios (.ics) y PWA — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el aprendiz descargue desde Perfil un recordatorio `.ics` semanal con alarma e instale la app como PWA.

**Architecture:** Generador `.ics` puro + validación zod en `src/lib/recordatorio/`, servido por `GET /api/recordatorio` con sesión. PWA con `src/app/manifest.ts` e iconos como route handlers estáticos con `ImageResponse` (sin service worker). Dos tarjetas cliente en Perfil.

**Tech Stack:** Next.js 16.4 (App Router, `proxy.ts`), TypeScript, zod 4, Tailwind 4, Vitest (unit), Playwright (E2E en `tests/`, Docker).

**Spec:** [`docs/superpowers/specs/2026-10-15-sp5-recordatorios-pwa-design.md`](../specs/2026-10-15-sp5-recordatorios-pwa-design.md)

## Global Constraints

- Lee `AGENTS.md`: esta versión de Next difiere de tu memoria; consulta `node_modules/next/dist/docs/` (p. ej. `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`, `01-app/02-guides/progressive-web-apps.md`) antes de usar una API.
- Pruebas: **solo happy path + seguridad importante** (decisión del usuario). Sin tests de casos límite.
- Sin push, sin service worker, sin terceros nuevos, sin dependencias nuevas, sin cambios de CSP ni `Permissions-Policy`.
- Sin binarios nativos (Smart App Control): iconos con `ImageResponse` de `next/og`, nada de `sharp`.
- `PUBLIC_PATHS` solo con rutas **exactas**: `/manifest.webmanifest`, `/icono-180.png`, `/icono-192.png`, `/icono-512.png`, `/icono-maskable-512.png`.
- Hora del `.ics` **flotante** (sin `TZID`). Fecha de referencia «hoy» = Bogotá (`src/lib/tiempo/bogota.ts`).
- Textos de UI en español: «Recordatorio», «Añadir a mi calendario», «Elige al menos un día», «Instalar la app», «Instalar».
- Windows/PowerShell: usa `npm.cmd`/`npx.cmd`. En Bash, `npm`.
- Commits en Conventional Commits en español, terminando en `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (o el modelo que los escriba). Sin push.
- Trabaja en el worktree `C:\Users\parra\proyectos\app-ingles-sp5`, rama `feat/sp5-recordatorios-pwa`. Primero `npm ci`.

## Review Focus

- Texto con caracteres multibyte («Inglés», «—») en una línea larga del `.ics`: el plegado a 75 octetos no debe partir un carácter UTF-8 (lo cubre el test de Task 1).
- Parámetros manipulados en la URL (`dias=L%0D%0ABEGIN:VEVENT`): deben rechazarse con 400; nada del usuario llega al `.ics` sin pasar por el esquema (Task 2, test de seguridad).
- Manifest e iconos pedidos sin sesión desde `/login`: 200 (si redirigen a `/login`, la app no se instala) (Task 3).
- Ruta pública con sufijo (`/manifest.webmanifest/x`, `/icono-192.png/`): sigue protegida (Task 3, test de rutas públicas).
- iPhone sin `beforeinstallprompt`: debe ver instrucciones, no una tarjeta vacía (Task 4, revisión manual).

---

### Task 1: Generador `.ics` y validación de parámetros

**Files:**
- Create: `src/lib/recordatorio/parametros.ts`
- Create: `src/lib/recordatorio/ics.ts`
- Test: `src/lib/recordatorio/ics.test.ts`

**Interfaces:**
- Produces:
  - `type Dia = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D'`; `DIAS: readonly Dia[]` (en ese orden).
  - `parsearParametros(q: URLSearchParams): { ok: true; valor: Recordatorio } | { ok: false }`
  - `type Recordatorio = { dias: Dia[]; hora: string /* HH:MM */; minutos: number }`
  - `generarIcs(r: Recordatorio, opts: { appUrl: string; ahora: Date; uid?: string }): string`
  - `NOMBRE_ICS = 'recordatorio-ingles.ics'`

- [ ] **Step 1: Test que falla**

```ts
// src/lib/recordatorio/ics.test.ts
import { describe, it, expect } from 'vitest';
import { generarIcs } from './ics';
import { parsearParametros } from './parametros';

const r = { dias: ['L', 'M', 'X', 'J', 'V'] as const, hora: '19:00', minutos: 20 };
// Jueves 15 oct 2026, 12:00 en Bogotá
const ahora = new Date('2026-10-15T17:00:00Z');

describe('generarIcs', () => {
  const ics = generarIcs({ ...r, dias: [...r.dias] }, { appUrl: 'https://app.test', ahora, uid: 'u1@app-ingles' });

  it('evento semanal L–V a las 19:00, 20 min, alarma a la hora', () => {
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR\r\n');
    expect(ics).toContain('DTSTART:20261015T190000\r\n'); // flotante: sin Z ni TZID
    expect(ics).toContain('DURATION:PT20M\r\n');
    expect(ics).toContain('TRIGGER:PT0M\r\n');
    expect(ics).toContain('URL:https://app.test/hoy\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('ninguna línea supera 75 octetos y el plegado no rompe UTF-8', () => {
    const largo = generarIcs({ ...r, dias: [...r.dias], minutos: 120 }, { appUrl: 'https://app.test/' + 'á'.repeat(80), ahora });
    for (const linea of largo.split('\r\n')) expect(new TextEncoder().encode(linea).length).toBeLessThanOrEqual(75);
    const desplegado = largo.replace(/\r\n /g, '');
    expect(desplegado).toContain('https://app.test/' + 'á'.repeat(80) + '/hoy');
  });
});

describe('parsearParametros', () => {
  it('acepta dias, hora y min válidos', () => {
    const p = parsearParametros(new URLSearchParams('dias=L,M,X,J,V&hora=19:00&min=20'));
    expect(p).toEqual({ ok: true, valor: { dias: ['L', 'M', 'X', 'J', 'V'], hora: '19:00', minutos: 20 } });
  });
  it('@seguridad rechaza saltos de línea inyectados', () => {
    expect(parsearParametros(new URLSearchParams('dias=L\r\nBEGIN:VEVENT&hora=19:00&min=20')).ok).toBe(false);
    expect(parsearParametros(new URLSearchParams('dias=L&hora=19:00\r\nX:1&min=20')).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecuta y comprueba que falla**

Run: `npm test -- src/lib/recordatorio`
Expected: FAIL (módulos no existen).

- [ ] **Step 3: Implementa `parametros.ts`**

```ts
import { z } from 'zod';

export const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export type Dia = (typeof DIAS)[number];
export type Recordatorio = { dias: Dia[]; hora: string; minutos: number };

const esquema = z.object({
  dias: z.string().transform((s) => s.split(',')).pipe(z.array(z.enum(DIAS)).min(1).max(7))
    .refine((d) => new Set(d).size === d.length),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  min: z.coerce.number().int().min(5).max(120),
});

export function parsearParametros(q: URLSearchParams): { ok: true; valor: Recordatorio } | { ok: false } {
  const r = esquema.safeParse({ dias: q.get('dias') ?? '', hora: q.get('hora') ?? '', min: q.get('min') ?? '' });
  if (!r.success) return { ok: false };
  const dias = DIAS.filter((d) => r.data.dias.includes(d)); // orden canónico L→D
  return { ok: true, valor: { dias, hora: r.data.hora, minutos: r.data.min } };
}
```

- [ ] **Step 4: Implementa `ics.ts`**

```ts
import { diaBogota, sumarDias } from '@/lib/tiempo/bogota';
import { DIAS, type Dia, type Recordatorio } from './parametros';

export const NOMBRE_ICS = 'recordatorio-ingles.ics';
const BYDAY: Record<Dia, string> = { L: 'MO', M: 'TU', X: 'WE', J: 'TH', V: 'FR', S: 'SA', D: 'SU' };

const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 §3.1: líneas de ≤ 75 octetos; la continuación empieza por un espacio. No parte caracteres UTF-8. */
function plegar(linea: string): string {
  const enc = new TextEncoder();
  const partes: string[] = [];
  let actual = '';
  let limite = 75;
  for (const ch of linea) {
    if (enc.encode(actual + ch).length > limite) {
      partes.push(actual);
      actual = ch;
      limite = 74; // el espacio inicial ocupa 1 octeto
    } else actual += ch;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Primera fecha (desde hoy en Bogotá, incluido) que cae en uno de los días elegidos. */
function primeraFecha(dias: Dia[], ahora: Date): string {
  const hoy = diaBogota(ahora);
  for (let i = 0; i < 7; i++) {
    const f = sumarDias(hoy, i);
    const dow = new Date(`${f}T12:00:00Z`).getUTCDay(); // 0 = domingo
    if (dias.includes(DIAS[(dow + 6) % 7])) return f;
  }
  return hoy;
}

export function generarIcs(r: Recordatorio, { appUrl, ahora, uid = `${crypto.randomUUID()}@app-ingles` }: { appUrl: string; ahora: Date; uid?: string }): string {
  const url = `${appUrl.replace(/\/$/, '')}/hoy`;
  const inicio = `${primeraFecha(r.dias, ahora).replace(/-/g, '')}T${r.hora.replace(':', '')}00`;
  const lineas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//app-ingles//recordatorio//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utc(ahora)}`,
    `DTSTART:${inicio}`,
    `DURATION:PT${r.minutos}M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${r.dias.map((d) => BYDAY[d]).join(',')}`,
    `SUMMARY:${escapar(`Inglés técnico — ${r.minutos} min`)}`,
    `DESCRIPTION:${escapar(`Tu práctica de hoy te espera: ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${escapar('Hora de practicar inglés')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lineas.map(plegar).join('\r\n') + '\r\n';
}
```

- [ ] **Step 5: Ejecuta los tests**

Run: `npm test -- src/lib/recordatorio`
Expected: PASS (5 tests). Si el test de plegado falla por `URL:` largo, revisa que `plegar` se aplica a todas las líneas.

- [ ] **Step 6: Commit**

```bash
git add src/lib/recordatorio
git commit -m "feat(recordatorio): generador .ics semanal con alarma y validación de parámetros"
```

---

### Task 2: Ruta `GET /api/recordatorio`

**Files:**
- Create: `src/app/api/recordatorio/route.ts`
- Create: `tests/api/recordatorio.spec.ts`
- Modify: `tests/data/local/rutas.yaml`, `tests/data/preview/rutas.yaml` (añadir la ruta protegida)

**Interfaces:**
- Consumes: `parsearParametros`, `generarIcs`, `NOMBRE_ICS` (Task 1); `getCurrentUser` de `@/lib/auth/current-user`.
- Produces: `GET /api/recordatorio?dias=L,M,X,J,V&hora=19:00&min=20` → 200 `text/calendar`; sin sesión 401 `{ error: 'no_autenticado' }`; inválido 400 `{ error: 'parametros_invalidos' }`.

- [ ] **Step 1: Test E2E de API que falla** (`tests/api/recordatorio.spec.ts`, mismo patrón que `tests/api/exportar.spec.ts`)

```ts
import { test as base, expect, request as pwRequest } from '@playwright/test';
import { env } from '../support/env';

const bypass = env.VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.VERCEL_BYPASS } : undefined;
const Q = '/api/recordatorio?dias=L,M,X,J,V&hora=19:00&min=20';

const test = base.extend<{ sesion: Awaited<ReturnType<typeof pwRequest.newContext>>; anonimo: Awaited<ReturnType<typeof pwRequest.newContext>> }>({
  sesion: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({ baseURL, storageState: '.auth/admin.json', extraHTTPHeaders: bypass });
    await use(ctx);
    await ctx.dispose();
  },
  anonimo: async ({ baseURL }, use) => {
    const ctx = await pwRequest.newContext({ baseURL, extraHTTPHeaders: bypass });
    await use(ctx);
    await ctx.dispose();
  },
});

test.describe('@api @seguridad GET /api/recordatorio', () => {
  test('sin cookie → 401', async ({ anonimo }) => {
    const r = await anonimo.get(Q);
    expect(r.status()).toBe(401);
    expect(await r.json()).toEqual({ error: 'no_autenticado' });
  });

  test('parámetros manipulados → 400', async ({ sesion }) => {
    const r = await sesion.get('/api/recordatorio?dias=L%0D%0ABEGIN:VEVENT&hora=19:00&min=20');
    expect(r.status()).toBe(400);
  });

  test('con sesión → .ics adjunto con el evento semanal', async ({ sesion }) => {
    const r = await sesion.get(Q);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toBe('text/calendar; charset=utf-8');
    expect(r.headers()['content-disposition']).toBe('attachment; filename="recordatorio-ingles.ics"');
    expect(r.headers()['cache-control']).toBe('no-store');
    const ics = await r.text();
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
    expect(ics).toContain('TRIGGER:PT0M');
  });
});
```

Y en **ambos** `tests/data/*/rutas.yaml`, bajo `protegidas`, tras `/api/exportar`:

```yaml
  - { ruta: /api/recordatorio, tipo: api }
```

- [ ] **Step 2: Implementa la ruta**

```ts
// src/app/api/recordatorio/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { generarIcs, NOMBRE_ICS } from '@/lib/recordatorio/ics';
import { parsearParametros } from '@/lib/recordatorio/parametros';

export async function GET(request: NextRequest) {
  const u = await getCurrentUser(); // sesión comprobada dentro del handler (el proxy solo mira la cookie)
  if (!u) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const p = parsearParametros(request.nextUrl.searchParams);
  if (!p.ok) return NextResponse.json({ error: 'parametros_invalidos' }, { status: 400 });
  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
  return new NextResponse(generarIcs(p.valor, { appUrl, ahora: new Date() }), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${NOMBRE_ICS}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
```

Comprueba cómo se lee `APP_URL` en el resto del código (`grep -rn APP_URL src`) y usa el mismo helper si existe en lugar de `process.env` directo.

- [ ] **Step 3: Verifica**

Run: `npm test` (el test estático `src/lib/auth/guardas-api.test.ts` debe incluir y pasar `recordatorio/route.ts`), `npm run typecheck`, `npm run lint`.
Expected: PASS. Los E2E de API se ejecutan en Task 5 con Docker.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recordatorio tests/api/recordatorio.spec.ts tests/data
git commit -m "feat(recordatorio): ruta /api/recordatorio que descarga el .ics con sesión"
```

---

### Task 3: PWA — manifest, iconos y rutas públicas

**Files:**
- Create: `src/lib/pwa/icono.tsx`
- Create: `src/app/manifest.ts`
- Create: `src/app/icono-180.png/route.tsx`, `src/app/icono-192.png/route.tsx`, `src/app/icono-512.png/route.tsx`, `src/app/icono-maskable-512.png/route.tsx`
- Modify: `src/app/layout.tsx` (metadata + viewport)
- Modify: `src/lib/auth/public-paths.ts`, `src/lib/auth/public-paths.test.ts`
- Modify: `tests/data/local/rutas.yaml`, `tests/data/preview/rutas.yaml` (`publicas`)
- Modify: `docs/seguridad.md` (rutas públicas nuevas)

**Interfaces:**
- Produces: `iconoPwa(tam: number, { maskable }: { maskable: boolean }): ImageResponse`; rutas públicas exactas listadas en Global Constraints.

- [ ] **Step 1: Actualiza el test de rutas públicas (falla)**

En `src/lib/auth/public-paths.test.ts`:

```ts
const PUBLICAS = ['/login', '/registro', '/api/salud', '/manifest.webmanifest', '/icono-180.png', '/icono-192.png', '/icono-512.png', '/icono-maskable-512.png'];
// ...
  it('lista fija', () => {
    expect(PUBLIC_PATHS).toEqual(PUBLICAS);
  });
  it.each(PUBLICAS)('%s es pública', (p) => {
    expect(isPublicPath(p)).toBe(true);
  });
```

y añade a la lista de «no es pública»: `'/manifest.webmanifest/x'`, `'/icono-192.png/'`, `'/icono-1920.png'`.

Run: `npm test -- src/lib/auth/public-paths` → FAIL.

- [ ] **Step 2: Rutas públicas**

```ts
// src/lib/auth/public-paths.ts
// Manifest e iconos de la PWA: deben servirse sin sesión para poder instalar la app desde /login.
export const PUBLIC_PATHS = ['/login', '/registro', '/api/salud', '/manifest.webmanifest', '/icono-180.png', '/icono-192.png', '/icono-512.png', '/icono-maskable-512.png'];
```

Run: `npm test -- src/lib/auth/public-paths` → PASS.

- [ ] **Step 3: Icono compartido**

```tsx
// src/lib/pwa/icono.tsx
import { ImageResponse } from 'next/og';

// Colores de «Terminal Calma» (globals.css, tema oscuro): fondo #0b1220, primario #2dd4bf.
export function iconoPwa(tam: number, { maskable }: { maskable: boolean }): ImageResponse {
  // Maskable: el contenido cabe en el 80 % central (zona segura).
  const texto = Math.round(tam * (maskable ? 0.3 : 0.4));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1220', color: '#2dd4bf', fontSize: texto, fontWeight: 700, borderRadius: maskable ? 0 : Math.round(tam * 0.18) }}>
        {'>_EN'}
      </div>
    ),
    { width: tam, height: tam },
  );
}
```

- [ ] **Step 4: Rutas de iconos** (una por tamaño; ejemplo 192, repetir cambiando el tamaño y `maskable`)

```tsx
// src/app/icono-192.png/route.tsx
import { iconoPwa } from '@/lib/pwa/icono';

export const dynamic = 'force-static';
export function GET() {
  return iconoPwa(192, { maskable: false });
}
```

- `icono-180.png` → `iconoPwa(180, { maskable: false })`
- `icono-512.png` → `iconoPwa(512, { maskable: false })`
- `icono-maskable-512.png` → `iconoPwa(512, { maskable: true })`

Confirma en `node_modules/next/dist/docs` que `force-static` en un route handler sigue siendo válido en esta versión; si no, quita la línea (la respuesta es igual).

- [ ] **Step 5: Manifest**

```ts
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Inglés técnico',
    short_name: 'Inglés',
    description: 'Aprende inglés técnico por niveles.',
    start_url: '/hoy',
    scope: '/',
    display: 'standalone',
    lang: 'es',
    background_color: '#0b1220',
    theme_color: '#0f766e',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
```

- [ ] **Step 6: Layout**

En `src/app/layout.tsx`, ampliar `metadata` y `viewport`:

```ts
export const metadata: Metadata = {
  title: "Inglés técnico",
  description: "Aprende inglés técnico por niveles.",
  applicationName: "Inglés técnico",
  appleWebApp: { capable: true, title: "Inglés", statusBarStyle: "default" },
  icons: { apple: "/icono-180.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};
```

(Next añade el `<link rel="manifest">` solo por existir `app/manifest.ts`.)

- [ ] **Step 7: Datos E2E y docs**

En ambos `tests/data/*/rutas.yaml`, bajo `publicas`:

```yaml
  - /manifest.webmanifest
  - /icono-192.png
```

(El test de `tests/api/rutas-protegidas.spec.ts` ya comprueba 200 sin sesión para cada pública.)

En `docs/seguridad.md`, junto a la nota de `/favicon.ico`, añade una línea: «**Manifest e iconos de la PWA públicos** (`/manifest.webmanifest`, `/icono-*.png`, rutas exactas en `PUBLIC_PATHS`): sin datos de usuario; hacen falta para instalar la app desde `/login`.»

- [ ] **Step 8: Verifica**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Expected: PASS; en la salida del build aparecen `/manifest.webmanifest` y las cuatro rutas `/icono-*.png`.
Después: `npm run start` en otra terminal y `curl -s -o NUL -w "%{http_code} %{content_type}\n" http://127.0.0.1:3000/icono-192.png` → `200 image/png`; `curl -s http://127.0.0.1:3000/manifest.webmanifest` → JSON con `start_url: "/hoy"` sin cookie.

- [ ] **Step 9: Commit**

```bash
git add src/lib/pwa src/app/manifest.ts src/app/icono-* src/app/layout.tsx src/lib/auth/public-paths* tests/data docs/seguridad.md
git commit -m "feat(pwa): manifest, iconos generados y metadatos para instalar la app"
```

---

### Task 4: Tarjetas «Recordatorio» e «Instalar la app» en Perfil

Usa la skill `disenador-ui-accesible` (táctil ≥ 44 px, foco visible, etiquetas, contraste).

**Files:**
- Create: `src/app/(app)/perfil/recordatorio.tsx`
- Create: `src/app/(app)/perfil/instalar-app.tsx`
- Modify: `src/app/(app)/perfil/page.tsx` (insertar las dos tarjetas antes de «Mis datos»)
- Modify: `tests/api/recordatorio.spec.ts` (E2E de la descarga desde Perfil)

**Interfaces:**
- Consumes: `DIAS`, `type Dia` de `@/lib/recordatorio/parametros`; `Tarjeta` de `@/components/tarjeta`; `Boton` de `@/components/boton`; `datos.metaDiariaMin` ya cargado en `page.tsx`.
- Produces: `<Recordatorio metaMin={number} />`, `<InstalarApp />`.

- [ ] **Step 1: E2E que falla** (añadir a `tests/api/recordatorio.spec.ts`)

```ts
test.describe('@api Perfil: recordatorio en el calendario', () => {
  test('«Añadir a mi calendario» descarga recordatorio-ingles.ics', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ storageState: '.auth/admin.json', baseURL, extraHTTPHeaders: bypass, acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto('/perfil');
    const enlace = page.getByRole('link', { name: 'Añadir a mi calendario' });
    await expect(enlace).toBeVisible();
    const [descarga] = await Promise.all([page.waitForEvent('download'), enlace.click()]);
    expect(descarga.suggestedFilename()).toBe('recordatorio-ingles.ics');
    await ctx.close();
  });
});
```

- [ ] **Step 2: Componente `Recordatorio`**

```tsx
// src/app/(app)/perfil/recordatorio.tsx
'use client';
import { useState } from 'react';
import { DIAS, type Dia } from '@/lib/recordatorio/parametros';

const NOMBRES: Record<Dia, string> = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' };
const DURACIONES = [5, 10, 15, 20, 30] as const;

export function Recordatorio({ metaMin }: { metaMin: number }) {
  const [dias, setDias] = useState<Dia[]>(['L', 'M', 'X', 'J', 'V']);
  const [hora, setHora] = useState('19:00');
  const [min, setMin] = useState<number>(DURACIONES.includes(metaMin as never) ? metaMin : 10);
  const alternar = (d: Dia) => setDias((a) => (a.includes(d) ? a.filter((x) => x !== d) : DIAS.filter((x) => x === d || a.includes(x))));
  const href = `/api/recordatorio?${new URLSearchParams({ dias: dias.join(','), hora, min: String(min) })}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-texto-suave">Tu calendario te avisará aunque la app esté cerrada.</p>
      <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
        <legend className="mb-1 text-texto-suave">Días</legend>
        {DIAS.map((d) => (
          <label key={d} className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={dias.includes(d)} onChange={() => alternar(d)} className="size-5" />
            {NOMBRES[d]}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1">
        <span className="text-texto-suave">Hora</span>
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className="min-h-11 self-start rounded-md border border-borde bg-superficie px-3" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-texto-suave">Duración</span>
        <select value={min} onChange={(e) => setMin(Number(e.target.value))} className="min-h-11 self-start rounded-md border border-borde bg-superficie px-3">
          {DURACIONES.map((m) => <option key={m} value={m}>{m} minutos</option>)}
        </select>
      </label>
      {dias.length === 0 || !hora
        ? <p role="status" className="font-medium">Elige al menos un día</p>
        : (
          <a href={href} download className="inline-flex min-h-11 min-w-11 self-start items-center rounded-md border border-borde bg-superficie px-4 font-semibold text-texto">
            Añadir a mi calendario
          </a>
        )}
    </div>
  );
}
```

(Comprueba que las clases `border-borde`, `bg-superficie`, `text-texto-suave` existen; son las que ya usa `page.tsx`.)

- [ ] **Step 3: Componente `InstalarApp`**

```tsx
// src/app/(app)/perfil/instalar-app.tsx
'use client';
import { useEffect, useState } from 'react';
import { Boton } from '@/components/boton';

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type Estado = 'cargando' | 'instalada' | 'boton' | 'ios' | 'menu';

export function InstalarApp() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [evento, setEvento] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return setEstado('instalada');
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setEstado(ios ? 'ios' : 'menu');
    const alPedir = (e: Event) => { e.preventDefault(); setEvento(e as EventoInstalar); setEstado('boton'); };
    const alInstalar = () => setEstado('instalada');
    window.addEventListener('beforeinstallprompt', alPedir);
    window.addEventListener('appinstalled', alInstalar);
    return () => { window.removeEventListener('beforeinstallprompt', alPedir); window.removeEventListener('appinstalled', alInstalar); };
  }, []);

  if (estado === 'cargando' || estado === 'instalada') return null;
  return (
    <section aria-labelledby="p-instalar" className="rounded-lg bg-superficie p-4">
      <h2 id="p-instalar" className="mb-2 text-lg font-semibold">Instalar la app</h2>
      {estado === 'boton' && evento && (
        <Boton type="button" onClick={async () => { await evento.prompt(); const r = await evento.userChoice; if (r.outcome === 'accepted') setEstado('instalada'); }}>
          Instalar
        </Boton>
      )}
      {estado === 'ios' && <p>En Safari pulsa <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.</p>}
      {estado === 'menu' && <p>Abre el menú del navegador y elige <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.</p>}
    </section>
  );
}
```

Ajusta las clases del `<section>` para que se vea igual que `Tarjeta` (lee `src/components/tarjeta.tsx`; si `Tarjeta` es server-safe y acepta `aria-labelledby`, úsala directamente en lugar del `<section>`).

- [ ] **Step 4: Inserta en `page.tsx`** antes de la tarjeta «Mis datos»:

```tsx
      <Tarjeta aria-labelledby="p-recordatorio">
        <h2 id="p-recordatorio" className="mb-2 text-lg font-semibold">Recordatorio</h2>
        <Recordatorio metaMin={datos.metaDiariaMin} />
      </Tarjeta>

      <InstalarApp />
```

con los imports `import { Recordatorio } from './recordatorio';` e `import { InstalarApp } from './instalar-app';`.

- [ ] **Step 5: Verifica**

Run: `npm test`, `npm run typecheck`, `npm run lint`.
Luego `npm run dev` en otra terminal, entra con un usuario local, abre `/perfil`: la tarjeta muestra L–V marcados y 19:00; desmarcar todos muestra «Elige al menos un día»; el enlace descarga el `.ics`. Comprueba a 360 px de ancho.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/perfil" tests/api/recordatorio.spec.ts
git commit -m "feat(perfil): tarjetas de recordatorio en el calendario e instalar la app"
```

---

### Task 5: Verificación completa e integración

**Files:** ninguno nuevo (solo correcciones si algo falla).

- [ ] **Step 1: Puertas locales**

Run: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`, `npm run build`, `npm run check:no-pc`, `npm audit --omit=dev`.
Expected: todo en verde.

- [ ] **Step 2: E2E Docker completo** (PowerShell, raíz del worktree)

```powershell
$f = '-f', 'docker-compose.yml', '-f', 'tests/docker-compose.yml'
docker compose @f down -v
docker compose @f up -d --build --wait web
docker compose @f run --rm --build tests
docker compose @f down -v
```

Expected: toda la suite en verde, incluidos los nuevos de `tests/api/recordatorio.spec.ts` y las rutas públicas/protegidas nuevas.

- [ ] **Step 3: Revisión y auditoría**

Revisión final de rama (Opus, `superpowers:requesting-code-review`) y agente `auditor-seguridad-web` (rutas públicas nuevas, ruta con sesión, sin CSP cambiada). Corregir todo hallazgo Important antes del PR (decisión del usuario).

- [ ] **Step 4: PR** (solo con aprobación del usuario)

`git push -u origin feat/sp5-recordatorios-pwa` y `gh pr create` hacia `main` con resumen, evidencia de pruebas y la nota manual: «probar `.ics` e instalación en iPhone y Android».
