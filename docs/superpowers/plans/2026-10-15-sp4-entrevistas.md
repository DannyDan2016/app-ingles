# SP4 — Entrevistas (banco de preguntas y shadowing) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sección «Entrevistas» con banco filtrable de preguntas (respuesta modelo, estructuras, vocabulario) y sets de shadowing con video, con su contenido inicial.

**Architecture:** Dos tipos de contenido YAML nuevos (`entrevistas` por rol y `shadowing` por set) validados por el compilador existente y añadidos al catálogo `server-only`. Páginas server-component bajo `src/app/(app)/entrevistas/` con filtros por query; el reproductor de shadowing es un componente cliente que reutiliza `VideoFacade`. Contenido redactado por subagentes, revisado por Opus y muestreado por el usuario.

**Tech Stack:** Next.js 16.4 (App Router), React 19, TypeScript, zod 4, Tailwind 4, lucide-react, Vitest, Playwright + playwright-bdd (Gherkin en español), YAML de contenido.

**Spec:** [`docs/superpowers/specs/2026-10-15-sp4-entrevistas-design.md`](../specs/2026-10-15-sp4-entrevistas-design.md)

## Global Constraints

- Lee `AGENTS.md`: esta versión de Next difiere de tu memoria; consulta `node_modules/next/dist/docs/` (p. ej. `searchParams`/`params` son Promises en páginas) antes de usar una API.
- Pruebas: **solo happy path + seguridad importante** (decisión del usuario). Sin tests de casos límite.
- Sin grabación, micrófono ni voz; sin cambios de CSP, `Permissions-Policy`, dependencias ni rutas públicas; sin APIs nuevas.
- Roles: `general`, `ia`, `qa`, `backend`, `frontend`. Niveles de preguntas: `A2`, `B1`, `B2`. Niveles de shadowing: `B1`, `B2`.
- Banco: 4 preguntas por rol técnico y nivel (48) + 6 generales (rol `general`, nivel `B1`) = 54. Cada pregunta: respuesta modelo en inglés al nivel de la pregunta, 4–6 estructuras, 1–8 entradas de vocabulario `{ termino, traduccion }`.
- Shadowing: 5 sets (uno por rol), exactamente 6 frases, cada frase ≤ 15 s, `end > start`.
- Textos de UI en español: «Entrevistas», «Preguntas», «Shadowing», «Respuesta modelo», «Estructuras para tu respuesta», «Vocabulario», «Aún no hay preguntas para este filtro», «Escuchar frase», «Mostrar texto», «Ocultar texto», «Anterior», «Siguiente», «Frase N de 6».
- Contenido de producción con `revisado: true` obligatorio en build estricto (`CONTENIDO_ESTRICTO=1` / Vercel). Solo el usuario autoriza `revisado: true` tras su muestreo.
- Accesibilidad con la skill `disenador-ui-accesible`: táctil ≥ 44 px (`min-h-11`), foco visible, sin scroll horizontal a 360 px, `lang="en"` en textos en inglés.
- Windows: PowerShell `npm.cmd`; Bash `npm`. Commits en Conventional Commits en español terminando en `Co-Authored-By: <modelo> <noreply@anthropic.com>`. Sin push.
- Worktree `C:\Users\parra\proyectos\app-ingles-sp4`, rama `feat/sp4-entrevistas`. Primero `npm ci` (y `npm ci` en `tests/` para typecheck de los E2E).

## Review Focus

- Filtro con valores manipulados en la URL (`?rol=<script>&nivel=Z9`): se ignoran (sin filtro), nunca error 500 ni texto reflejado sin escapar (Task 2, test unitario de `leerFiltro`).
- Id inexistente en `/entrevistas/<id>` o `/entrevistas/shadowing/<id>`: 404, no 500 (Task 2 y Task 3, cubierto por `notFound()`; revisar en la revisión).
- Pantalla de 360 px con respuestas modelo largas y estructuras: sin scroll horizontal (Task 2, paso de comprobación manual + E2E existente responsive si aplica).
- Cambiar de frase en shadowing debe reiniciar el video al tramo nuevo (no seguir el anterior) (Task 3, `key` por frase).
- Contenido nuevo con canales/títulos que disparen `check:no-pc` (p. ej. «localhost»): debe detectarse antes del PR (Task 5, `npm run check:no-pc`).

---

### Task 1: Esquemas, reglas del compilador y catálogo

**Files:**
- Modify: `src/lib/contenido/esquema.ts`
- Modify: `src/lib/contenido/reglas.ts`
- Modify: `src/lib/contenido/videos.ts`
- Modify: `src/lib/contenido/catalogo.ts`
- Create: `src/lib/entrevistas/filtro.ts`
- Create: `content/_demo/preguntas-demo.yaml`, `content/_demo/shadowing-demo.yaml`
- Test: `src/lib/contenido/esquema.test.ts` (añadir casos), `src/lib/entrevistas/filtro.test.ts`

