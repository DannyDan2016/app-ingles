# SP3 — Evaluaciones y paso de nivel · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evaluación de 20 preguntas por nivel, corregida en el servidor, que desbloquea el siguiente nivel con ≥ 80 % y, si se suspende, exige refuerzo + 24 h antes de reintentar.

**Architecture:** Banco de preguntas en YAML compilado `server-only` (como las lecciones). El intento se materializa en Neon (`evaluacion_intentos` + `evaluacion_respuestas`); lógica pura en `src/lib/evaluacion/` (selección, elegibilidad, nota, refuerzo), un servicio que recibe el banco por parámetro (testeable sin catálogo) y server actions con `requireUser`. El cliente solo recibe una «vista» del ejercicio sin soluciones.

**Tech Stack:** Next.js 16.3 (App Router, server actions; LEER `node_modules/next/dist/docs/` antes de tocar páginas/acciones), React 19.3, Drizzle 0.45 + Postgres (Neon), zod 4, Vitest (proyectos `unit` e `integration`), Playwright + playwright-bdd (E2E en Docker).

**Spec:** [docs/superpowers/specs/2026-10-13-sp3-evaluaciones-design.md](../specs/2026-10-13-sp3-evaluaciones-design.md)

**Base:** `main` con `fix/deuda-sp2` y `feat/exportar-progreso` ya mergeadas (las dos verificadas el 2026-10-13). Si no lo están, PARAR y avisar.

## Global Constraints

- UI y microcopy en español profesional; contenido de aprendizaje en inglés (`lang="en"`); `explicacion` en español.
- Toda `page.tsx` y toda server action exportada de `src/app/(app)` llama a `requireUser()`/`requireAdmin()` (lo exige `src/lib/auth/guardas-app.test.ts`). Los `actions.ts` solo exportan `async function`.
- Contenido y soluciones solo en módulos `server-only`; nunca en `public/` ni en props de componentes cliente del examen.
- Zona horaria fija `America/Bogota` para mostrar fechas; las esperas (24 h, 48 h) se miden en horas reales.
- Reglas fijas: 20 preguntas = 5 por bloque (`lectura`, `listening`, `vocabulario`, `gramatica`); banco de 40 = 10 por bloque; aprueba ≥ 80 (16/20); bloque a reforzar < 80; caducidad 48 h; espera 24 h tras suspender + refuerzo completado; refuerzo de 12 ejercicios; ≥ 10 de 20 preguntas distintas del intento anterior.
- Tokens «Terminal Calma» existentes; objetivos táctiles ≥ 44 px (`min-h-11`); feedback = color + icono + texto; foco al enunciado al cambiar de pregunta; sin sonidos; sin scroll horizontal de 360 a 1920 px.
- Sin dependencias nuevas en la app. Única excepción: `pg` y `@types/pg` como devDependencies de `tests/` (Task 9), misma versión exacta que la raíz (`pg 8.23.1`, `@types/pg 8.23.1`). Nada de binarios `.node`.
- **Pruebas (decisión del usuario 2026-10-13):** solo happy path + seguridad importante (sin sesión, acceso a datos ajenos, soluciones fuera del cliente). No escribir tests de casos límite.
- Commits en Conventional Commits, en español, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tests de integración solo contra BD cuyo nombre acaba en `_test`.
- En PowerShell usar `npm.cmd`/`npx.cmd`. Integración: `docker compose up -d --wait db` y `DATABASE_URL`/`DATABASE_URL_TEST` con los valores de `.env.example`.

## Review Focus

1. **Soluciones filtradas al navegador:** el HTML/RSC de `/evaluacion/[nivel]` no debe contener `correcta`, `respuesta`, `aceptadas`, `pares` ni `explicacion` de las preguntas en curso → test de `aVista` (Task 2) + revisión del revisor sobre las props de `FlujoEvaluacion` (Task 7).
2. **Intento ajeno:** un usuario no puede guardar respuestas ni finalizar el intento de otro → test de integración en Task 6.
3. **Nivel bloqueado abierto por URL:** `/camino/B1`, `/leccion/b1-…` y `completarItemAction` con un nivel «Bloqueado» → redirigir/rechazar (Task 5; lo cubre el revisor, sin test propio por la decisión de pruebas).
4. **Recarga a mitad del examen:** al volver a `/evaluacion/A2` se retoma en la primera pregunta sin respuesta y las ya guardadas cuentan → comportamiento de `FlujoEvaluacion` (Task 7), verificado a mano por el `verificador`.
5. **Deploy que cambia el banco con un intento abierto:** el intento pasa a `caducado` y la página no da 500 → `contextoEvaluacion` (Task 6).

---

### Task 1: Banco de evaluación en el modelo de contenido

**Files:**
- Modify: `src/lib/contenido/esquema.ts`
- Modify: `src/lib/contenido/reglas.ts`
- Modify: `src/lib/contenido/catalogo.ts`
- Modify: `src/lib/contenido/videos.ts`
- Modify: `scripts/contenido/compilar.ts` (solo el mensaje final)
- Create: `content/_demo/evaluacion-demo.yaml`
- Test: `src/lib/contenido/reglas.test.ts`, `src/lib/contenido/videos.test.ts` (ajuste del tipo `Catalogo`)

**Interfaces:**
- Produces: `BLOQUES`, `type Bloque`, `type Recurso`, `type Pregunta` (= `Ejercicio & { bloque: Bloque; recurso?: string }`), `type Evaluacion`, `Catalogo.evaluaciones: Evaluacion[]`; `getEvaluacion(nivel: Nivel): Evaluacion | undefined`; `leccionesDeNivel(nivel: Nivel): Leccion[]`; campo opcional `bloque` en todo ejercicio.

- [ ] **Step 1: Test que falla** — añadir al final de `src/lib/contenido/reglas.test.ts`:

```ts
import { BLOQUES } from './esquema';

function bancoA2() {
  const recursos = [
    { tipo: 'lectura', id: 'a2-ev-l1', titulo: 'Read me', texto: 'A short text.' },
    { tipo: 'lectura', id: 'a2-ev-l2', titulo: 'Read me too', texto: 'Another short text.' },
    { tipo: 'video', id: 'a2-ev-v1', fuente: { youtubeId: 'AAAAAAAAAAA', start: 0, end: 60, titulo: 'V1', canal: 'C' } },
    { tipo: 'video', id: 'a2-ev-v2', fuente: { youtubeId: 'BBBBBBBBBBB', start: 0, end: 60, titulo: 'V2', canal: 'C' } },
  ];
  let n = 0;
  const preguntas = BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => {
    n += 1;
    const recurso = bloque === 'lectura' ? (i < 5 ? 'a2-ev-l1' : 'a2-ev-l2') : bloque === 'listening' ? (i < 5 ? 'a2-ev-v1' : 'a2-ev-v2') : undefined;
    return { id: `a2-ev-q${String(n).padStart(2, '0')}`, tipo: 'verdadero_falso', enunciado: '¿V o F?', afirmacion: 'It works.', correcta: true, explicacion: 'Porque sí.', bloque, ...(recurso ? { recurso } : {}) };
  }));
  return { tipo: 'evaluacion', nivel: 'A2', revisado: true, recursos, preguntas };
}

describe('banco de evaluación', () => {
  it('acepta un banco válido y lo publica en el catálogo', () => {
    const r = validarCatalogo([{ ruta: 'content/a2/evaluacion-a2.yaml', demo: false, datos: bancoA2() }], { estricto: true });
    expect(r.errores).toEqual([]);
    expect(r.catalogo.evaluaciones).toHaveLength(1);
    expect(r.catalogo.evaluaciones[0].preguntas).toHaveLength(40);
  });

  it('rechaza un banco con un bloque incompleto', () => {
    const b = bancoA2();
    b.preguntas = b.preguntas.filter((p) => p.id !== 'a2-ev-q40');
    const r = validarCatalogo([{ ruta: 'content/a2/evaluacion-a2.yaml', demo: false, datos: b }], { estricto: true });
    expect(r.errores.join('\n')).toMatch(/gramatica tiene 9 preguntas/);
  });
});
```

(Si `validarCatalogo` y `describe/it/expect` ya están importados en el archivo, no duplicar el import.)

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx.cmd vitest run --project unit src/lib/contenido/reglas.test.ts`
Expected: FAIL (`BLOQUES` no exportado / `evaluaciones` undefined).

- [ ] **Step 3: Esquema** — en `src/lib/contenido/esquema.ts`:

Debajo de `const texto = …` añadir:

```ts
export const BLOQUES = ['lectura', 'listening', 'vocabulario', 'gramatica'] as const;
const bloque = z.enum(BLOQUES);
```

Cambiar `comun` para incluir `bloque` opcional:

```ts
const comun = { id, enunciado: texto, explicacion: texto, terminos: z.array(terminoSchema).optional(), bloque: bloque.optional() };
```

Debajo de `glosarioSchema` añadir y sustituir `archivoSchema`:

```ts
export const recursoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('lectura'), id, titulo: texto, texto }),
  z.object({ tipo: z.literal('video'), id, fuente: videoSchema }),
]);
export const preguntaSchema = z.intersection(ejercicioSchema, z.object({ bloque, recurso: id.optional() }));
export const evaluacionSchema = z.object({
  tipo: z.literal('evaluacion'), nivel, revisado: z.boolean(),
  recursos: z.array(recursoSchema),
  preguntas: z.array(preguntaSchema).min(20),
});

export const archivoSchema = z.discriminatedUnion('tipo', [leccionSchema, tramoSchema, glosarioSchema, evaluacionSchema]);
```

Tipos (sustituir la línea de `Catalogo`):

```ts
export type Bloque = (typeof BLOQUES)[number];
export type Recurso = z.infer<typeof recursoSchema>;
export type Pregunta = z.infer<typeof preguntaSchema>;
export type Evaluacion = z.infer<typeof evaluacionSchema>;
export type Catalogo = { lecciones: Leccion[]; tramos: Tramo[]; glosario: EntradaGlosario[]; evaluaciones: Evaluacion[] };
```

- [ ] **Step 4: Reglas** — en `src/lib/contenido/reglas.ts`:

4a. Importar los tipos nuevos: `import { archivoSchema, BLOQUES, type Catalogo, type Ejercicio, type EntradaGlosario, type Evaluacion, type Leccion, type Tramo } from './esquema';`

4b. En `reglasArchivo`, cambiar la firma a `d: { tipo: string; nivel: string; tema?: string; id?: string }` y añadir al principio, tras calcular `carpeta` y `nombre`:

```ts
  if (d.tipo === 'evaluacion') {
    return d.nivel.toLowerCase() === carpeta && nombre === `evaluacion-${carpeta}` ? [] : [`${ruta}: el banco de ${d.nivel} debe estar en content/${d.nivel.toLowerCase()}/evaluacion-${d.nivel.toLowerCase()}.yaml`];
  }
```

4c. Añadir esta función (debajo de `reglasEjercicio`):

```ts
function reglasEvaluacion(ev: Evaluacion, demo: boolean, videosContenido: ReadonlySet<string>): string[] {
  const err: string[] = [];
  const pref = demo ? 'demo-ev' : `${ev.nivel.toLowerCase()}-ev`;
  const nombre = `evaluación ${ev.nivel}`;
  const recursos = new Map(ev.recursos.map((r) => [r.id, r]));
  if (recursos.size !== ev.recursos.length) err.push(`${nombre}: id de recurso duplicado`);
  for (const r of ev.recursos) {
    if (!r.id.startsWith(`${pref}-`)) err.push(`${r.id}: el id debe empezar por ${pref}-`);
    if (r.tipo === 'video') {
      if (r.fuente.start >= r.fuente.end) err.push(`${r.id}: video con start >= end`);
      if (videosContenido.has(r.fuente.youtubeId)) err.push(`${r.id}: el video ya se usa en una lección o tramo`);
    }
  }
  const ids = new Set<string>();
  const porRecurso = new Map<string, number>();
  for (const p of ev.preguntas) {
    if (ids.has(p.id)) err.push(`id de pregunta duplicado: ${p.id}`);
    ids.add(p.id);
    err.push(...reglasEjercicio(p, pref));
    const necesita = p.bloque === 'lectura' ? 'lectura' : p.bloque === 'listening' ? 'video' : null;
    if (necesita) {
      const r = p.recurso ? recursos.get(p.recurso) : undefined;
      if (!r || r.tipo !== necesita) err.push(`${p.id}: el bloque ${p.bloque} necesita un recurso de tipo ${necesita}`);
      else porRecurso.set(r.id, (porRecurso.get(r.id) ?? 0) + 1);
    } else if (p.recurso) err.push(`${p.id}: el bloque ${p.bloque} no lleva recurso`);
  }
  for (const b of BLOQUES) {
    const n = ev.preguntas.filter((p) => p.bloque === b).length;
    if (demo ? n < 5 : n !== 10) err.push(`${nombre}: el bloque ${b} tiene ${n} preguntas (${demo ? 'mínimo 5' : 'deben ser 10'})`);
  }
  if (!demo) {
    for (const tipo of ['lectura', 'video'] as const) {
      const rs = ev.recursos.filter((r) => r.tipo === tipo);
      if (rs.length !== 2) err.push(`${nombre}: debe haber 2 recursos de tipo ${tipo} (hay ${rs.length})`);
      for (const r of rs) if ((porRecurso.get(r.id) ?? 0) < 4) err.push(`${r.id}: necesita al menos 4 preguntas`);
    }
  }
  return err;
}
```

4d. En `validarCatalogo`: declarar `const evaluaciones: { ev: Evaluacion; demo: boolean }[] = [];` junto a `lecciones/tramos/glosario`; dentro del bucle de archivos, justo después de `const d = r.data;` y de `reglasArchivo`, añadir:

```ts
    if (d.tipo === 'evaluacion') { evaluaciones.push({ ev: d, demo: a.demo }); continue; }
```

4e. Sustituir `const catalogo: Catalogo = { lecciones, tramos, glosario };` por:

```ts
  const videosContenido = new Set([...lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])), ...tramos.map((t) => t.fuente.youtubeId)]);
  const porNivel = new Map<string, { ev: Evaluacion; demo: boolean }>();
  for (const x of evaluaciones) {
    errores.push(...reglasEvaluacion(x.ev, x.demo, videosContenido));
    if (!x.ev.revisado && !x.demo) (opts.estricto ? errores : avisos).push(`evaluacion-${x.ev.nivel.toLowerCase()}: revisado: false`);
    const previa = porNivel.get(x.ev.nivel);
    if (!previa) porNivel.set(x.ev.nivel, x);
    else if (previa.demo !== x.demo) {
      avisos.push(`evaluación ${x.ev.nivel}: se usa el banco de demo`);
      if (x.demo) porNivel.set(x.ev.nivel, x);
    } else errores.push(`evaluación ${x.ev.nivel} duplicada`);
  }
  const catalogo: Catalogo = { lecciones, tramos, glosario, evaluaciones: [...porNivel.values()].map((x) => x.ev) };
```

- [ ] **Step 5: Catálogo y videos**

En `src/lib/contenido/catalogo.ts` añadir `Evaluacion` al import de tipos y, al final:

```ts
const evaluaciones = new Map(catalogo.evaluaciones.map((e) => [e.nivel, e]));
export const getEvaluacion = (nivel: Nivel): Evaluacion | undefined => evaluaciones.get(nivel);
export const leccionesDeNivel = (nivel: Nivel): Leccion[] => catalogo.lecciones.filter((l) => l.nivel === nivel).sort((a, b) => a.orden - b.orden);
```

En `src/lib/contenido/videos.ts`, `idsDeVideo`:

```ts
export function idsDeVideo(c: Catalogo): string[] {
  return [...new Set([
    ...c.lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])),
    ...c.tramos.map((t) => t.fuente.youtubeId),
    ...c.evaluaciones.flatMap((e) => e.recursos.flatMap((r) => (r.tipo === 'video' ? [r.fuente.youtubeId] : []))),
  ])];
}
```

En `scripts/contenido/compilar.ts`, en el `console.log` final añadir `, ${catalogo.evaluaciones.length} evaluaciones` tras las entradas.

Donde un test construya un `Catalogo` literal (p. ej. `videos.test.ts`), añadir `evaluaciones: []`.

- [ ] **Step 6: Banco de demo** — crear `content/_demo/evaluacion-demo.yaml` (lo usan los E2E; todas las respuestas correctas son «Verdadero»):

```yaml
tipo: evaluacion
nivel: A2
revisado: false
recursos:
  - tipo: lectura
    id: demo-ev-l1
    titulo: A Small Team
    texto: |
      Mia is a tester. Every morning she reads the bug list and checks the new build.
      When a test fails, she writes a clear report for the developers.
  - tipo: video
    id: demo-ev-v1
    fuente: { youtubeId: g0176p-SYP8, start: 10, end: 70, titulo: "Demo listening", canal: "Demo" }