**Interfaces:**
- Produces (esquema.ts):
  - `ROLES_ENTREVISTA = ['general','ia','qa','backend','frontend'] as const`; `type RolEntrevista`
  - `NIVELES_ENTREVISTA = ['A2','B1','B2'] as const`; `type NivelEntrevista`
  - `preguntaEntrevistaSchema`, `bancoEntrevistasSchema` (`tipo: 'entrevistas'`), `shadowingSchema` (`tipo: 'shadowing'`)
  - `type PreguntaEntrevista = z.infer<typeof preguntaEntrevistaSchema> & { rol: RolEntrevista }`; `type Shadowing`
  - `Catalogo` gana `entrevistas: PreguntaEntrevista[]` y `shadowing: Shadowing[]`
- Produces (catalogo.ts): `preguntasEntrevista(): PreguntaEntrevista[]`, `getPreguntaEntrevista(id: string): PreguntaEntrevista | undefined`, `setsShadowing(): Shadowing[]`, `getShadowing(id: string): Shadowing | undefined`
- Produces (filtro.ts): `type FiltroEntrevista = { rol?: RolEntrevista; nivel?: NivelEntrevista }`, `leerFiltro(q: { rol?: string | string[]; nivel?: string | string[] }): FiltroEntrevista`, `filtrarPreguntas(lista: PreguntaEntrevista[], f: FiltroEntrevista): PreguntaEntrevista[]`

- [ ] **Step 1: Tests que fallan**

```ts
// src/lib/entrevistas/filtro.test.ts
import { describe, it, expect } from 'vitest';
import { filtrarPreguntas, leerFiltro } from './filtro';
import type { PreguntaEntrevista } from '@/lib/contenido/esquema';

const p = (id: string, rol: PreguntaEntrevista['rol'], nivel: PreguntaEntrevista['nivel']): PreguntaEntrevista =>
  ({ id, rol, nivel, pregunta: 'Q?', respuesta: 'A.', estructuras: ['a', 'b', 'c', 'd'], vocabulario: [{ termino: 't', traduccion: 'tr' }] });
const lista = [p('ent-qa-01', 'qa', 'B2'), p('ent-qa-02', 'qa', 'B1'), p('ent-backend-01', 'backend', 'B2')];

describe('filtro de entrevistas', () => {
  it('filtra por rol y nivel', () => {
    expect(filtrarPreguntas(lista, { rol: 'qa', nivel: 'B2' }).map((x) => x.id)).toEqual(['ent-qa-01']);
  });
  it('@seguridad ignora valores fuera de las listas cerradas', () => {
    expect(leerFiltro({ rol: '<script>', nivel: 'Z9' })).toEqual({});
    expect(leerFiltro({ rol: 'qa', nivel: 'B2' })).toEqual({ rol: 'qa', nivel: 'B2' });
  });
});
```

Y en `src/lib/contenido/esquema.test.ts`, un caso por esquema nuevo:

```ts
it('acepta un banco de entrevistas y un set de shadowing válidos', () => {
  expect(bancoEntrevistasSchema.safeParse({
    tipo: 'entrevistas', rol: 'qa', revisado: true,
    preguntas: [{ id: 'ent-qa-01', nivel: 'B2', pregunta: 'How do you test an API?', respuesta: 'I start by…', estructuras: ['First, I…', 'Then, I…', 'As a result…', 'What I learned…'], vocabulario: [{ termino: 'endpoint', traduccion: 'endpoint (punto de acceso)' }] }],
  }).success).toBe(true);
  expect(shadowingSchema.safeParse({
    tipo: 'shadowing', id: 'shadowing-qa', rol: 'qa', nivel: 'B2', titulo: 'QA interview', revisado: true,
    video: { youtubeId: 'AWX6WvYktwk', titulo: 'T', canal: 'C' },
    frases: Array.from({ length: 6 }, (_, i) => ({ texto: `Sentence ${i}`, traduccion: `Frase ${i}`, start: i * 10, end: i * 10 + 5 })),
  }).success).toBe(true);
});
```

Run: `npm test -- src/lib/entrevistas src/lib/contenido/esquema` → FAIL (no existen).

- [ ] **Step 2: Esquemas** (añadir en `esquema.ts` antes de `archivoSchema`)