preguntas:
  - { id: demo-ev-q01, bloque: lectura, recurso: demo-ev-l1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "Mia is a tester.", correcta: true, explicacion: "La lectura dice «Mia is a tester»." }
  - { id: demo-ev-q02, bloque: lectura, recurso: demo-ev-l1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "Mia checks the new build.", correcta: true, explicacion: "«checks the new build»." }
  - { id: demo-ev-q03, bloque: lectura, recurso: demo-ev-l1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "Mia reads the bug list.", correcta: true, explicacion: "«reads the bug list»." }
  - { id: demo-ev-q04, bloque: lectura, recurso: demo-ev-l1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "Mia writes reports.", correcta: true, explicacion: "«she writes a clear report»." }
  - { id: demo-ev-q05, bloque: lectura, recurso: demo-ev-l1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The reports are for developers.", correcta: true, explicacion: "«for the developers»." }
  - { id: demo-ev-q06, bloque: listening, recurso: demo-ev-v1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The video is about testing.", correcta: true, explicacion: "Demo." }
  - { id: demo-ev-q07, bloque: listening, recurso: demo-ev-v1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The speaker talks about bugs.", correcta: true, explicacion: "Demo." }
  - { id: demo-ev-q08, bloque: listening, recurso: demo-ev-v1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The video is in English.", correcta: true, explicacion: "Demo." }
  - { id: demo-ev-q09, bloque: listening, recurso: demo-ev-v1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The video is short.", correcta: true, explicacion: "Demo." }
  - { id: demo-ev-q10, bloque: listening, recurso: demo-ev-v1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "You can watch it at 0.75x.", correcta: true, explicacion: "Demo." }
  - { id: demo-ev-q11, bloque: vocabulario, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "A bug is an error in the code.", correcta: true, explicacion: "bug = error." }
  - { id: demo-ev-q12, bloque: vocabulario, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "A branch is a line of work in git.", correcta: true, explicacion: "branch = rama." }
  - { id: demo-ev-q13, bloque: vocabulario, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "To deploy means to publish an app.", correcta: true, explicacion: "deploy = desplegar." }
  - { id: demo-ev-q14, bloque: vocabulario, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "A commit saves changes.", correcta: true, explicacion: "commit = confirmación." }
  - { id: demo-ev-q15, bloque: vocabulario, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "A test checks the code.", correcta: true, explicacion: "test = prueba." }
  - { id: demo-ev-q16, bloque: gramatica, tipo: verdadero_falso, enunciado: "¿Es correcta la frase?", afirmacion: "She checks the build every day.", correcta: true, explicacion: "Present simple con -s en tercera persona." }
  - { id: demo-ev-q17, bloque: gramatica, tipo: verdadero_falso, enunciado: "¿Es correcta la frase?", afirmacion: "They fixed the bug yesterday.", correcta: true, explicacion: "Past simple." }
  - { id: demo-ev-q18, bloque: gramatica, tipo: verdadero_falso, enunciado: "¿Es correcta la frase?", afirmacion: "We are writing tests now.", correcta: true, explicacion: "Present continuous." }
  - { id: demo-ev-q19, bloque: gramatica, tipo: verdadero_falso, enunciado: "¿Es correcta la frase?", afirmacion: "He doesn't use mocks.", correcta: true, explicacion: "Negación con doesn't." }
  - { id: demo-ev-q20, bloque: gramatica, tipo: verdadero_falso, enunciado: "¿Es correcta la frase?", afirmacion: "Did you run the tests?", correcta: true, explicacion: "Pregunta en past simple." }
```

(El video `g0176p-SYP8` no está en lecciones ni tramos; si `npm run content:build` con `CONTENT_DEMO=1` dice lo contrario, usar otro ID que pase oEmbed.)

- [ ] **Step 7: Verificar**

Run: `npx.cmd vitest run --project unit src/lib/contenido` → PASS.
Run: `npm.cmd run content:build` → sin errores. En PowerShell: `$env:CONTENT_DEMO='1'; npm.cmd run content:build; Remove-Item Env:CONTENT_DEMO` → sin errores, «1 evaluaciones (con demo)».
Run: `npm.cmd run typecheck` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/contenido scripts/contenido content/_demo/evaluacion-demo.yaml
git commit -m "feat(contenido): banco de evaluación por nivel con reglas y banco de demo"
```

---

### Task 2: Vista del ejercicio sin soluciones

**Files:**
- Create: `src/lib/contenido/vista.ts`
- Create: `src/components/ejercicios/campos-ejercicio.tsx`
- Modify: `src/components/ejercicios/ejercicio.tsx`, `opcion-multiple.tsx`, `completar.tsx`, `ordenar.tsx`, `emparejar.tsx`, `verdadero-falso.tsx`
- Test: `src/lib/contenido/vista.test.ts`

**Interfaces:**
- Consumes: `Ejercicio` (Task 1), `barajar` (`src/lib/aprendizaje/barajar.ts`).
- Produces: `type EjercicioVista`; `aVista(e: Ejercicio): EjercicioVista`; `<CamposEjercicio vista onResponder />` (renderiza los controles de cualquier tipo, sin corregir).

- [ ] **Step 1: Test que falla (seguridad)** — `src/lib/contenido/vista.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { aVista } from './vista';
import type { Ejercicio } from './esquema';

const ejercicios: Ejercicio[] = [
  { id: 'x-e1', tipo: 'opcion_multiple', enunciado: 'E', explicacion: 'SECRETO', opciones: ['a', 'b'], correcta: 1 },
  { id: 'x-e2', tipo: 'completar', enunciado: 'E', explicacion: 'SECRETO', texto: 'I ___ code.', respuesta: 'write', aceptadas: ['type'] },
  { id: 'x-e3', tipo: 'ordenar', enunciado: 'E', explicacion: 'SECRETO', piezas: ['We', 'ship', 'small', 'changes'] },
  { id: 'x-e4', tipo: 'emparejar', enunciado: 'E', explicacion: 'SECRETO', pares: [{ a: 'bug', b: 'error' }, { a: 'branch', b: 'rama' }, { a: 'merge', b: 'fusionar' }] },
  { id: 'x-e5', tipo: 'verdadero_falso', enunciado: 'E', explicacion: 'SECRETO', afirmacion: 'It works.', correcta: false },
];

describe('aVista', () => {
  it.each(ejercicios.map((e) => [e.tipo, e]))('%s no expone la solución ni la explicación', (_t, e) => {
    const json = JSON.stringify(aVista(e));
    expect(json).not.toMatch(/correcta|respuesta|aceptadas|pares|explicacion|SECRETO|"write"|"type"/);
  });

  it('ordenar y emparejar llegan barajados pero completos', () => {
    const o = aVista(ejercicios[2]);
    const m = aVista(ejercicios[3]);
    if (o.tipo !== 'ordenar' || m.tipo !== 'emparejar') throw new Error('tipo');
    expect(o.piezas).not.toEqual(['We', 'ship', 'small', 'changes']);
    expect([...o.piezas].sort()).toEqual(['We', 'changes', 'ship', 'small'].sort());
    expect(m.izquierda).toEqual(['bug', 'branch', 'merge']);
    expect([...m.derecha].sort()).toEqual(['error', 'fusionar', 'rama']);
  });
});
```

- [ ] **Step 2:** Run `npx.cmd vitest run --project unit src/lib/contenido/vista.test.ts` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar** `src/lib/contenido/vista.ts`:

```ts
import type { Ejercicio } from './esquema';
import { barajar } from '@/lib/aprendizaje/barajar';

type Base = { id: string; enunciado: string };
/** Lo único que ve el navegador de un ejercicio: sin solución ni explicación. */
export type EjercicioVista =
  | (Base & { tipo: 'opcion_multiple'; opciones: string[] })
  | (Base & { tipo: 'completar'; texto: string })
  | (Base & { tipo: 'ordenar'; piezas: string[] })
  | (Base & { tipo: 'emparejar'; izquierda: string[]; derecha: string[] })
  | (Base & { tipo: 'verdadero_falso'; afirmacion: string });

export function aVista(e: Ejercicio): EjercicioVista {
  const base = { id: e.id, enunciado: e.enunciado };
  switch (e.tipo) {
    case 'opcion_multiple': return { ...base, tipo: e.tipo, opciones: e.opciones };
    case 'completar': return { ...base, tipo: e.tipo, texto: e.texto };
    case 'ordenar': return { ...base, tipo: e.tipo, piezas: barajar(e.piezas, e.id) };
    case 'emparejar': return { ...base, tipo: e.tipo, izquierda: e.pares.map((p) => p.a), derecha: barajar(e.pares.map((p) => p.b), e.id) };
    case 'verdadero_falso': return { ...base, tipo: e.tipo, afirmacion: e.afirmacion };
  }
}
```

- [ ] **Step 4:** Run el test → PASS.

- [ ] **Step 5: Componentes con la vista** (la práctica no cambia de comportamiento: el barajado se mueve de los componentes a `aVista`, con la misma semilla).

En los 5 subcomponentes, cambiar el tipo de la prop `ejercicio` de `Extract<Ejercicio, { tipo: 'X' }>` a `Extract<EjercicioVista, { tipo: 'X' }>` (import `type EjercicioVista` de `@/lib/contenido/vista` y quitar el import de `Ejercicio`). Además:
- `ordenar.tsx`: sustituir `const barajadas = useMemo(() => barajar(ejercicio.piezas, ejercicio.id), [ejercicio]);` por `const barajadas = ejercicio.piezas;` y quitar los imports de `barajar` y `useMemo` si quedan sin uso.
- `emparejar.tsx`: sustituir `opciones` por `const opciones = ejercicio.derecha;`, iterar `ejercicio.izquierda.map((a, i) => …)` en lugar de `ejercicio.pares.map((p, i) => …)` (usando `a` donde ponía `p.a`), y la condición de respuesta completa por `ejercicio.izquierda.every((a) => next[a])`. Quitar `barajar`/`useMemo` si quedan sin uso.

Crear `src/components/ejercicios/campos-ejercicio.tsx`:

```tsx
'use client';
import type { EjercicioVista } from '@/lib/contenido/vista';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { OpcionMultiple } from './opcion-multiple';
import { Completar } from './completar';
import { Ordenar } from './ordenar';
import { Emparejar } from './emparejar';
import { VerdaderoFalso } from './verdadero-falso';

/** Controles del ejercicio, sin comprobar. Para reiniciarlos, cambiar la `key` del componente. */
export function CamposEjercicio({ vista, onResponder }: { vista: EjercicioVista; onResponder: (r: RespuestaUsuario | null) => void }) {
  switch (vista.tipo) {
    case 'opcion_multiple': return <OpcionMultiple ejercicio={vista} onResponder={onResponder} />;
    case 'completar': return <Completar ejercicio={vista} onResponder={onResponder} />;
    case 'ordenar': return <Ordenar ejercicio={vista} onResponder={onResponder} />;
    case 'emparejar': return <Emparejar ejercicio={vista} onResponder={onResponder} />;
    case 'verdadero_falso': return <VerdaderoFalso ejercicio={vista} onResponder={onResponder} />;
  }
}
```

En `ejercicio.tsx`: importar `useMemo`, `aVista` y `CamposEjercicio`; quitar los imports de los 5 subcomponentes; añadir `const vista = useMemo(() => aVista(ejercicio), [ejercicio]);` y sustituir las 5 líneas `{ejercicio.tipo === … && <… key={intento} … />}` por:

```tsx
        <CamposEjercicio key={intento} vista={vista} onResponder={setResp} />
```

(Borrar `const props = { onResponder: setResp };` si queda sin uso.)

- [ ] **Step 6: Verificar** — `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/contenido/vista.ts src/lib/contenido/vista.test.ts src/components/ejercicios
git commit -m "refactor(ejercicios): vista sin soluciones para los controles de ejercicio"
```

---

### Task 3: Lógica pura de la evaluación

**Files:**
- Create: `src/lib/evaluacion/nota.ts`, `seleccionar.ts`, `elegibilidad.ts`, `refuerzo.ts`, `detalle.ts`, `respuesta.ts`, `tipos.ts`
- Test: `src/lib/evaluacion/logica.test.ts`

**Interfaces:**
- Consumes: `BLOQUES`, `Bloque`, `Pregunta`, `Ejercicio`, `Recurso` (Task 1); `EjercicioVista` (Task 2); `corregir`, `RespuestaUsuario` (`src/lib/aprendizaje/corregir.ts`); `barajar`; `EstadoNivel` (`src/lib/progreso/niveles.ts`).
- Produces:
  - `UMBRAL = 80`; `calcularNota(preguntas: readonly { id: string; bloque: Bloque }[], aciertos: ReadonlySet<string>): { nota: number; bloques: Record<Bloque, number>; aprobado: boolean; aReforzar: Bloque[] }`
  - `POR_BLOQUE = 5`; `aleatorio(): number`; `seleccionarPreguntas(banco: readonly Pregunta[], anterior: readonly string[], rnd?: () => number): string[]`
  - `CADUCIDAD_MS`, `ESPERA_MS`; `type EstadoIntento = 'en_curso' | 'aprobado' | 'suspendido' | 'caducado'`; `type IntentoResumen = { id: string; estado: EstadoIntento; iniciadoAt: Date; terminadoAt: Date | null; refuerzoCompletadoAt: Date | null }`; `caducado(i: { iniciadoAt: Date }, ahora: Date): boolean`; `type Elegibilidad`; `elegibilidad(x): Elegibilidad`
  - `TAMANO_REFUERZO = 12`; `bloqueDe(e: Ejercicio, origen: 'leccion' | 'tramo'): Bloque`; `armarRefuerzo(fuente, bloques, semilla): Ejercicio[]`
  - `textoRespuesta(e: Ejercicio, r: RespuestaUsuario | null): string`; `textoCorrecta(e: Ejercicio): string`
  - `respuestaSchema` (zod) y `parsearRespuesta(json: string): RespuestaUsuario | null`
  - `type PreguntaExamen = { bloque: Bloque; vista: EjercicioVista; recurso?: Recurso }`; `ETIQUETA_BLOQUE: Record<Bloque, string>`

- [ ] **Step 1: Tests que fallan (happy path)** — `src/lib/evaluacion/logica.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { BLOQUES, type Pregunta } from '@/lib/contenido/esquema';
import { calcularNota } from './nota';
import { seleccionarPreguntas } from './seleccionar';
import { elegibilidad, ESPERA_MS } from './elegibilidad';
import { armarRefuerzo } from './refuerzo';
import { parsearRespuesta } from './respuesta';

/** Banco realista: lectura y listening con 2 recursos de 4 y 6 preguntas; vocabulario y gramática sueltas. */
function banco(): Pregunta[] {
  return BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => ({
    id: `a2-ev-${bloque}-${i}`, tipo: 'verdadero_falso' as const, enunciado: 'E', afirmacion: 'A', correcta: true, explicacion: 'X', bloque,
    recurso: bloque === 'lectura' || bloque === 'listening' ? `${bloque}-${i < 4 ? 'r1' : 'r2'}` : undefined,
  })));
}
function semilla(n: number) { let s = n; return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31); }

describe('calcularNota', () => {
  it('16 de 20 aprueba y marca el bloque flojo', () => {
    const ps = banco().filter((_, i) => i % 2 === 0); // 5 por bloque
    const fallos = new Set(['a2-ev-gramatica-0', 'a2-ev-gramatica-2', 'a2-ev-gramatica-4', 'a2-ev-gramatica-6']);
    const aciertos = new Set(ps.filter((p) => !fallos.has(p.id)).map((p) => p.id));
    const r = calcularNota(ps, aciertos);
    expect(r.nota).toBe(80);
    expect(r.aprobado).toBe(true);
    expect(r.aReforzar).toEqual(['gramatica']);
  });
});

describe('seleccionarPreguntas', () => {
  it('elige 5 por bloque y al reintentar al menos 10 de 20 son distintas (200 semillas)', () => {
    const b = banco();
    for (let s = 1; s <= 200; s++) {
      const primero = seleccionarPreguntas(b, [], semilla(s));
      expect(primero).toHaveLength(20);
      for (const bl of BLOQUES) expect(primero.filter((id) => id.includes(`-${bl}-`))).toHaveLength(5);
      const segundo = seleccionarPreguntas(b, primero, semilla(s + 1000));
      expect(segundo.filter((id) => !primero.includes(id)).length).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('elegibilidad', () => {
  const base = { estadoNivel: 'en_curso' as const, hayBanco: true, lecciones: 8, hechas: 8, abierto: null, aprobado: null, ultimo: null, ahora: new Date('2026-10-14T12:00:00Z') };
  it('con todas las lecciones hechas puede presentar', () => expect(elegibilidad(base).tipo).toBe('puede'));
  it('con lecciones pendientes dice cuántas faltan', () => expect(elegibilidad({ ...base, hechas: 5 })).toEqual({ tipo: 'faltan_lecciones', faltan: 3 }));
  it('tras suspender exige refuerzo y luego 24 h', () => {
    const terminadoAt = new Date(base.ahora.getTime() - 60_000);
    const ultimo = { id: 'i1', estado: 'suspendido' as const, iniciadoAt: terminadoAt, terminadoAt, refuerzoCompletadoAt: null };
    expect(elegibilidad({ ...base, ultimo }).tipo).toBe('falta_refuerzo');
    const conRefuerzo = { ...ultimo, refuerzoCompletadoAt: base.ahora };
    expect(elegibilidad({ ...base, ultimo: conRefuerzo })).toEqual({ tipo: 'espera', hasta: new Date(terminadoAt.getTime() + ESPERA_MS) });
  });
});

describe('armarRefuerzo y respuestas', () => {
  it('arma hasta 12 ejercicios solo de los bloques flojos', () => {
    const fuente = Array.from({ length: 30 }, (_, i) => ({ origen: 'leccion' as const, ejercicio: { id: `l-e${i}`, tipo: 'completar' as const, enunciado: 'E', explicacion: 'X', texto: 'a ___ b', respuesta: 'x' } }));
    const r = armarRefuerzo(fuente, ['gramatica'], 'intento-1');
    expect(r).toHaveLength(12);
    expect(armarRefuerzo(fuente, ['vocabulario'], 'intento-1')).toHaveLength(0);
  });
  it('parsea una respuesta válida y rechaza basura', () => {
    expect(parsearRespuesta('{"tipo":"verdadero_falso","valor":true}')).toEqual({ tipo: 'verdadero_falso', valor: true });
    expect(parsearRespuesta('no json')).toBeNull();
  });
});
```

- [ ] **Step 2:** Run `npx.cmd vitest run --project unit src/lib/evaluacion` → FAIL (módulos no existen).

- [ ] **Step 3: Implementar**

`src/lib/evaluacion/nota.ts`:

```ts
import { BLOQUES, type Bloque } from '@/lib/contenido/esquema';

export const UMBRAL = 80;
export type ResultadoNota = { nota: number; bloques: Record<Bloque, number>; aprobado: boolean; aReforzar: Bloque[] };

export function calcularNota(preguntas: readonly { id: string; bloque: Bloque }[], aciertos: ReadonlySet<string>): ResultadoNota {
  const pct = (ps: readonly { id: string }[]) => (ps.length ? Math.round((ps.filter((p) => aciertos.has(p.id)).length * 100) / ps.length) : 0);
  const bloques = Object.fromEntries(BLOQUES.map((b) => [b, pct(preguntas.filter((p) => p.bloque === b))])) as Record<Bloque, number>;
  const nota = pct(preguntas);
  return { nota, bloques, aprobado: nota >= UMBRAL, aReforzar: BLOQUES.filter((b) => bloques[b] < UMBRAL) };
}
```

`src/lib/evaluacion/seleccionar.ts`:

```ts
import { BLOQUES, type Pregunta } from '@/lib/contenido/esquema';

export const POR_BLOQUE = 5;
export const aleatorio = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

function mezclar<T>(xs: T[], rnd: () => number): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/**
 * 5 preguntas por bloque. Las que comparten recurso (lectura/video) salen juntas. Primero los grupos y las
 * preguntas que no salieron en el intento anterior, así un reintento repite lo mínimo posible.
 */
export function seleccionarPreguntas(banco: readonly Pregunta[], anterior: readonly string[], rnd: () => number = aleatorio): string[] {
  const usadas = new Set(anterior);
  const usado = (g: Pregunta[]) => g.filter((p) => usadas.has(p.id)).length / g.length;
  const out: string[] = [];
  for (const b of BLOQUES) {
    const grupos = new Map<string, Pregunta[]>();
    for (const p of banco) if (p.bloque === b) grupos.set(p.recurso ?? p.id, [...(grupos.get(p.recurso ?? p.id) ?? []), p]);
    const lista = mezclar([...grupos.values()], rnd)
      .map((g) => [...g].sort((x, y) => Number(usadas.has(x.id)) - Number(usadas.has(y.id))))
      .sort((g1, g2) => usado(g1) - usado(g2));
    let n = 0;
    for (const g of lista) {
      if (n >= POR_BLOQUE) break;
      const toma = g.slice(0, POR_BLOQUE - n);
      out.push(...toma.map((p) => p.id));
      n += toma.length;
    }
  }
  return out;
}
```

`src/lib/evaluacion/elegibilidad.ts`:

```ts
import type { EstadoNivel } from '@/lib/progreso/niveles';

export const CADUCIDAD_MS = 48 * 3600_000;
export const ESPERA_MS = 24 * 3600_000;
export type EstadoIntento = 'en_curso' | 'aprobado' | 'suspendido' | 'caducado';
export type IntentoResumen = { id: string; estado: EstadoIntento; iniciadoAt: Date; terminadoAt: Date | null; refuerzoCompletadoAt: Date | null };
export type Elegibilidad =
  | { tipo: 'aprobado'; intentoId: string }
  | { tipo: 'bloqueado_nivel' }
  | { tipo: 'sin_banco' }
  | { tipo: 'reanudar'; intentoId: string }
  | { tipo: 'faltan_lecciones'; faltan: number }
  | { tipo: 'falta_refuerzo'; intentoId: string }
  | { tipo: 'espera'; hasta: Date }
  | { tipo: 'puede' };

export const caducado = (i: { iniciadoAt: Date }, ahora: Date) => i.iniciadoAt.getTime() + CADUCIDAD_MS <= ahora.getTime();

export function elegibilidad(x: {
  estadoNivel: EstadoNivel; hayBanco: boolean; lecciones: number; hechas: number;
  abierto: IntentoResumen | null; aprobado: IntentoResumen | null; ultimo: IntentoResumen | null; ahora: Date;
}): Elegibilidad {
  if (x.aprobado) return { tipo: 'aprobado', intentoId: x.aprobado.id };
  if (x.estadoNivel !== 'en_curso') return { tipo: 'bloqueado_nivel' };
  if (!x.hayBanco || x.lecciones === 0) return { tipo: 'sin_banco' };
  if (x.abierto && !caducado(x.abierto, x.ahora)) return { tipo: 'reanudar', intentoId: x.abierto.id };
  if (x.hechas < x.lecciones) return { tipo: 'faltan_lecciones', faltan: x.lecciones - x.hechas };
  if (x.ultimo?.estado === 'suspendido' && x.ultimo.terminadoAt) {
    if (!x.ultimo.refuerzoCompletadoAt) return { tipo: 'falta_refuerzo', intentoId: x.ultimo.id };
    const hasta = new Date(x.ultimo.terminadoAt.getTime() + ESPERA_MS);
    if (hasta > x.ahora) return { tipo: 'espera', hasta };
  }
  return { tipo: 'puede' };
}
```

`src/lib/evaluacion/refuerzo.ts`:

```ts
import type { Bloque, Ejercicio } from '@/lib/contenido/esquema';
import { barajar } from '@/lib/aprendizaje/barajar';

export const TAMANO_REFUERZO = 12;

/** Bloque de un ejercicio de práctica: el explícito o la regla por defecto del spec (§5.3). */
export function bloqueDe(e: Ejercicio, origen: 'leccion' | 'tramo'): Bloque {
  if (e.bloque) return e.bloque;
  if (origen === 'tramo') return 'listening';
  if (e.terminos?.length) return 'vocabulario';
  if (e.tipo === 'completar' || e.tipo === 'ordenar') return 'gramatica';
  return 'lectura';
}

export function armarRefuerzo(fuente: readonly { ejercicio: Ejercicio; origen: 'leccion' | 'tramo' }[], bloques: readonly Bloque[], semilla: string): Ejercicio[] {
  const flojos = new Set(bloques);
  const candidatos = fuente.filter((f) => flojos.has(bloqueDe(f.ejercicio, f.origen))).map((f) => f.ejercicio);
  return barajar(candidatos, semilla).slice(0, TAMANO_REFUERZO);
}
```

`src/lib/evaluacion/respuesta.ts`:

```ts
import { z } from 'zod';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

const corto = z.string().max(200);
export const respuestaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('opcion_multiple'), indice: z.number().int().min(0).max(3) }),
  z.object({ tipo: z.literal('completar'), texto: corto }),
  z.object({ tipo: z.literal('ordenar'), orden: z.array(corto).max(8) }),
  z.object({ tipo: z.literal('emparejar'), asignacion: z.record(corto, corto) }),
  z.object({ tipo: z.literal('verdadero_falso'), valor: z.boolean() }),
]);

export function parsearRespuesta(json: string): RespuestaUsuario | null {
  try {
    const r = respuestaSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
```

`src/lib/evaluacion/detalle.ts`:

```ts
import type { Ejercicio } from '@/lib/contenido/esquema';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';

const vf = (v: boolean) => (v ? 'Verdadero' : 'Falso');

export function textoRespuesta(e: Ejercicio, r: RespuestaUsuario | null): string {
  if (!r || r.tipo !== e.tipo) return 'Sin respuesta';
  switch (r.tipo) {
    case 'opcion_multiple': return e.tipo === 'opcion_multiple' ? (e.opciones[r.indice] ?? 'Sin respuesta') : 'Sin respuesta';
    case 'completar': return r.texto;
    case 'ordenar': return r.orden.join(' ');
    case 'emparejar': return Object.entries(r.asignacion).map(([a, b]) => `${a} → ${b}`).join(' · ');
    case 'verdadero_falso': return vf(r.valor);
  }
}

export function textoCorrecta(e: Ejercicio): string {
  switch (e.tipo) {
    case 'opcion_multiple': return e.opciones[e.correcta];
    case 'completar': return e.respuesta;
    case 'ordenar': return e.piezas.join(' ');
    case 'emparejar': return e.pares.map((p) => `${p.a} → ${p.b}`).join(' · ');
    case 'verdadero_falso': return vf(e.correcta);
  }
}
```

`src/lib/evaluacion/tipos.ts`:

```ts
import type { Bloque, Recurso } from '@/lib/contenido/esquema';
import type { EjercicioVista } from '@/lib/contenido/vista';

/** Lo que el navegador recibe de cada pregunta del examen (nunca la pregunta completa). */
export type PreguntaExamen = { bloque: Bloque; vista: EjercicioVista; recurso?: Recurso };
export const ETIQUETA_BLOQUE: Record<Bloque, string> = { lectura: 'Lectura', listening: 'Listening', vocabulario: 'Vocabulario', gramatica: 'Gramática' };
```

- [ ] **Step 4:** Run `npx.cmd vitest run --project unit src/lib/evaluacion` → PASS. Run `npm.cmd run lint` y `npm.cmd run typecheck` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/evaluacion
git commit -m "feat(evaluacion): selección, elegibilidad, nota y refuerzo"
```

---

### Task 4: Datos de la evaluación (migración + repo)

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: `drizzle/0004_*.sql` (generado)
- Create: `src/lib/evaluacion/evaluacion.repo.ts`
- Modify: `src/lib/db/test-utils.ts`, `src/lib/progreso/reset.ts`, `src/lib/exportar/serializar.ts`, `src/lib/exportar/exportar.repo.ts`
- Test: `src/lib/evaluacion/evaluacion.int.test.ts`

**Interfaces:**
- Consumes: `Nivel`, `Bloque` (Task 1); `EstadoIntento` (Task 3).
- Produces (todas reciben `db: Db` primero):
  - `type Intento = typeof evaluacionIntentos.$inferSelect`
  - `crearIntento(db, { userId, nivel, preguntas: string[] }): Promise<string>` (devuelve el intento abierto si ya existía)
  - `intentoAbierto(db, userId, nivel): Promise<Intento | null>`; `ultimoTerminado(db, userId, nivel)`; `intentoAprobado(db, userId, nivel)`; `getIntento(db, userId, intentoId)` (filtra por dueño)
  - `guardarRespuesta(db, intentoId, preguntaId, respuesta: string): Promise<void>`; `respuestasDe(db, intentoId): Promise<Map<string, string>>`
  - `cerrarIntento(db, intentoId, { estado: 'aprobado' | 'suspendido'; nota: number; bloques: Record<Bloque, number>; ahora: Date }): Promise<void>`
  - `marcarCaducado(db, intentoId): Promise<void>`; `marcarRefuerzo(db, userId, intentoId, ahora): Promise<void>`
  - `nivelesAprobados(db, userId): Promise<Nivel[]>`; `historial(db, userId)`; `notasBloques(i: Intento): Record<Bloque, number>`

- [ ] **Step 1: Esquema** — en `src/lib/db/schema.ts` añadir `uniqueIndex` al import de `drizzle-orm/pg-core` y, al final:

```ts
export const estadoIntentoEnum = pgEnum('estado_intento', ['en_curso', 'aprobado', 'suspendido', 'caducado']);

export const evaluacionIntentos = pgTable(
  'evaluacion_intentos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    nivel: nivelEnum('nivel').notNull(),
    estado: estadoIntentoEnum('estado').notNull().default('en_curso'),
    preguntas: text('preguntas').array().notNull(),
    iniciadoAt: ts('iniciado_at').notNull().defaultNow(),
    terminadoAt: ts('terminado_at'),
    nota: smallint('nota'),
    notaLectura: smallint('nota_lectura'),
    notaListening: smallint('nota_listening'),
    notaVocabulario: smallint('nota_vocabulario'),
    notaGramatica: smallint('nota_gramatica'),
    refuerzoCompletadoAt: ts('refuerzo_completado_at'),
  },
  (t) => [
    uniqueIndex('evaluacion_un_intento_abierto').on(t.userId, t.nivel).where(sql`${t.estado} = 'en_curso'`),
    index('evaluacion_user_nivel_inicio').on(t.userId, t.nivel, t.iniciadoAt),
    check('evaluacion_nota', sql`${t.nota} between 0 and 100`),
  ],
);

export const evaluacionRespuestas = pgTable(
  'evaluacion_respuestas',
  {
    intentoId: uuid('intento_id').notNull().references(() => evaluacionIntentos.id, { onDelete: 'cascade' }),
    preguntaId: text('pregunta_id').notNull(),
    respuesta: text('respuesta').notNull(),
    respondidaAt: ts('respondida_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.intentoId, t.preguntaId] })],
);
```

- [ ] **Step 2: Migración** — Run `npm.cmd run db:generate`. Expected: nuevo `drizzle/0004_<nombre>.sql` con `CREATE TYPE estado_intento`, las 2 tablas, el índice único parcial y el índice compuesto. Revisar que solo crea (no altera ni borra nada existente).

- [ ] **Step 3: Utilidades de test, reset y exportación**
- `src/lib/db/test-utils.ts`: en el `TRUNCATE`, añadir `evaluacion_respuestas, evaluacion_intentos, ` al principio de la lista.
- `src/lib/progreso/reset.ts`: importar `evaluacionIntentos`; añadir `evaluacion_intentos: number;` a `Conteo` y `evaluacion_intentos: evaluacionIntentos` a `TABLAS` (las respuestas caen por cascada).
- `src/lib/exportar/serializar.ts`: añadir a `DatosExportacion` `evaluaciones: { nivel: string; estado: string; nota: number | null; iniciadoAt: Date; terminadoAt: Date | null }[];` y al objeto devuelto:

```ts
    evaluaciones: d.evaluaciones.map((e) => ({
      nivel: e.nivel, estado: e.estado, nota: e.nota, iniciadaEn: diaBogota(e.iniciadoAt), terminadaEn: e.terminadoAt ? diaBogota(e.terminadoAt) : null,
    })),
```

- `src/lib/exportar/exportar.repo.ts`: añadir al `Promise.all` la consulta `db.select({ nivel: evaluacionIntentos.nivel, estado: evaluacionIntentos.estado, nota: evaluacionIntentos.nota, iniciadoAt: evaluacionIntentos.iniciadoAt, terminadoAt: evaluacionIntentos.terminadoAt }).from(evaluacionIntentos).where(eq(evaluacionIntentos.userId, userId)).orderBy(asc(evaluacionIntentos.iniciadoAt))`, desestructurarla como `evals` y devolver `evaluaciones: evals`. Ajustar los fixtures de `serializar.test.ts` con `evaluaciones: []`.

- [ ] **Step 4: Repo** — `src/lib/evaluacion/evaluacion.repo.ts`:

```ts
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { evaluacionIntentos as ei, evaluacionRespuestas as er } from '@/lib/db/schema';
import type { Bloque, Nivel } from '@/lib/contenido/esquema';

export type Intento = typeof ei.$inferSelect;

export async function crearIntento(db: Db, x: { userId: string; nivel: Nivel; preguntas: string[] }): Promise<string> {
  const [r] = await db.insert(ei).values(x).onConflictDoNothing().returning({ id: ei.id });
  if (r) return r.id;
  const abierto = await intentoAbierto(db, x.userId, x.nivel);
  if (!abierto) throw new Error('No se pudo crear el intento de evaluación');
  return abierto.id;
}

const uno = async (q: Promise<Intento[]>) => (await q)[0] ?? null;

export const intentoAbierto = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), eq(ei.estado, 'en_curso'))).limit(1));
export const intentoAprobado = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), eq(ei.estado, 'aprobado'))).limit(1));
export const ultimoTerminado = (db: Db, userId: string, nivel: Nivel) =>
  uno(db.select().from(ei).where(and(eq(ei.userId, userId), eq(ei.nivel, nivel), inArray(ei.estado, ['aprobado', 'suspendido']))).orderBy(desc(ei.terminadoAt)).limit(1));