```ts
export const ROLES_ENTREVISTA = ['general', 'ia', 'qa', 'backend', 'frontend'] as const;
export const NIVELES_ENTREVISTA = ['A2', 'B1', 'B2'] as const;
const rolEntrevista = z.enum(ROLES_ENTREVISTA);
export const preguntaEntrevistaSchema = z.object({
  id, nivel: z.enum(NIVELES_ENTREVISTA), pregunta: texto, respuesta: texto,
  estructuras: z.array(texto).min(4).max(6),
  vocabulario: z.array(z.object({ termino: texto, traduccion: texto })).min(1).max(8),
});
export const bancoEntrevistasSchema = z.object({
  tipo: z.literal('entrevistas'), rol: rolEntrevista, revisado: z.boolean(),
  preguntas: z.array(preguntaEntrevistaSchema).min(1),
});
export const shadowingSchema = z.object({
  tipo: z.literal('shadowing'), id, rol: rolEntrevista, nivel: z.enum(['B1', 'B2']), titulo: texto, revisado: z.boolean(),
  video: videoSchema.pick({ youtubeId: true, titulo: true, canal: true }),
  frases: z.array(z.object({ texto, traduccion: texto, start: z.number().int().min(0), end: z.number().int().min(1) })).length(6),
});
```

Añadir ambos a `archivoSchema` y los tipos:

```ts
export type RolEntrevista = (typeof ROLES_ENTREVISTA)[number];
export type NivelEntrevista = (typeof NIVELES_ENTREVISTA)[number];
export type PreguntaEntrevista = z.infer<typeof preguntaEntrevistaSchema> & { rol: RolEntrevista };
export type Shadowing = z.infer<typeof shadowingSchema>;
export type Catalogo = { lecciones: Leccion[]; tramos: Tramo[]; glosario: EntradaGlosario[]; evaluaciones: Evaluacion[]; entrevistas: PreguntaEntrevista[]; shadowing: Shadowing[] };
```

- [ ] **Step 3: Reglas del compilador** (`reglas.ts`, dentro del bucle de `validarCatalogo`, **antes** de `reglasArchivo`, porque estos tipos no tienen `nivel` de archivo)

```ts
    if (d.tipo === 'entrevistas' || d.tipo === 'shadowing') {
      if (!a.demo) errores.push(...reglasEntrevista(a.ruta, d));
      if (!d.revisado && !a.demo) (opts.estricto ? errores : avisos).push(`${a.ruta}: revisado: false`);
      if (d.tipo === 'entrevistas') entrevistas.push(...d.preguntas.map((p) => ({ ...p, rol: d.rol })));
      else shadowing.push(d);
      continue;
    }
```

con `const entrevistas: PreguntaEntrevista[] = []; const shadowing: Shadowing[] = [];` declarados arriba y:

```ts
/** content/entrevistas/preguntas-<rol>.yaml y content/entrevistas/shadowing-<rol>.yaml (id = shadowing-<rol>). */
function reglasEntrevista(ruta: string, d: { tipo: 'entrevistas'; rol: string; preguntas: { id: string }[] } | Shadowing): string[] {
  const err: string[] = [];
  const esperado = d.tipo === 'entrevistas' ? `content/entrevistas/preguntas-${d.rol}.yaml` : `content/entrevistas/shadowing-${d.rol}.yaml`;
  if (ruta !== esperado) err.push(`${ruta}: debe estar en ${esperado}`);
  if (d.tipo === 'entrevistas') {
    for (const p of d.preguntas) if (!p.id.startsWith(`ent-${d.rol}-`)) err.push(`${p.id}: el id debe empezar por ent-${d.rol}-`);
  } else {
    if (d.id !== `shadowing-${d.rol}`) err.push(`${ruta}: el id debe ser shadowing-${d.rol}`);
    d.frases.forEach((f, i) => {
      if (f.end <= f.start || f.end - f.start > 15) err.push(`${d.id}: frase ${i + 1} debe durar entre 1 y 15 s`);
    });
  }
  return err;
}
```

Tras el bucle, ids de pregunta únicos (`id duplicado: …`) y devolver `catalogo` con `entrevistas` y `shadowing`. En `videos.ts`, `idsDeVideo` añade `...c.shadowing.map((s) => s.video.youtubeId)`.

Corrige los tests existentes que construyen un `Catalogo` literal (añadir `entrevistas: [], shadowing: []`).

- [ ] **Step 4: Catálogo y filtro**

```ts
// catalogo.ts (añadir)
const preguntasPorId = new Map(catalogo.entrevistas.map((p) => [p.id, p]));
const shadowingPorId = new Map(catalogo.shadowing.map((s) => [s.id, s]));
export const preguntasEntrevista = (): PreguntaEntrevista[] => catalogo.entrevistas;
export const getPreguntaEntrevista = (id: string) => preguntasPorId.get(id);
export const setsShadowing = (): Shadowing[] => catalogo.shadowing;
export const getShadowing = (id: string) => shadowingPorId.get(id);
```