/** Siempre filtra por dueño: un intento ajeno no existe para este usuario. */
export const getIntento = (db: Db, userId: string, intentoId: string) =>
  uno(db.select().from(ei).where(and(eq(ei.id, intentoId), eq(ei.userId, userId))).limit(1));

export async function guardarRespuesta(db: Db, intentoId: string, preguntaId: string, respuesta: string): Promise<void> {
  await db.insert(er).values({ intentoId, preguntaId, respuesta })
    .onConflictDoUpdate({ target: [er.intentoId, er.preguntaId], set: { respuesta, respondidaAt: new Date() } });
}

export async function respuestasDe(db: Db, intentoId: string): Promise<Map<string, string>> {
  const filas = await db.select({ p: er.preguntaId, r: er.respuesta }).from(er).where(eq(er.intentoId, intentoId));
  return new Map(filas.map((f) => [f.p, f.r]));
}

export async function cerrarIntento(db: Db, intentoId: string, x: { estado: 'aprobado' | 'suspendido'; nota: number; bloques: Record<Bloque, number>; ahora: Date }): Promise<void> {
  await db.update(ei).set({
    estado: x.estado, nota: x.nota, terminadoAt: x.ahora,
    notaLectura: x.bloques.lectura, notaListening: x.bloques.listening, notaVocabulario: x.bloques.vocabulario, notaGramatica: x.bloques.gramatica,
  }).where(and(eq(ei.id, intentoId), eq(ei.estado, 'en_curso')));
}