```ts
// src/lib/entrevistas/filtro.ts
import { NIVELES_ENTREVISTA, ROLES_ENTREVISTA, type NivelEntrevista, type PreguntaEntrevista, type RolEntrevista } from '@/lib/contenido/esquema';

export type FiltroEntrevista = { rol?: RolEntrevista; nivel?: NivelEntrevista };
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Solo valores de las listas cerradas; cualquier otro se ignora (sin filtro). */
export function leerFiltro(q: { rol?: string | string[]; nivel?: string | string[] }): FiltroEntrevista {
  const rol = uno(q.rol); const nivel = uno(q.nivel);
  return {
    ...((ROLES_ENTREVISTA as readonly string[]).includes(rol ?? '') ? { rol: rol as RolEntrevista } : {}),
    ...((NIVELES_ENTREVISTA as readonly string[]).includes(nivel ?? '') ? { nivel: nivel as NivelEntrevista } : {}),
  };
}
export const filtrarPreguntas = (lista: PreguntaEntrevista[], f: FiltroEntrevista) =>
  lista.filter((p) => (!f.rol || p.rol === f.rol) && (!f.nivel || p.nivel === f.nivel));
```

- [ ] **Step 5: Contenido demo** (para E2E con `CONTENT_DEMO=1`)

`content/_demo/preguntas-demo.yaml`:

```yaml
tipo: entrevistas
rol: qa
revisado: false
preguntas:
  - id: ent-qa-demo-01
    nivel: B2
    pregunta: "How do you decide what to automate first?"
    respuesta: "I usually start with the tests that run most often and protect the most critical flows, such as login and checkout."
    estructuras: ["I usually start with ...", "The main reason is that ...", "For example, ...", "As a result, ..."]
    vocabulario: [{ termino: "critical flow", traduccion: "flujo crítico" }]
```

`content/_demo/shadowing-demo.yaml` (usa el `youtubeId` de `content/_demo/demo-t1.yaml`; léelo y cópialo):

```yaml
tipo: shadowing
id: shadowing-demo
rol: qa
nivel: B2
titulo: "Demo shadowing"
revisado: false
video: { youtubeId: <id de demo-t1>, titulo: "Demo", canal: "Demo" }
frases:
  - { texto: "Sentence one.", traduccion: "Frase uno.", start: 10, end: 14 }
  - { texto: "Sentence two.", traduccion: "Frase dos.", start: 14, end: 18 }
  - { texto: "Sentence three.", traduccion: "Frase tres.", start: 18, end: 22 }
  - { texto: "Sentence four.", traduccion: "Frase cuatro.", start: 22, end: 26 }
  - { texto: "Sentence five.", traduccion: "Frase cinco.", start: 26, end: 30 }
  - { texto: "Sentence six.", traduccion: "Frase seis.", start: 30, end: 34 }
```

- [ ] **Step 6: Verifica**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `CONTENT_DEMO=1 npm run content:build` (debe listar el catálogo sin errores).
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contenido src/lib/entrevistas content/_demo
git commit -m "feat(entrevistas): esquemas, reglas del compilador y catálogo de preguntas y shadowing"
```

---

### Task 2: Sección «Entrevistas»: banco de preguntas y navegación

Usa la skill `disenador-ui-accesible`.

**Files:**
- Create: `src/app/(app)/entrevistas/page.tsx`
- Create: `src/app/(app)/entrevistas/[id]/page.tsx`
- Create: `src/app/(app)/entrevistas/pestanas.tsx` (pestañas Preguntas/Shadowing como enlaces)
- Modify: `src/components/navegacion.tsx`
- Modify: `tests/data/local/rutas.yaml`, `tests/data/preview/rutas.yaml`
- Create: `tests/features/aprendizaje/entrevistas.feature`, `tests/steps/entrevistas.steps.ts`

**Interfaces:**
- Consumes: `preguntasEntrevista`, `getPreguntaEntrevista` (catalogo.ts); `leerFiltro`, `filtrarPreguntas` (filtro.ts); `ROLES_ENTREVISTA`, `NIVELES_ENTREVISTA`; `requireUser` (`@/lib/auth/current-user`); `Tarjeta` (`@/components/tarjeta`).
- Produces: rutas `/entrevistas?rol=&nivel=`, `/entrevistas/[id]`; componente `<PestanasEntrevistas activa="preguntas" | "shadowing" />`.

- [ ] **Step 1: E2E que falla** (`tests/features/aprendizaje/entrevistas.feature`)

```gherkin
# language: es
@aprendizaje @regresion @local-only
Característica: Entrevistas

  Escenario: Filtrar preguntas y ver cómo responder
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Entrevistas"
    Y filtro las preguntas por rol "QA" y nivel "B2"
    Entonces veo la pregunta "How do you decide what to automate first?"
    Cuando abro la pregunta "How do you decide what to automate first?"
    Entonces veo la respuesta modelo, las estructuras y el vocabulario