export async function marcarCaducado(db: Db, intentoId: string): Promise<void> {
  await db.update(ei).set({ estado: 'caducado' }).where(and(eq(ei.id, intentoId), eq(ei.estado, 'en_curso')));
}

export async function marcarRefuerzo(db: Db, userId: string, intentoId: string, ahora: Date): Promise<void> {
  await db.update(ei).set({ refuerzoCompletadoAt: ahora })
    .where(and(eq(ei.id, intentoId), eq(ei.userId, userId), eq(ei.estado, 'suspendido'), isNull(ei.refuerzoCompletadoAt)));
}

export async function nivelesAprobados(db: Db, userId: string): Promise<Nivel[]> {
  const filas = await db.selectDistinct({ nivel: ei.nivel }).from(ei).where(and(eq(ei.userId, userId), eq(ei.estado, 'aprobado')));
  return filas.map((f) => f.nivel);
}

export const historial = (db: Db, userId: string) =>
  db.select({ id: ei.id, nivel: ei.nivel, estado: ei.estado, nota: ei.nota, iniciadoAt: ei.iniciadoAt, terminadoAt: ei.terminadoAt })
    .from(ei).where(eq(ei.userId, userId)).orderBy(desc(ei.iniciadoAt), asc(ei.nivel)).limit(50);

export const notasBloques = (i: Intento): Record<Bloque, number> => ({
  lectura: i.notaLectura ?? 0, listening: i.notaListening ?? 0, vocabulario: i.notaVocabulario ?? 0, gramatica: i.notaGramatica ?? 0,
});
```

- [ ] **Step 5: Test de integración (happy path)** — `src/lib/evaluacion/evaluacion.int.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import * as repo from './evaluacion.repo';

let userId: string;
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('repo de evaluación', () => {
  it('crea un solo intento abierto, guarda respuestas, cierra y cuenta el nivel como aprobado', async () => {
    const id = await repo.crearIntento(testDb, { userId, nivel: 'A2', preguntas: ['q1', 'q2'] });
    expect(await repo.crearIntento(testDb, { userId, nivel: 'A2', preguntas: ['q3'] })).toBe(id);
    await repo.guardarRespuesta(testDb, id, 'q1', '{"tipo":"verdadero_falso","valor":true}');
    await repo.guardarRespuesta(testDb, id, 'q1', '{"tipo":"verdadero_falso","valor":false}');
    expect((await repo.respuestasDe(testDb, id)).get('q1')).toContain('false');
    await repo.cerrarIntento(testDb, id, { estado: 'aprobado', nota: 85, bloques: { lectura: 80, listening: 80, vocabulario: 100, gramatica: 80 }, ahora: new Date() });
    expect(await repo.nivelesAprobados(testDb, userId)).toEqual(['A2']);
    expect(await repo.intentoAbierto(testDb, userId, 'A2')).toBeNull();
  });
});
```

- [ ] **Step 6: Verificar** — con la BD de Docker: `npm.cmd run test:int` → PASS (incluido el nuevo y los de reset/exportar). `npm.cmd run typecheck`, `npm.cmd test` → PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts drizzle src/lib/evaluacion/evaluacion.repo.ts src/lib/evaluacion/evaluacion.int.test.ts src/lib/db/test-utils.ts src/lib/progreso/reset.ts src/lib/exportar
git commit -m "feat(evaluacion): tablas de intentos y respuestas con su repositorio"
```

---

### Task 5: Nivel actual y niveles bloqueados

**Files:**
- Modify: `src/lib/progreso/niveles.ts`, `src/lib/progreso/niveles.test.ts`
- Create: `src/lib/progreso/nivel-actual.ts`
- Modify: `src/app/(app)/camino/page.tsx`, `src/app/(app)/camino/[nivel]/page.tsx`, `src/app/(app)/hoy/page.tsx`, `src/app/(app)/escuchar/page.tsx`, `src/app/(app)/leccion/[id]/page.tsx`, `src/app/(app)/_acciones/actions.ts`

**Interfaces:**
- Consumes: `estadoNiveles` (existente), `nivelesAprobados` (Task 4).
- Produces: `nivelActual(niveles: { nivel: Nivel; estado: EstadoNivel }[]): Nivel`; `nivelesDelUsuario(db, userId, nivelInicial): Promise<{ niveles: { nivel: Nivel; estado: EstadoNivel }[]; actual: Nivel; estadoDe: (n: Nivel) => EstadoNivel }>`

- [ ] **Step 1: Test que falla** — añadir a `src/lib/progreso/niveles.test.ts`:

```ts
import { nivelActual } from './niveles';

describe('nivelActual', () => {
  it('tras aprobar A2 el nivel actual es B1', () => {
    expect(nivelActual(estadoNiveles({ nivelInicial: 'A2', aprobados: ['A2'] }))).toBe('B1');
  });
});
```

(Si `estadoNiveles` ya está importado, añadir solo `nivelActual` al import existente.)

- [ ] **Step 2:** Run `npx.cmd vitest run --project unit src/lib/progreso/niveles.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — al final de `src/lib/progreso/niveles.ts`:

```ts
/** Primer nivel «En curso»; si todos están aprobados, el último. */
export function nivelActual(niveles: { nivel: Nivel; estado: EstadoNivel }[]): Nivel {
  return niveles.find((n) => n.estado === 'en_curso')?.nivel ?? niveles[niveles.length - 1].nivel;
}
```

`src/lib/progreso/nivel-actual.ts`:

```ts
import type { Db } from '@/lib/db/client';
import { nivelesAprobados } from '@/lib/evaluacion/evaluacion.repo';
import { estadoNiveles, nivelActual, type EstadoNivel, type Nivel } from './niveles';

export async function nivelesDelUsuario(db: Db, userId: string, nivelInicial: Nivel) {
  const niveles = estadoNiveles({ nivelInicial, aprobados: await nivelesAprobados(db, userId) });
  const estadoDe = (n: Nivel): EstadoNivel => niveles.find((x) => x.nivel === n)?.estado ?? 'bloqueado';
  return { niveles, actual: nivelActual(niveles), estadoDe };
}
```

- [ ] **Step 4: Usarlo en las páginas**
- `camino/page.tsx`: sustituir `const niveles = estadoNiveles({ nivelInicial: u.nivelInicial, aprobados: [] });` por `const { niveles } = await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial);` (y quitar `estadoNiveles` del import, dejando `type EstadoNivel`).
- `hoy/page.tsx` y `escuchar/page.tsx`: sustituir `const nivel = u.nivelInicial;` por `const { actual: nivel } = await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial);` (en Hoy, mover `const db = getDb();` antes y pasar `db`).
- `camino/[nivel]/page.tsx`: tras `if (!isNivel(nivel)) notFound();` añadir:

```ts
  const { estadoDe } = await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial);
  if (estadoDe(nivel) === 'bloqueado') redirect('/camino');
```

- `leccion/[id]/page.tsx`: tras `if (!leccion) notFound();` añadir `if ((await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial)).estadoDe(leccion.nivel) === 'bloqueado') redirect('/camino');`
- `_acciones/actions.ts`, `completarItemAction`: tras obtener `item`, añadir:

```ts
  if (!u.nivelInicial) return { ok: false as const, motivo: 'bloqueado' as const };
  if ((await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial)).estadoDe(item.nivel) === 'bloqueado') return { ok: false as const, motivo: 'bloqueado' as const };
```

- [ ] **Step 5: Verificar** — `npx.cmd vitest run --project unit src/lib/progreso` → PASS; `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/progreso "src/app/(app)"
git commit -m "feat(niveles): nivel actual según aprobados y niveles bloqueados cerrados"
```

---

### Task 6: Servicio y acciones de la evaluación

**Files:**
- Create: `src/lib/evaluacion/servicio.ts`, `src/lib/evaluacion/contexto.ts`
- Create: `src/app/(app)/evaluacion/actions.ts`
- Test: `src/lib/evaluacion/servicio.int.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 3 y 4; `corregir` (existente); `getEvaluacion`, `leccionesDeNivel` (Task 1); `nivelesDelUsuario` (Task 5); `itemsCompletados` (existente).
- Produces:
  - `iniciarIntento(db, userId, banco: Evaluacion, rnd?): Promise<string>`
  - `responder(db, userId, banco, intentoId, preguntaId, respuesta: RespuestaUsuario, ahora): Promise<boolean>`
  - `finalizar(db, userId, banco, intentoId, ahora): Promise<{ ok: true; intentoId: string } | { ok: false; motivo: 'no_existe' | 'incompleto' | 'caducado' }>`
  - `contextoEvaluacion(db, u: { userId: string; nivelInicial: Nivel }, nivel, ahora): Promise<{ elegibilidad: Elegibilidad; banco?: Evaluacion; abierto: Intento | null; ultimo: Intento | null }>` (server-only)
  - Acciones: `iniciarEvaluacionAction(form: FormData)`, `guardarRespuestaAction(input: { intentoId: string; preguntaId: string; respuesta: RespuestaUsuario }): Promise<{ ok: boolean }>`, `finalizarEvaluacionAction(input: { intentoId: string })`, `completarRefuerzoAction(input: { intentoId: string }): Promise<{ ok: boolean }>`

- [ ] **Step 1: Test que falla (happy path + intento ajeno)** — `src/lib/evaluacion/servicio.int.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users } from '@/lib/db/schema';
import { BLOQUES, type Evaluacion } from '@/lib/contenido/esquema';
import { iniciarIntento, responder, finalizar } from './servicio';
import { getIntento, nivelesAprobados } from './evaluacion.repo';

const banco: Evaluacion = {
  tipo: 'evaluacion', nivel: 'A2', revisado: true, recursos: [],
  preguntas: BLOQUES.flatMap((bloque) => Array.from({ length: 10 }, (_, i) => ({
    id: `a2-ev-${bloque}-${i}`, tipo: 'verdadero_falso' as const, enunciado: 'E', afirmacion: 'A', correcta: true, explicacion: 'X', bloque,
  }))),
};
let ana: string; let beto: string;
beforeEach(async () => {
  await resetDb();
  [{ id: ana }, { id: beto }] = await testDb.insert(users).values([{ alias: 'ana', passwordHash: 'x' }, { alias: 'beto', passwordHash: 'x' }]).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('servicio de evaluación', () => {
  it('responder todo bien aprueba A2', async () => {
    const ahora = new Date();
    const id = await iniciarIntento(testDb, ana, banco);
    const intento = await getIntento(testDb, ana, id);
    for (const p of intento!.preguntas) expect(await responder(testDb, ana, banco, id, p, { tipo: 'verdadero_falso', valor: true }, ahora)).toBe(true);
    expect(await finalizar(testDb, ana, banco, id, ahora)).toEqual({ ok: true, intentoId: id });
    expect((await getIntento(testDb, ana, id))!.nota).toBe(100);
    expect(await nivelesAprobados(testDb, ana)).toEqual(['A2']);
  });

  it('nadie puede responder ni finalizar el intento de otro', async () => {
    const ahora = new Date();
    const id = await iniciarIntento(testDb, ana, banco);
    const [p] = (await getIntento(testDb, ana, id))!.preguntas;
    expect(await responder(testDb, beto, banco, id, p, { tipo: 'verdadero_falso', valor: true }, ahora)).toBe(false);
    expect(await finalizar(testDb, beto, banco, id, ahora)).toEqual({ ok: false, motivo: 'no_existe' });
  });
});
```

- [ ] **Step 2:** Run `npm.cmd run test:int` → FAIL (`./servicio` no existe).

- [ ] **Step 3: Servicio** — `src/lib/evaluacion/servicio.ts`:

```ts
import type { Db } from '@/lib/db/client';
import type { Evaluacion, Pregunta } from '@/lib/contenido/esquema';
import { corregir, type RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import * as repo from './evaluacion.repo';
import { aleatorio, seleccionarPreguntas } from './seleccionar';
import { calcularNota } from './nota';
import { caducado } from './elegibilidad';
import { parsearRespuesta } from './respuesta';

export async function iniciarIntento(db: Db, userId: string, banco: Evaluacion, rnd: () => number = aleatorio): Promise<string> {
  const anterior = await repo.ultimoTerminado(db, userId, banco.nivel);
  return repo.crearIntento(db, { userId, nivel: banco.nivel, preguntas: seleccionarPreguntas(banco.preguntas, anterior?.preguntas ?? [], rnd) });
}

export async function responder(db: Db, userId: string, banco: Evaluacion, intentoId: string, preguntaId: string, respuesta: RespuestaUsuario, ahora: Date): Promise<boolean> {
  const i = await repo.getIntento(db, userId, intentoId);
  if (!i || i.nivel !== banco.nivel || i.estado !== 'en_curso' || caducado(i, ahora) || !i.preguntas.includes(preguntaId)) return false;
  await repo.guardarRespuesta(db, intentoId, preguntaId, JSON.stringify(respuesta));
  return true;
}

export async function finalizar(db: Db, userId: string, banco: Evaluacion, intentoId: string, ahora: Date)
  : Promise<{ ok: true; intentoId: string } | { ok: false; motivo: 'no_existe' | 'incompleto' | 'caducado' }> {
  const i = await repo.getIntento(db, userId, intentoId);
  if (!i || i.nivel !== banco.nivel) return { ok: false, motivo: 'no_existe' };
  if (i.estado === 'aprobado' || i.estado === 'suspendido') return { ok: true, intentoId: i.id };
  const porId = new Map(banco.preguntas.map((p) => [p.id, p]));
  const preguntas = i.preguntas.map((id) => porId.get(id));
  if (i.estado === 'caducado' || caducado(i, ahora) || preguntas.some((p) => !p)) {
    await repo.marcarCaducado(db, i.id);
    return { ok: false, motivo: 'caducado' };
  }
  const resp = await repo.respuestasDe(db, i.id);
  if (i.preguntas.some((id) => !resp.has(id))) return { ok: false, motivo: 'incompleto' };
  const ps = preguntas as Pregunta[];
  const aciertos = new Set(ps.filter((p) => { const r = parsearRespuesta(resp.get(p.id)!); return r !== null && corregir(p, r); }).map((p) => p.id));
  const n = calcularNota(ps, aciertos);
  await repo.cerrarIntento(db, i.id, { estado: n.aprobado ? 'aprobado' : 'suspendido', nota: n.nota, bloques: n.bloques, ahora });
  return { ok: true, intentoId: i.id };
}
```

- [ ] **Step 4: Contexto** — `src/lib/evaluacion/contexto.ts`:

```ts
import 'server-only';
import type { Db } from '@/lib/db/client';
import type { Nivel } from '@/lib/contenido/esquema';
import { getEvaluacion, leccionesDeNivel } from '@/lib/contenido/catalogo';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { nivelesDelUsuario } from '@/lib/progreso/nivel-actual';
import * as repo from './evaluacion.repo';
import { caducado, elegibilidad } from './elegibilidad';

/** Estado de la evaluación de un nivel para un usuario. Caduca el intento abierto si pasó de 48 h o si el banco cambió. */
export async function contextoEvaluacion(db: Db, u: { userId: string; nivelInicial: Nivel }, nivel: Nivel, ahora: Date) {
  const banco = getEvaluacion(nivel);
  const [{ estadoDe }, hechos, aprobado, ultimo] = await Promise.all([
    nivelesDelUsuario(db, u.userId, u.nivelInicial),
    itemsCompletados(db, u.userId, nivel),
    repo.intentoAprobado(db, u.userId, nivel),
    repo.ultimoTerminado(db, u.userId, nivel),
  ]);
  let abierto = await repo.intentoAbierto(db, u.userId, nivel);
  const ids = new Set(banco?.preguntas.map((p) => p.id));
  if (abierto && (caducado(abierto, ahora) || abierto.preguntas.some((id) => !ids.has(id)))) {
    await repo.marcarCaducado(db, abierto.id);
    abierto = null;
  }
  const lecciones = leccionesDeNivel(nivel);
  return {
    elegibilidad: elegibilidad({
      estadoNivel: estadoDe(nivel), hayBanco: !!banco, lecciones: lecciones.length,
      hechas: lecciones.filter((l) => hechos.has(l.id)).length, abierto, aprobado, ultimo, ahora,
    }),
    banco, abierto, ultimo,
  };
}
```

- [ ] **Step 5: Acciones** — leer antes la guía de server actions en `node_modules/next/dist/docs/`. `src/app/(app)/evaluacion/actions.ts`:

```ts
'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { getEvaluacion } from '@/lib/contenido/catalogo';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { finalizar, iniciarIntento, responder } from '@/lib/evaluacion/servicio';
import { respuestaSchema } from '@/lib/evaluacion/respuesta';
import { getIntento, marcarRefuerzo } from '@/lib/evaluacion/evaluacion.repo';

const intentoSchema = z.object({ intentoId: z.uuid() });

export async function iniciarEvaluacionAction(form: FormData) {
  const u = await requireUser();
  const nivel = form.get('nivel');
  if (!u.nivelInicial || !isNivel(nivel)) redirect('/camino');
  const db = getDb();
  const ctx = await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  if (ctx.elegibilidad.tipo === 'puede' && ctx.banco) await iniciarIntento(db, u.userId, ctx.banco);
  redirect(`/evaluacion/${nivel}`);
}

export async function guardarRespuestaAction(input: { intentoId: string; preguntaId: string; respuesta: RespuestaUsuario }) {
  const u = await requireUser();
  const p = intentoSchema.extend({ preguntaId: z.string().max(80), respuesta: respuestaSchema }).safeParse(input);
  if (!p.success) return { ok: false };
  const db = getDb();
  const i = await getIntento(db, u.userId, p.data.intentoId);
  const banco = i ? getEvaluacion(i.nivel) : undefined;
  if (!banco) return { ok: false };
  return { ok: await responder(db, u.userId, banco, p.data.intentoId, p.data.preguntaId, p.data.respuesta, new Date()) };
}

export async function finalizarEvaluacionAction(input: { intentoId: string }) {
  const u = await requireUser();
  const p = intentoSchema.safeParse(input);
  if (!p.success) return { ok: false as const, motivo: 'no_existe' as const };
  const db = getDb();
  const i = await getIntento(db, u.userId, p.data.intentoId);
  const banco = i ? getEvaluacion(i.nivel) : undefined;
  if (!banco) return { ok: false as const, motivo: 'no_existe' as const };
  return finalizar(db, u.userId, banco, p.data.intentoId, new Date());
}

export async function completarRefuerzoAction(input: { intentoId: string }) {
  const u = await requireUser();
  const p = intentoSchema.safeParse(input);
  if (!p.success) return { ok: false };
  await marcarRefuerzo(getDb(), u.userId, p.data.intentoId, new Date());
  return { ok: true };
}
```

- [ ] **Step 6: Verificar** — `npm.cmd run test:int` → PASS (los 2 tests nuevos); `npm.cmd test` → PASS (incluye `guardas-app.test.ts` con el nuevo `actions.ts`); `npm.cmd run lint`, `npm.cmd run typecheck` → PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/evaluacion "src/app/(app)/evaluacion/actions.ts"
git commit -m "feat(evaluacion): servicio con corrección en servidor y acciones protegidas"
```

---

### Task 7: Pantallas de evaluación, resultado y refuerzo

**Files:**
- Create: `src/app/(app)/evaluacion/[nivel]/page.tsx`, `src/app/(app)/evaluacion/[nivel]/flujo-evaluacion.tsx`
- Create: `src/app/(app)/evaluacion/[nivel]/resultado/[intentoId]/page.tsx`
- Create: `src/app/(app)/evaluacion/[nivel]/refuerzo/page.tsx`, `src/app/(app)/evaluacion/[nivel]/refuerzo/flujo-refuerzo.tsx`
- Modify: `src/lib/tiempo/bogota.ts` (formato de fecha)
- Modify: `tests/data/local/rutas.yaml`, `tests/data/preview/rutas.yaml`

**Interfaces:**
- Consumes: Tasks 2, 3, 4, 6; `VideoFacade`, `BarraProgreso`, `Boton`, `Tarjeta`, `SecuenciaEjercicios`, `crearColaRegistro` (existentes).
- Produces: `formatoFechaHora(d: Date): string` (es-CO, America/Bogota); rutas `/evaluacion/[nivel]`, `/evaluacion/[nivel]/resultado/[intentoId]`, `/evaluacion/[nivel]/refuerzo`.

- [ ] **Step 1: Fecha en Bogotá** — al final de `src/lib/tiempo/bogota.ts`:

```ts
const FMT = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
/** «15 oct, 10:30 a. m.» en hora de Bogotá. */
export const formatoFechaHora = (d: Date): string => FMT.format(d);
```

- [ ] **Step 2: Página de evaluación** — leer la guía de `PageProps`/params en `node_modules/next/dist/docs/` y copiar el patrón de `camino/[nivel]/page.tsx`. `src/app/(app)/evaluacion/[nivel]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { aVista } from '@/lib/contenido/vista';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { respuestasDe } from '@/lib/evaluacion/evaluacion.repo';
import type { PreguntaExamen } from '@/lib/evaluacion/tipos';
import { Boton } from '@/components/boton';
import { Tarjeta } from '@/components/tarjeta';
import { iniciarEvaluacionAction } from '../actions';
import { FlujoEvaluacion } from './flujo-evaluacion';