```

Reutiliza los pasos existentes («que tengo una cuenta con nivel», «abro la sección»; búscalos en `tests/steps/`). Los nuevos van en `tests/steps/entrevistas.steps.ts` con `import { Given, When, Then } from '../fixtures';`:

```ts
import { expect } from '@playwright/test';
import { When, Then } from '../fixtures';

When('filtro las preguntas por rol {string} y nivel {string}', async ({ page }, rol: string, nivel: string) => {
  await page.getByRole('link', { name: rol, exact: true }).click();
  await page.getByRole('link', { name: nivel, exact: true }).click();
  await expect(page).toHaveURL(/rol=.*nivel=|nivel=.*rol=/);
});
Then('veo la pregunta {string}', async ({ page }, texto: string) => {
  await expect(page.getByRole('link', { name: texto })).toBeVisible();
});
When('abro la pregunta {string}', async ({ page }, texto: string) => {
  await page.getByRole('link', { name: texto }).click();
});
Then('veo la respuesta modelo, las estructuras y el vocabulario', async ({ page }) => {
  for (const h of ['Respuesta modelo', 'Estructuras para tu respuesta', 'Vocabulario']) {
    await expect(page.getByRole('heading', { name: h })).toBeVisible();
  }
});
```

En **ambos** `tests/data/*/rutas.yaml`, bajo `protegidas`:

```yaml
  - { ruta: /entrevistas, tipo: pagina }
  - { ruta: /entrevistas/ent-qa-demo-01, tipo: pagina }
```

- [ ] **Step 2: Pestañas** (`pestanas.tsx`, server component)

```tsx
import Link from 'next/link';

export function PestanasEntrevistas({ activa }: { activa: 'preguntas' | 'shadowing' }) {
  const t = [{ id: 'preguntas', href: '/entrevistas', label: 'Preguntas' }, { id: 'shadowing', href: '/entrevistas/shadowing', label: 'Shadowing' }] as const;
  return (
    <nav aria-label="Secciones de entrevistas" className="flex gap-2">
      {t.map((x) => (
        <Link key={x.id} href={x.href} aria-current={activa === x.id ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-md border border-borde px-4 font-semibold ${activa === x.id ? 'bg-primario text-sobre-primario' : 'bg-superficie text-texto'}`}>
          {x.label}
        </Link>
      ))}
    </nav>
  );
}
```

(Comprueba en `src/app/globals.css` los nombres reales de las clases de color —p. ej. `text-sobre-primario` puede llamarse distinto— y usa los existentes.)

- [ ] **Step 3: Lista con filtros** (`entrevistas/page.tsx`)

```tsx
import Link from 'next/link';
import { requireUser } from '@/lib/auth/current-user';
import { preguntasEntrevista } from '@/lib/contenido/catalogo';
import { NIVELES_ENTREVISTA, ROLES_ENTREVISTA, type RolEntrevista } from '@/lib/contenido/esquema';
import { filtrarPreguntas, leerFiltro, type FiltroEntrevista } from '@/lib/entrevistas/filtro';
import { Tarjeta } from '@/components/tarjeta';
import { PestanasEntrevistas } from './pestanas';

export const ROL_ETIQUETA: Record<RolEntrevista, string> = { general: 'General', ia: 'IA', qa: 'QA', backend: 'Backend', frontend: 'Frontend' };

function enlace(f: FiltroEntrevista) {
  const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]);
  return q.size ? `/entrevistas?${q}` : '/entrevistas';
}

export default async function EntrevistasPage({ searchParams }: { searchParams: Promise<{ rol?: string | string[]; nivel?: string | string[] }> }) {
  await requireUser();
  const f = leerFiltro(await searchParams);
  const lista = filtrarPreguntas(preguntasEntrevista(), f);
  const chip = (activo: boolean) => `inline-flex min-h-11 items-center rounded-md border border-borde px-3 ${activo ? 'font-semibold underline' : ''}`;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Entrevistas</h1>
      <PestanasEntrevistas activa="preguntas" />
      <p className="text-texto-suave">Preguntas reales de entrevista técnica con una respuesta modelo y estructuras para preparar la tuya.</p>
      <nav aria-label="Filtrar por rol" className="flex flex-wrap gap-2">
        <Link href={enlace({ nivel: f.nivel })} aria-current={!f.rol ? 'true' : undefined} className={chip(!f.rol)}>Todos</Link>
        {ROLES_ENTREVISTA.map((r) => (
          <Link key={r} href={enlace({ ...f, rol: r })} aria-current={f.rol === r ? 'true' : undefined} className={chip(f.rol === r)}>{ROL_ETIQUETA[r]}</Link>
        ))}
      </nav>
      <nav aria-label="Filtrar por nivel" className="flex flex-wrap gap-2">
        <Link href={enlace({ rol: f.rol })} aria-current={!f.nivel ? 'true' : undefined} className={chip(!f.nivel)}>Todos los niveles</Link>
        {NIVELES_ENTREVISTA.map((n) => (
          <Link key={n} href={enlace({ ...f, nivel: n })} aria-current={f.nivel === n ? 'true' : undefined} className={chip(f.nivel === n)}>{n}</Link>
        ))}
      </nav>
      {lista.length === 0 ? <p role="status">Aún no hay preguntas para este filtro</p> : (
        <ul className="flex flex-col gap-3">
          {lista.map((p) => (
            <li key={p.id}>
              <Tarjeta as="div" className="p-0">
                <Link href={`/entrevistas/${p.id}`} className="flex min-h-11 flex-col gap-1 rounded-xl p-4">
                  <span lang="en" className="font-semibold">{p.pregunta}</span>
                  <span className="text-sm text-texto-suave">{ROL_ETIQUETA[p.rol]} · {p.nivel}</span>
                </Link>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

(Si exportar `ROL_ETIQUETA` desde un `page.tsx` choca con las reglas de Next sobre exports de páginas, muévelo a `src/lib/entrevistas/etiquetas.ts` e impórtalo en ambas páginas.)

- [ ] **Step 4: Detalle** (`entrevistas/[id]/page.tsx`)

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getPreguntaEntrevista } from '@/lib/contenido/catalogo';
import { Tarjeta } from '@/components/tarjeta';

export default async function PreguntaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const p = getPreguntaEntrevista((await params).id);
  if (!p) notFound();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/entrevistas" className="inline-flex min-h-11 items-center font-semibold text-primario underline">← Todas las preguntas</Link>
      <h1 lang="en" className="text-2xl font-bold">{p.pregunta}</h1>
      <Tarjeta aria-labelledby="e-respuesta">
        <h2 id="e-respuesta" className="mb-2 text-lg font-semibold">Respuesta modelo</h2>
        <p lang="en" className="whitespace-pre-line">{p.respuesta}</p>
      </Tarjeta>
      <Tarjeta aria-labelledby="e-estructuras">
        <h2 id="e-estructuras" className="mb-2 text-lg font-semibold">Estructuras para tu respuesta</h2>
        <ul lang="en" className="list-disc pl-5">{p.estructuras.map((e) => <li key={e}>{e}</li>)}</ul>
      </Tarjeta>
      <Tarjeta aria-labelledby="e-vocab">
        <h2 id="e-vocab" className="mb-2 text-lg font-semibold">Vocabulario</h2>
        <ul className="grid gap-1">{p.vocabulario.map((v) => <li key={v.termino}><span lang="en" className="font-semibold">{v.termino}</span>: {v.traduccion}</li>)}</ul>
      </Tarjeta>
    </div>
  );
}
```

- [ ] **Step 5: Navegación** — en `navegacion.tsx`, importar `MessagesSquare` de `lucide-react` y añadir al final de `SECCIONES`: `{ href: '/entrevistas', etiqueta: 'Entrevistas', Icono: MessagesSquare }`. Comprueba que la barra inferior móvil cabe a 360 px con 5 entradas y que ningún test existente asume 4 secciones (`grep -rn "Alt+4\|SECCIONES" src tests`).

- [ ] **Step 6: Verifica**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `cd tests && npm run typecheck`. Los E2E se ejecutan en Task 6 (Docker).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(app)/entrevistas" src/components/navegacion.tsx tests
git commit -m "feat(entrevistas): banco de preguntas filtrable y sección en la navegación"
```

---

### Task 3: Shadowing con video

Usa la skill `disenador-ui-accesible`.

**Files:**
- Create: `src/app/(app)/entrevistas/shadowing/page.tsx`
- Create: `src/app/(app)/entrevistas/shadowing/[id]/page.tsx`
- Create: `src/app/(app)/entrevistas/shadowing/[id]/reproductor-shadowing.tsx`
- Modify: `tests/features/aprendizaje/entrevistas.feature`, `tests/steps/entrevistas.steps.ts`, `tests/data/*/rutas.yaml`

**Interfaces:**
- Consumes: `setsShadowing`, `getShadowing` (catalogo.ts); `type Shadowing`; `PestanasEntrevistas` (Task 2); `ROL_ETIQUETA` (Task 2, donde haya quedado); `VideoFacade` (`@/components/video-facade`, props `{ video: Video; api?: boolean; onPlayer?; onError? }`).
- Produces: rutas `/entrevistas/shadowing` y `/entrevistas/shadowing/[id]`; `<ReproductorShadowing set={Shadowing} />`.

- [ ] **Step 1: E2E que falla** (añadir escenario)

```gherkin
  Escenario: Practicar shadowing frase a frase
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Entrevistas"
    Y abro la pestaña "Shadowing" y el set "Demo shadowing"
    Entonces veo "Frase 1 de 6"
    Cuando pulso "Siguiente"
    Entonces veo "Frase 2 de 6"
```

```ts
When('abro la pestaña {string} y el set {string}', async ({ page }, pestana: string, set: string) => {
  await page.getByRole('link', { name: pestana, exact: true }).click();
  await page.getByRole('link', { name: new RegExp(set) }).click();
});
Then('veo {string}', async ({ page }, texto: string) => {
  await expect(page.getByText(texto, { exact: true })).toBeVisible();
});
When('pulso {string}', async ({ page }, nombre: string) => {
  await page.getByRole('button', { name: nombre, exact: true }).click();
});
```

(Si ya existen pasos con esas mismas expresiones en `tests/steps/`, reutilízalos en vez de duplicarlos: playwright-bdd falla con pasos ambiguos.)

`rutas.yaml` (ambos), bajo `protegidas`:

```yaml
  - { ruta: /entrevistas/shadowing, tipo: pagina }
  - { ruta: /entrevistas/shadowing/shadowing-demo, tipo: pagina }
```

- [ ] **Step 2: Lista de sets** (`shadowing/page.tsx`): `requireUser()`, `<h1>Entrevistas</h1>`, `<PestanasEntrevistas activa="shadowing" />`, texto «Escucha cada frase de una entrevista real y repítela en voz alta.», y lista de `setsShadowing()` como tarjetas enlazadas a `/entrevistas/shadowing/${s.id}` mostrando `s.titulo` (`lang="en"`), `ROL_ETIQUETA[s.rol] · s.nivel · s.video.canal`. Mismo patrón de tarjeta que Task 2 Step 3.

- [ ] **Step 3: Reproductor** (`reproductor-shadowing.tsx`)

```tsx
'use client';
import { useState } from 'react';
import type { Shadowing } from '@/lib/contenido/esquema';
import { VideoFacade } from '@/components/video-facade';
import { Boton } from '@/components/boton';