export default async function EvaluacionPage({ params }: PageProps<'/evaluacion/[nivel]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel } = await params;
  if (!isNivel(nivel)) notFound();
  const db = getDb();
  const ctx = await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  const e = ctx.elegibilidad;
  if (e.tipo === 'aprobado') redirect(`/evaluacion/${nivel}/resultado/${e.intentoId}`);
  if (e.tipo === 'reanudar' && ctx.abierto && ctx.banco) {
    const porId = new Map(ctx.banco.preguntas.map((p) => [p.id, p]));
    const recursos = new Map(ctx.banco.recursos.map((r) => [r.id, r]));
    // Solo la vista (sin soluciones) y el recurso de cada pregunta llegan al navegador.
    const preguntas: PreguntaExamen[] = ctx.abierto.preguntas.map((id) => {
      const p = porId.get(id)!;
      return { bloque: p.bloque, vista: aVista(p), recurso: p.recurso ? recursos.get(p.recurso) : undefined };
    });
    const respondidas = [...(await respuestasDe(db, ctx.abierto.id)).keys()];
    return <FlujoEvaluacion nivel={nivel} intentoId={ctx.abierto.id} preguntas={preguntas} respondidas={respondidas} />;
  }
  if (e.tipo !== 'puede') redirect(`/camino/${nivel}`);
  return (
    <div className="flex flex-col gap-4">
      <p><Link href={`/camino/${nivel}`} className="inline-flex min-h-11 items-center text-primario underline">Volver al camino</Link></p>
      <h1 className="text-2xl font-bold">Evaluación de {nivel}</h1>
      <Tarjeta>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>20 preguntas en 4 bloques: lectura, listening, vocabulario y gramática.</li>
          <li>Sin límite de tiempo. Si sales, retomas donde ibas (durante 48 h).</li>
          <li>No verás si aciertas hasta el final.</li>
          <li>Apruebas con el 80 % y se desbloquea el siguiente nivel.</li>
        </ul>
        <form action={iniciarEvaluacionAction} className="mt-4">
          <input type="hidden" name="nivel" value={nivel} />
          <Boton type="submit">Empezar</Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
```

- [ ] **Step 3: Flujo del examen (cliente)** — `src/app/(app)/evaluacion/[nivel]/flujo-evaluacion.tsx`:

```tsx
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheck, CircleDashed } from 'lucide-react';
import type { RespuestaUsuario } from '@/lib/aprendizaje/corregir';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { ETIQUETA_BLOQUE, type PreguntaExamen } from '@/lib/evaluacion/tipos';
import { CamposEjercicio } from '@/components/ejercicios/campos-ejercicio';
import { VideoFacade } from '@/components/video-facade';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { finalizarEvaluacionAction, guardarRespuestaAction } from '../actions';

type Envio = { intentoId: string; preguntaId: string; respuesta: RespuestaUsuario };

export function FlujoEvaluacion({ nivel, intentoId, preguntas, respondidas }: { nivel: string; intentoId: string; preguntas: PreguntaExamen[]; respondidas: string[] }) {
  const router = useRouter();
  const total = preguntas.length;
  const [i, setI] = useState(() => { const k = preguntas.findIndex((p) => !respondidas.includes(p.vista.id)); return k === -1 ? total : k; });
  const [resp, setResp] = useState<RespuestaUsuario | null>(null);
  const [confirmadas, setConfirmadas] = useState(() => new Set(respondidas));
  const [aviso, setAviso] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const titulo = useRef<HTMLHeadingElement>(null);
  const cola = useMemo(() => crearColaRegistro(async (x: Envio) => {
    const r = await guardarRespuestaAction(x);
    if (r.ok) setConfirmadas((s) => new Set(s).add(x.preguntaId));
    return r;
  }, { onFalloPersistente: () => setAviso(true) }), []);

  useEffect(() => { titulo.current?.focus(); }, [i]);

  function ir(k: number) { setResp(null); setConfirmar(false); setI(k); }
  function guardarYSeguir() {
    if (resp) cola.encolar({ intentoId, preguntaId: preguntas[i].vista.id, respuesta: resp });
    ir(i + 1);
  }
  async function enviar() {
    setEnviando(true);
    const r = await finalizarEvaluacionAction({ intentoId });
    if (r.ok) { router.push(`/evaluacion/${nivel}/resultado/${r.intentoId}`); return; }
    setEnviando(false);
    setError(r.motivo === 'incompleto' ? 'Aún faltan respuestas por guardar. Revisa la lista.' : 'La evaluación caducó. Vuelve al camino para empezar otra.');
  }

  const progreso = <BarraProgreso valor={(confirmadas.size / total) * 100} etiqueta={`${confirmadas.size} de ${total} respuestas guardadas`} />;
  const estado = <p role="status" className="min-h-5 text-sm text-aviso">{aviso ? 'No pudimos guardar alguna respuesta. Revísala antes de enviar.' : ''}</p>;

  if (i >= total) {
    const completas = confirmadas.size === total;
    return (
      <div className="flex flex-col gap-4">
        <h1 ref={titulo} tabIndex={-1} className="text-2xl font-bold outline-offset-4">Revisa antes de enviar</h1>
        {progreso}
        <ol className="flex flex-col gap-2">
          {preguntas.map((p, k) => {
            const ok = confirmadas.has(p.vista.id);
            const Icono = ok ? CircleCheck : CircleDashed;
            return (
              <li key={p.vista.id}>
                <button type="button" onClick={() => ir(k)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-borde px-3 text-left">
                  <span>Pregunta {k + 1} · {ETIQUETA_BLOQUE[p.bloque]}</span>
                  <span className={`flex items-center gap-1 text-sm ${ok ? 'text-exito' : 'text-texto-suave'}`}><Icono aria-hidden="true" className="size-4" /> {ok ? 'Guardada' : 'Pendiente'}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {estado}
        {error && <p role="alert" className="text-error">{error}</p>}
        {!confirmar
          ? <Boton type="button" disabled={!completas} onClick={() => setConfirmar(true)}>Enviar evaluación</Boton>
          : (
            <div className="flex flex-col gap-2">
              <p>Al enviar ya no podrás cambiar respuestas.</p>
              <Boton type="button" disabled={enviando} onClick={enviar}>Sí, enviar</Boton>
              <Boton type="button" variante="secundario" onClick={() => setConfirmar(false)}>Seguir revisando</Boton>
            </div>
          )}
      </div>
    );
  }

  const p = preguntas[i];
  const ya = confirmadas.has(p.vista.id);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-texto-suave">Pregunta {i + 1} de {total} · {ETIQUETA_BLOQUE[p.bloque]}</p>
      {progreso}
      {p.recurso?.tipo === 'lectura' && (
        <article lang="en" className="max-w-[68ch] whitespace-pre-line rounded-xl bg-lectura-fondo p-4 text-[18px] leading-[1.7] text-lectura-texto">
          <h2 className="mb-2 font-semibold">{p.recurso.titulo}</h2>
          {p.recurso.texto}
        </article>
      )}
      {p.recurso?.tipo === 'video' && <VideoFacade key={p.recurso.id} video={p.recurso.fuente} />}
      <form onSubmit={(ev) => { ev.preventDefault(); guardarYSeguir(); }} className="flex flex-col gap-4">
        <fieldset className="min-w-0 border-0 p-0" aria-labelledby="enunciado">
          <h1 id="enunciado" ref={titulo} tabIndex={-1} className="mb-3 text-lg font-semibold outline-offset-4">{p.vista.enunciado}</h1>
          <CamposEjercicio key={p.vista.id} vista={p.vista} onResponder={setResp} />
        </fieldset>
        {ya && <p className="text-sm text-texto-suave">Ya guardaste una respuesta. Si eliges otra, se reemplaza.</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          {i > 0 && <Boton type="button" variante="secundario" onClick={() => ir(i - 1)}>Anterior</Boton>}
          <Boton type="submit" disabled={!resp && !ya}>Guardar y seguir</Boton>
        </div>
      </form>
      {estado}
    </div>
  );
}
```

- [ ] **Step 4: Resultado** — `src/app/(app)/evaluacion/[nivel]/resultado/[intentoId]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { CircleCheck, CircleX } from 'lucide-react';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel, NIVELES } from '@/lib/progreso/niveles';
import { BLOQUES } from '@/lib/contenido/esquema';
import { getEvaluacion } from '@/lib/contenido/catalogo';
import { corregir } from '@/lib/aprendizaje/corregir';
import { getIntento, notasBloques, respuestasDe } from '@/lib/evaluacion/evaluacion.repo';
import { parsearRespuesta } from '@/lib/evaluacion/respuesta';
import { textoCorrecta, textoRespuesta } from '@/lib/evaluacion/detalle';
import { UMBRAL } from '@/lib/evaluacion/nota';
import { ETIQUETA_BLOQUE } from '@/lib/evaluacion/tipos';
import { Tarjeta } from '@/components/tarjeta';

const ENLACE = 'inline-flex min-h-11 items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario';

export default async function ResultadoPage({ params }: PageProps<'/evaluacion/[nivel]/resultado/[intentoId]'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel, intentoId } = await params;
  if (!isNivel(nivel) || !z.uuid().safeParse(intentoId).success) notFound();
  const db = getDb();
  const i = await getIntento(db, u.userId, intentoId);
  if (!i || i.nivel !== nivel || (i.estado !== 'aprobado' && i.estado !== 'suspendido')) notFound();
  const banco = getEvaluacion(nivel);
  const resp = await respuestasDe(db, i.id);
  const porId = new Map(banco?.preguntas.map((p) => [p.id, p]) ?? []);
  const falladas = i.preguntas.flatMap((id) => {
    const p = porId.get(id);
    if (!p) return [];
    const r = parsearRespuesta(resp.get(id) ?? '');
    return r && corregir(p, r) ? [] : [{ p, r }];
  });
  const notas = notasBloques(i);
  const aprobado = i.estado === 'aprobado';
  const siguiente = NIVELES[NIVELES.indexOf(nivel) + 1];
  const Icono = aprobado ? CircleCheck : CircleX;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Resultado de {nivel}</h1>
      <Tarjeta>
        <p className={`flex items-center gap-2 text-xl font-semibold ${aprobado ? 'text-exito' : 'text-error'}`}>
          <Icono aria-hidden="true" className="size-6" /> {aprobado ? 'Aprobado' : 'No aprobado'} · {i.nota} %
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {BLOQUES.map((b) => {
            const ok = notas[b] >= UMBRAL;
            return <li key={b} className={ok ? 'text-exito' : 'text-error'}>{ETIQUETA_BLOQUE[b]}: {notas[b]} % {ok ? '' : '· a reforzar'}</li>;
          })}
        </ul>
        <div className="mt-4">
          {aprobado
            ? (siguiente ? <Link href={`/camino/${siguiente}`} className={ENLACE}>{siguiente} desbloqueado: ir al camino</Link> : <Link href="/camino" className={ENLACE}>Ir al camino</Link>)
            : <Link href={`/evaluacion/${nivel}/refuerzo`} className={ENLACE}>Hacer el refuerzo</Link>}
        </div>
      </Tarjeta>
      {falladas.length > 0 && (
        <section aria-labelledby="h-fallos" className="flex flex-col gap-3">
          <h2 id="h-fallos" className="text-lg font-semibold">Preguntas falladas</h2>
          {falladas.map(({ p, r }) => (
            <Tarjeta key={p.id} as="article">
              <p className="font-semibold">{p.enunciado}</p>
              {p.tipo === 'verdadero_falso' && <p lang="en">{p.afirmacion}</p>}
              <p className="mt-2 text-error">Tu respuesta: <span lang="en">{textoRespuesta(p, r)}</span></p>
              <p className="text-exito">Correcta: <span lang="en">{textoCorrecta(p)}</span></p>
              <p className="mt-1 text-texto-suave">{p.explicacion}</p>
            </Tarjeta>
          ))}
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Refuerzo** — `src/app/(app)/evaluacion/[nivel]/refuerzo/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { isNivel } from '@/lib/progreso/niveles';
import { BLOQUES } from '@/lib/contenido/esquema';
import { leccionesDeNivel, tramosDeNivel } from '@/lib/contenido/catalogo';
import { contextoEvaluacion } from '@/lib/evaluacion/contexto';
import { marcarRefuerzo, notasBloques } from '@/lib/evaluacion/evaluacion.repo';
import { armarRefuerzo } from '@/lib/evaluacion/refuerzo';
import { UMBRAL } from '@/lib/evaluacion/nota';
import { ETIQUETA_BLOQUE } from '@/lib/evaluacion/tipos';
import { FlujoRefuerzo } from './flujo-refuerzo';

export default async function RefuerzoPage({ params }: PageProps<'/evaluacion/[nivel]/refuerzo'>) {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  const { nivel } = await params;
  if (!isNivel(nivel)) notFound();
  const ctx = await contextoEvaluacion(getDb(), { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());
  if (ctx.elegibilidad.tipo !== 'falta_refuerzo' || !ctx.ultimo) redirect(`/camino/${nivel}`);
  const notas = notasBloques(ctx.ultimo);
  const bloques = BLOQUES.filter((b) => notas[b] < UMBRAL);
  const fuente = [
    ...leccionesDeNivel(nivel).flatMap((l) => l.ejercicios.map((ejercicio) => ({ ejercicio, origen: 'leccion' as const }))),
    ...tramosDeNivel(nivel).flatMap((t) => t.preguntas.map((ejercicio) => ({ ejercicio, origen: 'tramo' as const }))),
  ];
  const ejercicios = armarRefuerzo(fuente, bloques, ctx.ultimo.id);
  if (ejercicios.length === 0) {
    // Sin ejercicios de práctica para esos bloques: el refuerzo se da por hecho (no bloquear al alumno).
    await marcarRefuerzo(getDb(), u.userId, ctx.ultimo.id, new Date());
    redirect(`/camino/${nivel}`);
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Refuerzo de {nivel}</h1>
      <p className="text-texto-suave">Practica {bloques.map((b) => ETIQUETA_BLOQUE[b].toLowerCase()).join(', ')}. No cuenta para la nota.</p>
      <FlujoRefuerzo nivel={nivel} intentoId={ctx.ultimo.id} ejercicios={ejercicios} />
    </div>
  );
}
```

`src/app/(app)/evaluacion/[nivel]/refuerzo/flujo-refuerzo.tsx`:

```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Ejercicio } from '@/lib/contenido/esquema';
import { SecuenciaEjercicios } from '@/components/ejercicios/secuencia-ejercicios';
import { Tarjeta } from '@/components/tarjeta';
import { completarRefuerzoAction } from '../../actions';

export function FlujoRefuerzo({ nivel, intentoId, ejercicios }: { nivel: string; intentoId: string; ejercicios: Ejercicio[] }) {
  const [fin, setFin] = useState(false);
  if (fin) {
    return (
      <Tarjeta>
        <h2 className="text-lg font-semibold">Refuerzo completado</h2>
        <p className="mt-1 text-texto-suave">Podrás volver a presentar la evaluación 24 horas después de tu intento.</p>
        <Link href={`/camino/${nivel}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Volver al camino</Link>
      </Tarjeta>
    );
  }
  return <SecuenciaEjercicios ejercicios={ejercicios} onCompletada={async () => { await completarRefuerzoAction({ intentoId }); setFin(true); }} />;
}
```


- [ ] **Step 6: Rutas protegidas** — en `tests/data/local/rutas.yaml` y `tests/data/preview/rutas.yaml`, bajo `protegidas`, añadir:

```yaml
  - { ruta: /evaluacion/A2, tipo: pagina }
  - { ruta: /evaluacion/A2/refuerzo, tipo: pagina }
```

- [ ] **Step 7: Verificar** — `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` (incluye guardas con las 3 páginas nuevas), `npm.cmd run check:no-pc`, `npm.cmd run build` → PASS.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(app)/evaluacion" src/lib/tiempo/bogota.ts tests/data
git commit -m "feat(evaluacion): pantallas de examen, resultado y refuerzo"
```

---

### Task 8: Evaluación en Camino, Hoy y Perfil

**Files:**
- Create: `src/app/(app)/camino/[nivel]/tarjeta-evaluacion.tsx`
- Modify: `src/app/(app)/camino/[nivel]/page.tsx`, `src/app/(app)/hoy/page.tsx`, `src/app/(app)/perfil/page.tsx`

**Interfaces:**
- Consumes: `contextoEvaluacion` (Task 6), `Elegibilidad` (Task 3), `historial` (Task 4), `formatoFechaHora` (Task 7).

- [ ] **Step 1: Tarjeta** — `src/app/(app)/camino/[nivel]/tarjeta-evaluacion.tsx`:

```tsx
import Link from 'next/link';
import type { Elegibilidad } from '@/lib/evaluacion/elegibilidad';
import { CADUCIDAD_MS } from '@/lib/evaluacion/elegibilidad';
import { formatoFechaHora } from '@/lib/tiempo/bogota';
import { Tarjeta } from '@/components/tarjeta';

const ENLACE = 'mt-3 inline-flex min-h-11 items-center rounded-md bg-primario px-4 font-semibold text-sobre-primario';

export function TarjetaEvaluacion({ nivel, e, iniciadoAt, respondidas }: { nivel: string; e: Elegibilidad; iniciadoAt?: Date; respondidas?: number }) {
  if (e.tipo === 'bloqueado_nivel' || e.tipo === 'sin_banco') return null;
  return (
    <Tarjeta aria-labelledby="h-evaluacion">
      <h2 id="h-evaluacion" className="text-lg font-semibold">Evaluación de {nivel}</h2>
      {e.tipo === 'faltan_lecciones' && <p className="mt-1 text-texto-suave">Te {e.faltan === 1 ? 'falta 1 lección' : `faltan ${e.faltan} lecciones`} para presentarla.</p>}
      {e.tipo === 'puede' && (<>
        <p className="mt-1 text-texto-suave">20 preguntas · 4 bloques · sin límite de tiempo · apruebas con el 80 %.</p>
        <Link href={`/evaluacion/${nivel}`} className={ENLACE}>Empezar</Link>
      </>)}
      {e.tipo === 'reanudar' && (<>
        <p className="mt-1 text-texto-suave">Llevas {respondidas ?? 0} de 20.{iniciadoAt ? ` Caduca el ${formatoFechaHora(new Date(iniciadoAt.getTime() + CADUCIDAD_MS))}.` : ''}</p>
        <Link href={`/evaluacion/${nivel}`} className={ENLACE}>Continuar</Link>
      </>)}
      {e.tipo === 'falta_refuerzo' && (<>
        <p className="mt-1 text-texto-suave">Haz el refuerzo de los bloques flojos para poder reintentarla.</p>
        <Link href={`/evaluacion/${nivel}/refuerzo`} className={ENLACE}>Hacer el refuerzo</Link>
      </>)}
      {e.tipo === 'espera' && <p className="mt-1 text-texto-suave">Podrás reintentarla desde el {formatoFechaHora(e.hasta)}.</p>}
      {e.tipo === 'aprobado' && <Link href={`/evaluacion/${nivel}/resultado/${e.intentoId}`} className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Aprobada · ver resultado</Link>}
    </Tarjeta>
  );
}
```

- [ ] **Step 2: Camino del nivel** — en `camino/[nivel]/page.tsx`, calcular `const db = getDb();` una vez, y `const ctx = await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, new Date());` y `const respondidas = ctx.abierto ? (await respuestasDe(db, ctx.abierto.id)).size : 0;`. Renderizar `<TarjetaEvaluacion nivel={nivel} e={ctx.elegibilidad} iniciadoAt={ctx.abierto?.iniciadoAt} respondidas={respondidas} />` justo después de la `<ol>` de items (dentro del fragmento que solo se pinta si hay items).

- [ ] **Step 3: Hoy** — en `hoy/page.tsx`, tras calcular `nivel`, obtener `const ev = (await contextoEvaluacion(db, { userId: u.userId, nivelInicial: u.nivelInicial }, nivel, ahora)).elegibilidad;` y, antes de la tarjeta de «Meta de hoy», añadir:

```tsx
      {(ev.tipo === 'puede' || ev.tipo === 'reanudar') && (
        <Tarjeta aria-labelledby="h-eval-hoy">
          <h2 id="h-eval-hoy" className="text-lg font-semibold">{ev.tipo === 'puede' ? `Ya puedes presentar la evaluación de ${nivel}` : `Tienes la evaluación de ${nivel} a medias`}</h2>
          <Link href={`/evaluacion/${nivel}`} className={ENLACE}>{ev.tipo === 'puede' ? 'Ver evaluación' : 'Continuar'}</Link>
        </Tarjeta>
      )}
```

- [ ] **Step 4: Perfil** — en `perfil/page.tsx`, obtener `const evaluaciones = await historial(getDb(), u.userId);` y añadir una tarjeta (antes de «Mis datos»):

```tsx
      <Tarjeta aria-labelledby="h-evaluaciones">
        <h2 id="h-evaluaciones" className="text-lg font-semibold">Evaluaciones</h2>
        {evaluaciones.length === 0
          ? <p className="mt-1 text-texto-suave">Aún no has presentado ninguna.</p>
          : (
            <ul className="mt-2 flex flex-col gap-1">
              {evaluaciones.map((e) => (
                <li key={e.id}>{e.nivel} · {formatoFechaHora(e.iniciadoAt)} · {e.estado === 'aprobado' ? `Aprobada (${e.nota} %)` : e.estado === 'suspendido' ? `No aprobada (${e.nota} %)` : e.estado === 'caducado' ? 'Caducada' : 'En curso'}</li>
              ))}
            </ul>
          )}
      </Tarjeta>
```

Además, en Perfil cambiar «Nivel inicial: {u.nivelInicial}» por el nivel actual: `const { actual } = await nivelesDelUsuario(getDb(), u.userId, u.nivelInicial);` y mostrar `Nivel: {actual}`.

- [ ] **Step 5: Verificar** — `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build` → PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)"
git commit -m "feat(evaluacion): tarjeta en el camino, aviso en Hoy e historial en Perfil"
```

---

### Task 9: E2E del happy path

**Files:**
- Create: `tests/features/aprendizaje/evaluacion.feature`, `tests/pages/evaluacion.page.ts`, `tests/support/db.ts`
- Modify: `tests/steps/aprendizaje.steps.ts`, `tests/fixtures/index.ts`, `tests/docker-compose.yml`, `tests/package.json` (+ lock)

**Interfaces:**
- Consumes: `crearCuenta`, `NivelesPage`, fixtures existentes; banco de demo (Task 1: todas las respuestas correctas son «Verdadero»).

- [ ] **Step 1: Dependencia y BD solo en Docker** — Run: `npm.cmd --prefix tests install -E -D pg@8.23.1 @types/pg@8.23.1`. En `tests/docker-compose.yml`, servicio `tests`: añadir a `environment` `DATABASE_URL: postgres://app:app_local_only@db:5432/app_ingles` y a `depends_on` `db: { condition: service_healthy }`. (La BD del stack E2E no publica puertos; esta URL solo existe dentro de la red de Docker.)

- [ ] **Step 2: Helper** — `tests/support/db.ts`:

```ts
import pg from 'pg';

/** Solo E2E local (stack Docker): marca una lección como completada para no recorrer las 9 por la UI. */
export async function completarLeccion(alias: string, nivel: string, leccionId: string) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query(
      `insert into progress (user_id, nivel, leccion_id) select id, $2, $3 from users where alias = $1 on conflict do nothing`,
      [alias, nivel, leccionId],
    );
  } finally {
    await c.end();
  }
}
```

- [ ] **Step 3: Page object** — `tests/pages/evaluacion.page.ts`:

```ts
import type { Page } from '@playwright/test';

export class EvaluacionPage {
  constructor(private page: Page) {}
  abrir(nivel: string) { return this.page.goto(`/evaluacion/${nivel}`); }
  async empezar() { await this.page.getByRole('button', { name: 'Empezar' }).click(); }
  async responderTodas(opcion: 'Verdadero' | 'Falso') {
    for (;;) {
      if (await this.page.getByRole('heading', { level: 1, name: 'Revisa antes de enviar' }).isVisible()) return;
      await this.page.getByRole('radio', { name: opcion }).check();
      await this.page.getByRole('button', { name: 'Guardar y seguir' }).click();
    }
  }
  async enviar() {
    await this.page.getByRole('button', { name: 'Enviar evaluación' }).click();
    await this.page.getByRole('button', { name: 'Sí, enviar' }).click();
  }
  resultado(texto: string) { return this.page.getByText(new RegExp(`^${texto} ·`)); }
}
```

Registrar `evaluacion: EvaluacionPage` en `tests/fixtures/index.ts` siguiendo el patrón de los demás page objects.

- [ ] **Step 4: Feature** — `tests/features/aprendizaje/evaluacion.feature`:

```gherkin
# language: es
@aprendizaje @regresion @local-only
Característica: Evaluación de nivel

  Escenario: Aprobar la evaluación desbloquea el siguiente nivel
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y respondo todas las preguntas con "Verdadero"
    Y envío la evaluación
    Entonces veo el resultado "Aprobado"
    Cuando abro la sección "Camino"
    Entonces el nivel "B1" aparece "En curso"

  Escenario: Suspender lleva al refuerzo
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y respondo todas las preguntas con "Falso"
    Y envío la evaluación
    Entonces veo el resultado "No aprobado"
    Y veo el enlace "Hacer el refuerzo"
```

- [ ] **Step 5: Steps** — añadir a `tests/steps/aprendizaje.steps.ts` (importar `completarLeccion`):

```ts
Given('que tengo una cuenta con nivel {string} y todas sus lecciones completadas', async ({ invitaciones, registro, page, ctx, niveles }, nivel: string) => {
  await crearCuenta({ invitaciones, registro, page, ctx });
  await niveles.empezar();
  // La lección «actual» es la única enlazada con aria-current: se marca y se recarga hasta que no quede ninguna.
  for (let n = 0; n < 30; n++) {
    await page.goto(`/camino/${nivel}`);
    const actual = page.locator('a[aria-current="step"]');
    if (!(await actual.count())) return;
    const id = (await actual.getAttribute('href'))!.split('/').pop()!;
    await completarLeccion(ctx.alias!, nivel, id);
  }
  throw new Error('Demasiadas lecciones');
});
When('abro la evaluación de {string}', async ({ evaluacion }, nivel: string) => { await evaluacion.abrir(nivel); });
When('empiezo la evaluación', async ({ evaluacion }) => { await evaluacion.empezar(); });
When('respondo todas las preguntas con {string}', async ({ evaluacion }, opcion: string) => { await evaluacion.responderTodas(opcion as 'Verdadero' | 'Falso'); });
When('envío la evaluación', async ({ evaluacion }) => { await evaluacion.enviar(); });
Then('veo el resultado {string}', async ({ evaluacion }, texto: string) => { await expect(evaluacion.resultado(texto)).toBeVisible(); });
Then('veo el enlace {string}', async ({ page }, texto: string) => { await expect(page.getByRole('link', { name: texto })).toBeVisible(); });
Then('el nivel {string} aparece {string}', async ({ niveles }, nivel: string, estado: string) => { await expect(niveles.tarjeta(nivel)).toContainText(estado); });
```

(Si algún paso ya existe con el mismo texto en otro archivo de steps, reutilizarlo y no duplicarlo.)

- [ ] **Step 6: Verificar** — `npm.cmd --prefix tests run typecheck` → PASS. E2E completo en Docker según el README (`docker compose -f docker-compose.yml -f tests/docker-compose.yml down -v`, `up -d --build --wait web`, `run --rm --build tests`, `down -v`) → todos en verde, incluidos los 2 escenarios nuevos y `/evaluacion/A2` en rutas protegidas.

- [ ] **Step 7: Commit**

```bash
git add tests
git commit -m "test(e2e): aprobar y suspender la evaluación (happy path)"
```

---

### Task 10: Banco de evaluación A2 (contenido; en paralelo a las Tasks 2-9)

**Agente:** Sonnet. **No** escribe código. Depende solo de la Task 1 (esquema y reglas).

**Files:**
- Create: `content/a2/evaluacion-a2.yaml`

- [ ] **Step 1:** Leer el esquema (`src/lib/contenido/esquema.ts`, `evaluacionSchema`), las reglas (`reglasEvaluacion` en `reglas.ts`), el spec §5, el temario A2 (`docs/investigacion/sp2-contenido-a2.md`) y el contenido A2 (`content/a2/`) para usar su vocabulario y su gramática sin copiar sus lecturas ni ejercicios.
- [ ] **Step 2: Recursos:** 2 lecturas inéditas de 100-150 palabras (temas distintos entre ia, qa, backend, frontend) y 2 fragmentos de YouTube de 60-120 s **no usados** en lecciones ni tramos (buscar candidatos en `docs/investigacion/sp2-contenido-a2.md` §3 y verificar con oEmbed `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json`). Si se puede leer la transcripción pública sin instalar nada, fijar `start`/`end` y preguntas con ella; si no, anotar «por verificar».
- [ ] **Step 3: Preguntas:** 40 (10 por bloque), ids `a2-ev-q01…q40`, cada recurso con 5 preguntas; vocabulario sobre términos del glosario A2; gramática sobre los puntos de §1.2 del temario; mezclar los 5 tipos de ejercicio; `explicacion` en español que enseña; una sola respuesta correcta.
- [ ] **Step 4:** `npm.cmd run content:build` → sin errores (aviso de `revisado: false` esperado). `npm.cmd run content:check-videos` → 0 caídos.
- [ ] **Step 5:** `git add content/a2/evaluacion-a2.yaml && git commit -m "content(a2): banco de evaluación"`.
- [ ] **Step 6:** Revisión Opus (como en B1) y muestreo del usuario (1 lectura + 1 listening + 5 preguntas) → `revisado: true` en otro commit.

### Task 11: Banco de evaluación B1 (contenido)

Igual que la Task 10 con `content/b1/evaluacion-b1.yaml`, ids `b1-ev-…`, lecturas de 180-250 palabras, vocabulario del glosario B1 y gramática B1 del temario (`docs/investigacion/contenido-b1-b2.md`). Empieza cuando `content/b1` esté mergeado en la rama de trabajo. Sus videos no pueden coincidir con los de las lecciones/tramos B1.

---

## Cierre (fuera de las tasks)

Revisión final de la rama (Opus) + `auditor-seguridad-web` + E2E Docker + merge a `main` + deploy con aprobación del environment + `verificador` en producción + vault. Publicar B1 (`revisado: true`) junto con el SP3.