export function ReproductorShadowing({ set }: { set: Shadowing }) {
  const [i, setI] = useState(0);
  const [intento, setIntento] = useState(0); // fuerza reiniciar el tramo con «Escuchar frase»
  const [verTexto, setVerTexto] = useState(false);
  const f = set.frases[i];
  const video = { youtubeId: set.video.youtubeId, titulo: set.video.titulo, canal: set.video.canal, start: f.start, end: f.end };
  const ir = (n: number) => { setI(n); setVerTexto(false); };
  return (
    <div className="flex flex-col gap-3">
      <p aria-live="polite" className="font-semibold">Frase {i + 1} de {set.frases.length}</p>
      <VideoFacade key={`${i}-${intento}`} video={video} />
      <div className="flex flex-wrap gap-2">
        <Boton type="button" onClick={() => setIntento((x) => x + 1)}>Escuchar frase</Boton>
        <Boton type="button" variante="secundario" aria-pressed={verTexto} onClick={() => setVerTexto((v) => !v)}>{verTexto ? 'Ocultar texto' : 'Mostrar texto'}</Boton>
      </div>
      {verTexto && (
        <div className="rounded-md bg-superficie p-3">
          <p lang="en" className="font-semibold">{f.texto}</p>
          <p className="text-texto-suave">{f.traduccion}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Boton type="button" variante="secundario" disabled={i === 0} onClick={() => ir(i - 1)}>Anterior</Boton>
        <Boton type="button" disabled={i === set.frases.length - 1} onClick={() => ir(i + 1)}>Siguiente</Boton>
      </div>
      <p className="text-sm text-texto-suave">Video: <span lang="en">{set.video.titulo}</span> · <span lang="en">{set.video.canal}</span></p>
    </div>
  );
}
```

(Lee `src/components/video-facade.tsx` y `src/components/boton.tsx` para confirmar props, variantes y el comportamiento de la fachada: si muestra miniatura y espera clic, «Escuchar frase» debe dejarla lista para reproducir el tramo; ajusta solo lo necesario sin cambiar `VideoFacade`.)

- [ ] **Step 4: Detalle** (`shadowing/[id]/page.tsx`): `requireUser()`, `getShadowing(id)` o `notFound()`, enlace «← Todos los sets» a `/entrevistas/shadowing`, `<h1 lang="en">{set.titulo}</h1>`, texto «Escucha la frase, repítela en voz alta y pasa a la siguiente.», `<ReproductorShadowing set={set} />`.

- [ ] **Step 5: Verifica**

Run: `npm test`, `npm run typecheck`, `npm run lint`, `cd tests && npm run typecheck`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/entrevistas/shadowing" tests
git commit -m "feat(entrevistas): shadowing con video frase a frase"
```

---

### Task 4: Contenido — banco de 54 preguntas

**Files:**
- Create: `content/entrevistas/preguntas-general.yaml`, `preguntas-ia.yaml`, `preguntas-qa.yaml`, `preguntas-backend.yaml`, `preguntas-frontend.yaml`

**Interfaces:**
- Consumes: `bancoEntrevistasSchema` y reglas de Task 1 (ruta `content/entrevistas/preguntas-<rol>.yaml`, ids `ent-<rol>-NN`).

- [ ] **Step 1: Redacción** (subagente de contenido, Sonnet). Por rol técnico, 4 preguntas por nivel A2, B1, B2 (12 por archivo); `preguntas-general.yaml` con 6 preguntas nivel B1 (tell me about yourself, why do you want to work here, a challenge you faced, a conflict in a team, strengths and weaknesses, questions for the interviewer). Preguntas realistas de entrevistas técnicas actuales de cada rol (IA aplicada al desarrollo, QA/automatización, backend, frontend). Respuesta modelo en inglés natural ajustada al nivel CEFR de la pregunta (A2 frases simples; B1 conectores y pasado; B2 condicionales, pasiva, matices), 60–150 palabras, en primera persona y con un ejemplo concreto. 4–6 estructuras reutilizables («The situation was that …»). Vocabulario 3–6 términos con traducción al español en contexto técnico. `revisado: false`.
- [ ] **Step 2: Verifica**: `npm run content:build` (solo avisos de `revisado: false`), `npm run check:no-pc`, `npm test`.
- [ ] **Step 3: Commit**: `content(entrevistas): banco de 54 preguntas con respuesta modelo, estructuras y vocabulario`.
- [ ] **Step 4: Revisión Opus** (inglés natural y de nivel, realismo técnico, respuestas sin errores conceptuales, traducciones) con correcciones y commit `content(entrevistas): correcciones de la revisión`.
- [ ] **Step 5: Muestreo del usuario** (2 preguntas por rol). **Parada:** solo con su OK, `revisado: true` en los 5 archivos y commit `content(entrevistas): marcar el banco como revisado tras el muestreo del usuario`.

---

### Task 5: Contenido — 5 sets de shadowing

**Files:**
- Create: `content/entrevistas/shadowing-general.yaml`, `shadowing-ia.yaml`, `shadowing-qa.yaml`, `shadowing-backend.yaml`, `shadowing-frontend.yaml`

- [ ] **Step 1: Videos.** Por set, un video real de YouTube en inglés sobre entrevistas técnicas del rol (simulacro, respuestas de candidatos o consejos de entrevistadores), habla clara, B1/B2. Verificar con oEmbed (lo hace `npm run content:check-videos`). Título y canal sin patrones de `scripts/no-pc.ts` (p. ej. «localhost»). Sin instalar herramientas ni descargar video; los subtítulos públicos se leen solo para elegir frases y tiempos.
- [ ] **Step 2: Frases.** 6 frases por set, consecutivas o cercanas, útiles para una entrevista, cada una 2–15 s con `start`/`end` enteros ajustados a la frase completa, `texto` exacto de lo que se oye y `traduccion` natural al español. `titulo` del set descriptivo en inglés. `revisado: false`.
- [ ] **Step 3: Verifica**: `npm run content:build`, `npm run content:check-videos`, `npm run check:no-pc`, `npm test`.
- [ ] **Step 4: Commit**: `content(entrevistas): 5 sets de shadowing con video`.
- [ ] **Step 5: Revisión Opus** (texto vs. tema, traducciones, utilidad de las frases; anotar qué debe oír el usuario) y commit de correcciones.
- [ ] **Step 6: Muestreo del usuario** (los 5 sets: tiempos y texto). **Parada:** con su OK, `revisado: true` y commit `content(entrevistas): marcar el shadowing como revisado tras el muestreo del usuario`.

---

### Task 6: Verificación completa e integración

- [ ] **Step 1: Puertas locales**: `npm run lint`, `npm run typecheck`, `npm test`, `CONTENIDO_ESTRICTO=1 npm run content:build`, `npm run build`, `npm run check:no-pc`, `npm run content:check-videos`, `npm audit --omit=dev`.
- [ ] **Step 2: E2E Docker** (PowerShell, raíz del worktree; el compose exige `E2E_ADMIN_PASSWORD` temporal en la sesión):

```powershell
$f = '-f', 'docker-compose.yml', '-f', 'tests/docker-compose.yml'
docker compose @f down -v
docker compose @f up -d --build --wait web
docker compose @f run --rm --build tests
docker compose @f down -v
```

Expected: suite en verde, incluidos `entrevistas.feature` y las rutas nuevas en `rutas-protegidas`.
- [ ] **Step 3: Revisión final (Opus) y auditor** `auditor-seguridad-web`; corregir todo Important antes del PR.
- [ ] **Step 4: PR** (con aprobación del usuario): push de `feat/sp4-entrevistas` y `gh pr create` hacia `main`.
