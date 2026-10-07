# SP2 — Contenido, aprendizaje y rediseño: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la base del SP1 en una app de aprendizaje «Duolingo para devs»: rediseño, motor de lecciones con 5 ejercicios, glosario tocable, repaso Leitner, avance semanal, escuchar por tramos y contenido A2 (8 lecciones + 4 tramos).

**Architecture:** El contenido vive en `content/<nivel>/*.yaml`, se valida con zod y se compila en el build (`prebuild`) a un módulo `server-only` gitignorado (`src/content/generado/catalogo.ts`). Neon solo guarda datos del usuario (`progress`, `respuestas`, `tarjetas`, `actividad_diaria`). La corrección de práctica es en el cliente; el registro va por server actions con `requireUser`. La Fase A congela contratos (esquema, repos, acciones comunes, shell, CSP) para que las pistas B y C corran en paralelo en worktrees.

**Tech Stack:** Next.js 16.3 (App Router, `proxy.ts`), React 19.2, TypeScript 6, Tailwind 4, Drizzle 0.45 + pg, zod 4, vitest 5, Playwright 1.63 + playwright-bdd 9 (Docker), `yaml` 2.9.1, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-10-07-sp2-contenido-design.md` (léelo antes de cada tarea; este plan argumenta desde él).

## Global Constraints

- Idioma de UI y microcopy: español profesional, sin infantilizar. Contenido de aprendizaje en inglés A2; `explicacion` de ejercicios en español.
- Toda `page.tsx` y toda server action exportada de `src/app/(app)` llama a `requireUser()`/`requireAdmin()` (test `src/lib/auth/guardas-app.test.ts`). Todo route handler nuevo comprueba la sesión **dentro** del handler.
- Contenido solo `server-only`; nunca archivos de contenido en `public/`.
- Zona horaria fija `America/Bogota` (UTC-5, sin horario de verano) para días y semanas (lunes-domingo).
- Leitner: cajas 1-5, intervalos 1, 3, 7, 14, 30 días; sesión máx. 20; consolidada = caja ≥ 4.
- Día activo = ≥ 60 s; meta 5 días/semana; `/api/actividad` tope 600 s por envío y 14 400 s (4 h) por día.
- Meta diaria: 5 / 10 / 15 min (por defecto 10).
- Tokens «Terminal Calma» (claro/oscuro): fondo `#FFFFFF`/`#0B1220`, superficie `#F1F5F9`/`#131C2E`, texto `#0F172A`/`#E2E8F0`, secundario `#475569`/`#94A3B8`, primario `#0F766E` (texto `#FFFFFF`) / `#2DD4BF` (texto `#04201D`), acierto `#15803D`/`#4ADE80`, error `#B91C1C`/`#F87171`. Lectura (tono B): fondo `#FAFAF7`/`#141418`, texto `#1F2937`/`#ECECF1`, interlineado 1,7, ancho máx. 68ch, 18 px.
- Feedback = color + icono + texto. Objetivos táctiles ≥ 44 px. Sin scroll horizontal de 360 a 1920 px. `prefers-reduced-motion` anula animaciones. Sin sonidos.
- Presupuesto JS ≤ 200 KB: server components por defecto; cliente solo en ejercicio, glosario, repaso, medidor, video.
- YouTube: miniatura `https://i.ytimg.com/vi/<id>/hqdefault.jpg`; iframe `https://www.youtube-nocookie.com/embed/<id>` montado **solo tras pulsar**. Nunca COEP.
- Sin dependencias nuevas salvo `yaml@2.9.1` (dev) y `lucide-react` (versión exacta). Nada de binarios nativos `.node` (Smart App Control).
- Commits en Conventional Commits, en español. Tests de integración solo contra BD cuyo nombre acaba en `_test`.
- **Decisiones del plan (revisadas por el usuario):** (D1) los tramos están siempre disponibles: solo las lecciones siguen el desbloqueo lineal; (D2) `termino` es único por **(nivel, tema)** y las referencias de una lección/tramo se resuelven en el glosario de su propio tema; (D3) `orden` del camino A2: ia 1-3, qa 4-6, backend 7-9, frontend 10-12 (dos lecciones y luego el tramo de cada tema); la demo usa `orden` 0 (lección) y 99 (tramo).

## Review Focus

1. **Usuario con nivel inicial sin contenido (A1, B1-C2):** `/hoy`, `/camino/[nivel]` y `/escuchar` muestran un estado vacío claro («El contenido de B1 llega pronto») con enlace al camino A2; nunca 404 ni error. → test en Task A1 (`estadoCamino([])`) y escenario E2E en Task D1.
2. **Doble envío / recarga al final de una lección:** completar dos veces no duplica `progress` ni `tarjetas` y no lanza error. → tests de integración en Task A2 (`completarItem` y `agregarTarjetas` idempotentes).
3. **Neon en frío o acción que falla durante los ejercicios:** el usuario sigue avanzando; el registro se reintenta y aparece un aviso discreto. → test unitario de `crearColaRegistro` en Task B1.
4. **Guardar una palabra tal como aparece en la lectura** («Tested,», mayúsculas, apóstrofo tipográfico): se guarda la forma base normalizada y sin duplicados. → test de `normalizarTermino` en Task A2.
5. **Actividad cerca de medianoche y del cambio de semana:** 23:30 en Bogotá (04:30Z del día siguiente) cuenta para el día de Bogotá; el lunes empieza la semana. → tests de `tiempo/bogota.ts` en Task A2 y de `resumenSemana` en Task B3.

---

## Orden de ejecución y paralelismo

```
Ola 1: A1 (contratos de contenido)
Ola 2: A2 (BD+repos+acciones) · A3 (diseño+shell) · A4 (CSP+video) · A5 (CI de contenido) · C1 · C2 · C3 · C4
Ola 3 (tras merge de A2-A5): B1 (lección+camino) · B2 (repaso) · B3 (actividad+hoy+perfil)
Ola 4 (tras merge de B1): B4 (escuchar)
Ola 5: D1 (E2E del SP2) → Fase C (Task Q: calidad, revisión, deploy)
```
Máximo 4-5 subagentes a la vez (límite de sesión). Un worktree por tarea en `C:\Users\parra\proyectos\app-ingles-wt\<tarea>`, rama `feat/sp2-<tarea>`. Orden de merge a `main` local: A1 → A2 → A3 → A4 → A5 → B1 → B2 → B3 → B4 → C1-C4 → D1. Tras cada merge: `npm run lint && npm run typecheck && npm test`.

---

### Task A1: Contratos de contenido (esquema, reglas, compilador, catálogo, camino, demo)

**Files:**
- Create: `src/lib/contenido/esquema.ts`, `src/lib/contenido/lectura.ts`, `src/lib/contenido/reglas.ts`, `src/lib/contenido/camino.ts`, `src/lib/contenido/catalogo.ts`, `src/lib/contenido/opciones.ts`
- Create: `scripts/contenido/compilar.ts`
- Create: `content/_demo/demo-01.yaml`, `content/_demo/demo-t1.yaml`, `content/_demo/glosario-demo.yaml`, `content/a2/.gitkeep`
- Create: `src/test/server-only-vacio.ts`
- Test: `src/lib/contenido/esquema.test.ts`, `src/lib/contenido/lectura.test.ts`, `src/lib/contenido/reglas.test.ts`, `src/lib/contenido/camino.test.ts`, `src/lib/contenido/opciones.test.ts`, `src/lib/contenido/demo.test.ts`
- Modify: `package.json` (scripts + `yaml` dev), `vitest.config.mts` (alias `server-only`), `.gitignore`, `eslint.config.mjs` (ignorar `src/content/generado/**`)

**Interfaces:**
- Produces (tipos en `esquema.ts`): `Nivel`, `Tema = 'ia'|'qa'|'backend'|'frontend'`, `Ejercicio` (unión por `tipo`), `Leccion`, `Tramo`, `EntradaGlosario`, `Video`, `Catalogo = { lecciones: Leccion[]; tramos: Tramo[]; glosario: EntradaGlosario[] }`.
- Produces (`lectura.ts`): `segmentarLectura(texto: string): Segmento[]` con `Segmento = { tipo: 'texto'; valor: string } | { tipo: 'termino'; visible: string; base: string }`; `terminosDeLectura(texto: string): string[]`.
- Produces (`reglas.ts`): `validarCatalogo(archivos: ArchivoCargado[], opts: { estricto: boolean }): { errores: string[]; avisos: string[]; catalogo: Catalogo }` con `ArchivoCargado = { ruta: string; datos: unknown; demo: boolean }`.
- Produces (`camino.ts`): `ItemCamino = { id: string; tipo: 'leccion'|'tramo'; titulo: string; orden: number; tema: Tema; nivel: Nivel }`, `EstadoItem = 'hecho'|'actual'|'bloqueado'|'disponible'`, `estadoCamino(items: ItemCamino[], completados: ReadonlySet<string>): { items: (ItemCamino & { estado: EstadoItem })[]; porcentaje: number; siguiente: (ItemCamino & { estado: EstadoItem }) | null }`.
- Produces (`catalogo.ts`, `server-only`): `getLeccion(id)`, `getTramo(id)`, `getItem(id): ItemCamino | undefined`, `caminoDeNivel(nivel): ItemCamino[]`, `tramosDeNivel(nivel): Tramo[]`, `glosarioPara(nivel, tema, terminos: string[]): Record<string, EntradaGlosario>`, `buscarEntrada(nivel, termino): EntradaGlosario | undefined` (cualquier tema), `getEjercicio(id): { ejercicio: Ejercicio; padreId: string; nivel: Nivel } | undefined`.
- Produces (`opciones.ts`): `opcionesCompilacion(env: Record<string,string|undefined>): { incluirDemo: boolean; estricto: boolean }`.
- Produces (scripts npm): `content:build` (compila), `prebuild`, `pretypecheck`, `pretest`, `predev` → `content:build`.

- [ ] **Step 1: Dependencias y alias de pruebas**

```bash
npm install --save-dev --save-exact yaml@2.9.1
```
`src/test/server-only-vacio.ts`:
```ts
// En vitest no hay condición react-server: este módulo sustituye a 'server-only' solo en tests.
export {};
```
`vitest.config.mts`: añadir dentro de `defineConfig({ ... })`, al nivel de `plugins`:
```ts
  resolve: { alias: { 'server-only': new URL('./src/test/server-only-vacio.ts', import.meta.url).pathname } },
```
(Si en Windows el pathname empieza por `/C:`, usar `fileURLToPath(new URL(...))` de `node:url`.)

`.gitignore`: añadir `src/content/generado/`. `eslint.config.mjs`: añadir `src/content/generado/**` a los `ignores` globales.

- [ ] **Step 2: Tests del esquema (fallan)** — `src/lib/contenido/esquema.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { archivoSchema } from './esquema';

const ej = { id: 'a2-qa-01-e1', enunciado: 'Elige', explicacion: 'Porque…' };
const leccion = {
  tipo: 'leccion', id: 'a2-qa-01', nivel: 'A2', tema: 'qa', orden: 4, titulo: 'A Bug', objetivo: 'Puedo…',
  gramatica: 'Past simple', lectura: 'I [[tested|test]] it.', terminos: ['test'],
  ejercicios: Array.from({ length: 5 }, (_, i) => ({ ...ej, id: `a2-qa-01-e${i + 1}`, tipo: 'verdadero_falso', afirmacion: 'x', correcta: true })),
  revisado: false,
};

describe('archivoSchema', () => {
  it('acepta una lección válida', () => expect(archivoSchema.safeParse(leccion).success).toBe(true));
  it('rechaza menos de 5 ejercicios', () => {
    expect(archivoSchema.safeParse({ ...leccion, ejercicios: leccion.ejercicios.slice(0, 4) }).success).toBe(false);
  });
  it('rechaza un tipo de ejercicio desconocido', () => {
    const malos = [...leccion.ejercicios.slice(0, 4), { ...ej, id: 'x-e9', tipo: 'dictado' }];
    expect(archivoSchema.safeParse({ ...leccion, ejercicios: malos }).success).toBe(false);
  });
  it('rechaza youtubeId mal formado', () => {
    const r = archivoSchema.safeParse({ ...leccion, video: { youtubeId: 'corto', start: 0, end: 10, titulo: 't', canal: 'c' } });
    expect(r.success).toBe(false);
  });
  it('acepta un glosario', () => {
    const g = { tipo: 'glosario', nivel: 'A2', tema: 'qa', entradas: [
      { termino: 'bug', categoria: 'noun', traduccion_es: 'error', definicion_en: 'A problem in software.', ejemplo_en: 'I found a bug.', nivel: 'A2', tema: 'qa' },
    ] };
    expect(archivoSchema.safeParse(g).success).toBe(true);
  });
  it('rechaza termino con mayúsculas', () => {
    const g = { tipo: 'glosario', nivel: 'A2', tema: 'qa', entradas: [
      { termino: 'Bug', categoria: 'noun', traduccion_es: 'e', definicion_en: 'd', ejemplo_en: 'e', nivel: 'A2', tema: 'qa' },
    ] };
    expect(archivoSchema.safeParse(g).success).toBe(false);
  });
});
```
Run: `npx vitest run --project unit src/lib/contenido/esquema.test.ts` → FAIL (módulo no existe).

- [ ] **Step 3: Implementar `esquema.ts`**

```ts
import { z } from 'zod';

export const NIVELES_CONTENIDO = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export const TEMAS = ['ia', 'qa', 'backend', 'frontend'] as const;
const nivel = z.enum(NIVELES_CONTENIDO);
const tema = z.enum(TEMAS);
/** Forma base: minúsculas, letras/números, espacios, guion y apóstrofo recto (p. ej. «test case», «don't»). */
export const terminoSchema = z.string().regex(/^[a-z0-9][a-z0-9 '\-]{0,39}$/, 'término en minúsculas (máx. 40)');
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)+$/, 'id en minúsculas con guiones');
const texto = z.string().trim().min(1);

export const videoSchema = z.object({
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtubeId de 11 caracteres'),
  start: z.number().int().min(0),
  end: z.number().int().min(1),
  titulo: texto,
  canal: texto,
});

const comun = { id, enunciado: texto, explicacion: texto, terminos: z.array(terminoSchema).optional() };
export const ejercicioSchema = z.discriminatedUnion('tipo', [
  z.object({ ...comun, tipo: z.literal('opcion_multiple'), opciones: z.array(texto).min(2).max(4), correcta: z.number().int().min(0) }),
  z.object({ ...comun, tipo: z.literal('completar'), texto, respuesta: texto, aceptadas: z.array(texto).optional() }),
  z.object({ ...comun, tipo: z.literal('ordenar'), piezas: z.array(texto).min(2).max(8) }),
  z.object({ ...comun, tipo: z.literal('emparejar'), pares: z.array(z.object({ a: texto, b: texto })).min(3).max(5) }),
  z.object({ ...comun, tipo: z.literal('verdadero_falso'), afirmacion: texto, correcta: z.boolean() }),
]);

export const leccionSchema = z.object({
  tipo: z.literal('leccion'), id, nivel, tema, orden: z.number().int().min(0),
  titulo: texto, objetivo: texto, gramatica: texto, lectura: texto,
  video: videoSchema.optional(),
  terminos: z.array(terminoSchema).min(1),
  ejercicios: z.array(ejercicioSchema).min(5).max(8),
  revisado: z.boolean(),
});

export const tramoSchema = z.object({
  tipo: z.literal('tramo'), id, nivel, tema, orden: z.number().int().min(0),
  fuente: videoSchema.extend({ podcast: texto }),
  preguntaGuia: texto,
  palabrasClave: z.array(terminoSchema).min(1),
  preguntas: z.array(ejercicioSchema).min(3).max(5),
  revisado: z.boolean(),
});

export const entradaGlosarioSchema = z.object({
  termino: terminoSchema,
  categoria: z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase']),
  traduccion_es: texto, definicion_en: texto, ejemplo_en: texto, nivel, tema,
});
export const glosarioSchema = z.object({ tipo: z.literal('glosario'), nivel, tema, entradas: z.array(entradaGlosarioSchema).min(1) });

export const archivoSchema = z.discriminatedUnion('tipo', [leccionSchema, tramoSchema, glosarioSchema]);

export type Nivel = z.infer<typeof nivel>;
export type Tema = z.infer<typeof tema>;
export type Video = z.infer<typeof videoSchema>;
export type Ejercicio = z.infer<typeof ejercicioSchema>;
export type Leccion = z.infer<typeof leccionSchema>;
export type Tramo = z.infer<typeof tramoSchema>;
export type EntradaGlosario = z.infer<typeof entradaGlosarioSchema>;
export type Catalogo = { lecciones: Leccion[]; tramos: Tramo[]; glosario: EntradaGlosario[] };
```
Run el test → PASS.

- [ ] **Step 4: Tests de `lectura.ts` (fallan)**

```ts
import { describe, it, expect } from 'vitest';
import { segmentarLectura, terminosDeLectura } from './lectura';

describe('segmentarLectura', () => {
  it('separa texto y términos con alias', () => {
    expect(segmentarLectura('I [[tested|test]] the [[login]].')).toEqual([
      { tipo: 'texto', valor: 'I ' },
      { tipo: 'termino', visible: 'tested', base: 'test' },
      { tipo: 'texto', valor: ' the ' },
      { tipo: 'termino', visible: 'login', base: 'login' },
      { tipo: 'texto', valor: '.' },
    ]);
  });
  it('la base se normaliza a minúsculas', () => {
    expect(segmentarLectura('[[API]]')).toEqual([{ tipo: 'termino', visible: 'API', base: 'api' }]);
  });
  it('texto sin marcas', () => expect(segmentarLectura('Hola')).toEqual([{ tipo: 'texto', valor: 'Hola' }]));
});

describe('terminosDeLectura', () => {
  it('devuelve bases únicas', () => expect(terminosDeLectura('[[bug]] and [[bugs|bug]] [[fix]]')).toEqual(['bug', 'fix']));
});
```

- [ ] **Step 5: Implementar `lectura.ts`**

```ts
export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'termino'; visible: string; base: string };
const MARCA = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function segmentarLectura(texto: string): Segmento[] {
  const out: Segmento[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(MARCA)) {
    if (m.index > ultimo) out.push({ tipo: 'texto', valor: texto.slice(ultimo, m.index) });
    const visible = m[1].trim();
    out.push({ tipo: 'termino', visible, base: (m[2] ?? m[1]).trim().toLowerCase() });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) out.push({ tipo: 'texto', valor: texto.slice(ultimo) });
  return out;
}

export function terminosDeLectura(texto: string): string[] {
  return [...new Set(segmentarLectura(texto).flatMap((s) => (s.tipo === 'termino' ? [s.base] : [])))];
}
```
Run → PASS.

- [ ] **Step 6: Tests de `reglas.ts` (fallan)** — `src/lib/contenido/reglas.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { validarCatalogo, type ArchivoCargado } from './reglas';

const glos = (terminos: string[], tema = 'qa'): ArchivoCargado => ({
  ruta: `content/a2/glosario-${tema}.yaml`, demo: false,
  datos: { tipo: 'glosario', nivel: 'A2', tema, entradas: terminos.map((t) => ({
    termino: t, categoria: 'noun', traduccion_es: 't', definicion_en: 'd', ejemplo_en: 'e', nivel: 'A2', tema })) },
});
const vf = (id: string) => ({ id, tipo: 'verdadero_falso', enunciado: 'e', explicacion: 'x', afirmacion: 'a', correcta: true });
const lec = (over: Record<string, unknown> = {}): ArchivoCargado => ({
  ruta: 'content/a2/a2-qa-01.yaml', demo: false,
  datos: { tipo: 'leccion', id: 'a2-qa-01', nivel: 'A2', tema: 'qa', orden: 4, titulo: 't', objetivo: 'o', gramatica: 'g',
    lectura: 'A [[bug]].', terminos: ['bug'], ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`)), revisado: true, ...over },
});
const tramo = (over: Record<string, unknown> = {}): ArchivoCargado => ({
  ruta: 'content/a2/a2-qa-t1.yaml', demo: false,
  datos: { tipo: 'tramo', id: 'a2-qa-t1', nivel: 'A2', tema: 'qa', orden: 6,
    fuente: { podcast: 'p', youtubeId: 'Ecu_7juyU0Q', start: 20, end: 80, titulo: 't', canal: 'c' },
    preguntaGuia: 'q', palabrasClave: ['bug'], preguntas: [1, 2, 3].map((n) => vf(`a2-qa-t1-e${n}`)), revisado: true, ...over },
});
const run = (a: ArchivoCargado[], estricto = false) => validarCatalogo(a, { estricto });

describe('validarCatalogo', () => {
  it('catálogo válido sin errores', () => {
    const r = run([glos(['bug']), lec(), tramo()]);
    expect(r.errores).toEqual([]);
    expect(r.catalogo.lecciones).toHaveLength(1);
    expect(r.catalogo.tramos).toHaveLength(1);
  });
  it('error de esquema con archivo y ruta del campo', () => {
    const r = run([glos(['bug']), lec({ titulo: '' })]);
    expect(r.errores[0]).toMatch(/content\/a2\/a2-qa-01\.yaml: titulo/);
  });
  it('ids duplicados', () => {
    const r = run([glos(['bug']), lec(), { ...lec(), ruta: 'otro.yaml' }]);
    expect(r.errores.join('\n')).toMatch(/id duplicado: a2-qa-01/);
  });
  it('orden duplicado en el nivel', () => {
    expect(run([glos(['bug']), lec(), tramo({ orden: 4 })]).errores.join('\n')).toMatch(/orden 4 repetido en A2/);
  });
  it('término de la lectura sin entrada en el glosario de su tema', () => {
    expect(run([glos(['bug']), lec({ lectura: 'A [[fix]].' })]).errores.join('\n')).toMatch(/«fix» no está en el glosario A2\/qa/);
  });
  it('término del glosario de OTRO tema no vale', () => {
    expect(run([glos(['fix'], 'ia'), glos(['bug']), lec({ lectura: 'A [[fix]].' })]).errores.join('\n')).toMatch(/«fix»/);
  });
  it('mismo término en dos temas está permitido; repetido en el mismo tema no', () => {
    expect(run([glos(['bug'], 'ia'), glos(['bug']), lec()]).errores).toEqual([]);
    expect(run([glos(['bug', 'bug']), lec()]).errores.join('\n')).toMatch(/término repetido: bug \(A2\/qa\)/);
  });
  it('opcion_multiple con correcta fuera de rango', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'opcion_multiple', enunciado: 'e', explicacion: 'x', opciones: ['a', 'b'], correcta: 2 };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: correcta fuera de rango/);
  });
  it('completar exige un único ___', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'completar', enunciado: 'e', explicacion: 'x', texto: 'I ___ it ___', respuesta: 'found' };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: el texto debe tener exactamente un ___/);
  });
  it('emparejar con lados repetidos', () => {
    const ej = { id: 'a2-qa-01-e1', tipo: 'emparejar', enunciado: 'e', explicacion: 'x', pares: [{ a: 'x', b: '1' }, { a: 'x', b: '2' }, { a: 'z', b: '3' }] };
    const r = run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01-e1: los lados de emparejar deben ser únicos/);
  });
  it('ejercicio cuyo id no empieza por el de su padre', () => {
    const r = run([glos(['bug']), lec({ ejercicios: [vf('otro-e1'), ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]);
    expect(r.errores.join('\n')).toMatch(/otro-e1: el id debe empezar por a2-qa-01-/);
  });
  it('id de lección debe empezar por el nivel (salvo demo)', () => {
    expect(run([glos(['bug']), lec({ id: 'qa-01', ejercicios: [1, 2, 3, 4, 5].map((n) => vf(`qa-01-e${n}`)) })]).errores.join('\n'))
      .toMatch(/qa-01: el id debe empezar por a2-/);
  });
  it('tramo: start < end y entre 30 y 120 s', () => {
    expect(run([glos(['bug']), tramo({ fuente: { podcast: 'p', youtubeId: 'Ecu_7juyU0Q', start: 20, end: 40, titulo: 't', canal: 'c' } })]).errores.join('\n'))
      .toMatch(/a2-qa-t1: el tramo debe durar entre 30 y 120 s/);
  });
  it('video de lección con start >= end', () => {
    const r = run([glos(['bug']), lec({ video: { youtubeId: 'Ecu_7juyU0Q', start: 50, end: 50, titulo: 't', canal: 'c' } })]);
    expect(r.errores.join('\n')).toMatch(/a2-qa-01: video con start >= end/);
  });
  it('revisado: false es aviso en ramas y error en estricto; la demo está exenta', () => {
    const noRev = [glos(['bug']), lec({ revisado: false })];
    expect(run(noRev).errores).toEqual([]);
    expect(run(noRev).avisos.join('\n')).toMatch(/a2-qa-01: revisado: false/);
    expect(run(noRev, true).errores.join('\n')).toMatch(/a2-qa-01: revisado: false/);
    expect(run([glos(['bug']), { ...lec({ revisado: false }), demo: true }], true).errores).toEqual([]);
  });
  it('terminos[] de ejercicios y palabrasClave también se comprueban', () => {
    expect(run([glos(['bug']), tramo({ palabrasClave: ['nada'] })]).errores.join('\n')).toMatch(/«nada»/);
    const ej = { ...vf('a2-qa-01-e1'), terminos: ['zzz'] };
    expect(run([glos(['bug']), lec({ ejercicios: [ej, ...[2, 3, 4, 5].map((n) => vf(`a2-qa-01-e${n}`))] })]).errores.join('\n')).toMatch(/«zzz»/);
  });
});
```

- [ ] **Step 7: Implementar `reglas.ts`**

```ts
import { archivoSchema, type Catalogo, type Ejercicio, type EntradaGlosario, type Leccion, type Tramo } from './esquema';
import { terminosDeLectura } from './lectura';

export type ArchivoCargado = { ruta: string; datos: unknown; demo: boolean };

function reglasEjercicio(e: Ejercicio, padreId: string): string[] {
  const err: string[] = [];
  if (!e.id.startsWith(`${padreId}-`)) err.push(`${e.id}: el id debe empezar por ${padreId}-`);
  if (e.tipo === 'opcion_multiple' && e.correcta >= e.opciones.length) err.push(`${e.id}: correcta fuera de rango`);
  if (e.tipo === 'completar' && e.texto.split('___').length !== 2) err.push(`${e.id}: el texto debe tener exactamente un ___`);
  if (e.tipo === 'emparejar') {
    const as = new Set(e.pares.map((p) => p.a)); const bs = new Set(e.pares.map((p) => p.b));
    if (as.size !== e.pares.length || bs.size !== e.pares.length) err.push(`${e.id}: los lados de emparejar deben ser únicos`);
  }
  return err;
}

export function validarCatalogo(archivos: ArchivoCargado[], opts: { estricto: boolean }) {
  const errores: string[] = [];
  const avisos: string[] = [];
  const lecciones: Leccion[] = []; const tramos: Tramo[] = []; const glosario: EntradaGlosario[] = [];
  const demoIds = new Set<string>();

  for (const a of archivos) {
    const r = archivoSchema.safeParse(a.datos);
    if (!r.success) {
      for (const i of r.error.issues) errores.push(`${a.ruta}: ${i.path.join('.') || '(raíz)'}: ${i.message}`);
      continue;
    }
    const d = r.data;
    if (d.tipo === 'glosario') glosario.push(...d.entradas);
    else {
      (d.tipo === 'leccion' ? lecciones : tramos).push(d as never);
      if (a.demo) demoIds.add(d.id);
    }
  }

  const clave = (nivel: string, tema: string) => `${nivel}/${tema}`;
  const terminosPorTema = new Map<string, Set<string>>();
  for (const g of glosario) {
    const k = clave(g.nivel, g.tema);
    const set = terminosPorTema.get(k) ?? new Set<string>();
    if (set.has(g.termino)) errores.push(`término repetido: ${g.termino} (${k})`);
    set.add(g.termino); terminosPorTema.set(k, set);
  }

  const ids = new Set<string>(); const ordenes = new Set<string>(); const idsEj = new Set<string>();
  const items = [...lecciones, ...tramos];
  for (const it of items) {
    const esDemo = demoIds.has(it.id);
    if (ids.has(it.id)) errores.push(`id duplicado: ${it.id}`);
    ids.add(it.id);
    const ko = `${it.nivel}:${it.orden}`;
    if (ordenes.has(ko)) errores.push(`orden ${it.orden} repetido en ${it.nivel}`);
    ordenes.add(ko);
    if (!esDemo && !it.id.startsWith(`${it.nivel.toLowerCase()}-`)) errores.push(`${it.id}: el id debe empezar por ${it.nivel.toLowerCase()}-`);
    if (!it.revisado && !esDemo) (opts.estricto ? errores : avisos).push(`${it.id}: revisado: false`);

    const ejercicios = it.tipo === 'leccion' ? it.ejercicios : it.preguntas;
    for (const e of ejercicios) {
      if (idsEj.has(e.id)) errores.push(`id de ejercicio duplicado: ${e.id}`);
      idsEj.add(e.id);
      errores.push(...reglasEjercicio(e, it.id));
    }

    const v = it.tipo === 'leccion' ? it.video : it.fuente;
    if (v && v.start >= v.end) errores.push(`${it.id}: video con start >= end`);
    if (it.tipo === 'tramo' && v && v.start < v.end && (v.end - v.start < 30 || v.end - v.start > 120)) {
      errores.push(`${it.id}: el tramo debe durar entre 30 y 120 s`);
    }

    const referidos = [
      ...(it.tipo === 'leccion' ? [...terminosDeLectura(it.lectura), ...it.terminos] : it.palabrasClave),
      ...ejercicios.flatMap((e) => e.terminos ?? []),
    ];
    const disponibles = terminosPorTema.get(clave(it.nivel, it.tema)) ?? new Set<string>();
    for (const t of new Set(referidos)) {
      if (!disponibles.has(t)) errores.push(`${it.id}: «${t}» no está en el glosario ${clave(it.nivel, it.tema)}`);
    }
  }

  const catalogo: Catalogo = { lecciones, tramos, glosario };
  return { errores, avisos, catalogo };
}
```
Run `npx vitest run --project unit src/lib/contenido/reglas.test.ts` → PASS.

- [ ] **Step 8: Tests de `camino.ts` y `opciones.ts` (fallan)**

`camino.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { estadoCamino, type ItemCamino } from './camino';

const it_ = (id: string, orden: number, tipo: 'leccion' | 'tramo' = 'leccion'): ItemCamino =>
  ({ id, tipo, titulo: id, orden, tema: 'qa', nivel: 'A2' });
const items = [it_('l1', 1), it_('l2', 2), it_('t1', 3, 'tramo'), it_('l3', 4)];

describe('estadoCamino', () => {
  it('sin progreso: la primera lección es actual, el resto bloqueadas, los tramos disponibles', () => {
    const r = estadoCamino(items, new Set());
    expect(r.items.map((i) => i.estado)).toEqual(['actual', 'bloqueado', 'disponible', 'bloqueado']);
    expect(r.siguiente?.id).toBe('l1');
    expect(r.porcentaje).toBe(0);
  });
  it('lineal: completar l1 desbloquea l2; el tramo cuenta para el porcentaje', () => {
    const r = estadoCamino(items, new Set(['l1', 't1']));
    expect(r.items.map((i) => i.estado)).toEqual(['hecho', 'actual', 'hecho', 'bloqueado']);
    expect(r.porcentaje).toBe(50);
  });
  it('todo hecho: siguiente es null y 100 %', () => {
    const r = estadoCamino(items, new Set(['l1', 'l2', 't1', 'l3']));
    expect(r.siguiente).toBeNull();
    expect(r.porcentaje).toBe(100);
  });
  it('nivel sin contenido: vacío, 0 % y sin siguiente', () => {
    expect(estadoCamino([], new Set())).toEqual({ items: [], porcentaje: 0, siguiente: null });
  });
});
```
`opciones.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { opcionesCompilacion } from './opciones';

describe('opcionesCompilacion', () => {
  it('por defecto: sin demo y no estricto', () => expect(opcionesCompilacion({})).toEqual({ incluirDemo: false, estricto: false }));
  it('CONTENT_DEMO=1 incluye la demo', () => expect(opcionesCompilacion({ CONTENT_DEMO: '1' }).incluirDemo).toBe(true));
  it('build de Vercel es estricto', () => expect(opcionesCompilacion({ VERCEL: '1' }).estricto).toBe(true));
  it('CONTENIDO_ESTRICTO=1 es estricto', () => expect(opcionesCompilacion({ CONTENIDO_ESTRICTO: '1' }).estricto).toBe(true));
  it('la demo nunca entra en un build de Vercel', () => {
    expect(() => opcionesCompilacion({ VERCEL: '1', CONTENT_DEMO: '1' })).toThrow(/demo.*Vercel/);
  });
});
```

- [ ] **Step 9: Implementar `camino.ts` y `opciones.ts`**

```ts
// camino.ts
import type { Nivel, Tema } from './esquema';

export type ItemCamino = { id: string; tipo: 'leccion' | 'tramo'; titulo: string; orden: number; tema: Tema; nivel: Nivel };
export type EstadoItem = 'hecho' | 'actual' | 'bloqueado' | 'disponible';
type ConEstado = ItemCamino & { estado: EstadoItem };

/** Lecciones: lineales por orden. Tramos: siempre disponibles (decisión D1). Ambos cuentan para el %. */
export function estadoCamino(items: ItemCamino[], completados: ReadonlySet<string>) {
  let actualAsignado = false;
  const conEstado: ConEstado[] = [...items].sort((a, b) => a.orden - b.orden).map((it) => {
    let estado: EstadoItem;
    if (completados.has(it.id)) estado = 'hecho';
    else if (it.tipo === 'tramo') estado = 'disponible';
    else if (!actualAsignado) { estado = 'actual'; actualAsignado = true; }
    else estado = 'bloqueado';
    return { ...it, estado };
  });
  const hechos = conEstado.filter((i) => i.estado === 'hecho').length;
  return {
    items: conEstado,
    porcentaje: conEstado.length ? Math.round((hechos * 100) / conEstado.length) : 0,
    siguiente: conEstado.find((i) => i.estado === 'actual') ?? null,
  };
}
```
```ts
// opciones.ts
export function opcionesCompilacion(env: Record<string, string | undefined>) {
  const vercel = env.VERCEL === '1';
  const incluirDemo = env.CONTENT_DEMO === '1';
  if (vercel && incluirDemo) throw new Error('La demo (content/_demo) nunca se compila en un build de Vercel');
  return { incluirDemo, estricto: vercel || env.CONTENIDO_ESTRICTO === '1' };
}
```
Run ambos tests → PASS.

- [ ] **Step 10: Compilador `scripts/contenido/compilar.ts`**

```ts
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { validarCatalogo, type ArchivoCargado } from '../../src/lib/contenido/reglas';
import { opcionesCompilacion } from '../../src/lib/contenido/opciones';

const RAIZ = process.cwd();
const opts = opcionesCompilacion(process.env);
const dirs = readdirSync(join(RAIZ, 'content'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && (d.name !== '_demo' || opts.incluirDemo))
  .map((d) => d.name);

const archivos: ArchivoCargado[] = dirs.flatMap((dir) =>
  readdirSync(join(RAIZ, 'content', dir)).filter((f) => f.endsWith('.yaml')).map((f) => {
    const ruta = `content/${dir}/${f}`;
    return { ruta, demo: dir === '_demo', datos: parse(readFileSync(join(RAIZ, ruta), 'utf8')) };
  }),
);

const { errores, avisos, catalogo } = validarCatalogo(archivos, { estricto: opts.estricto });
for (const a of avisos) console.warn(`aviso: ${a}`);
if (errores.length) {
  for (const e of errores) console.error(`error: ${e}`);
  console.error(`\n${errores.length} error(es) de contenido. El build se detiene.`);
  process.exit(1);
}
const salida = join(RAIZ, 'src', 'content', 'generado');
if (!existsSync(salida)) mkdirSync(salida, { recursive: true });
writeFileSync(join(salida, 'catalogo.ts'),
  `// GENERADO por scripts/contenido/compilar.ts. No editar.\nimport 'server-only';\nimport type { Catalogo } from '@/lib/contenido/esquema';\n\nexport const catalogo: Catalogo = ${JSON.stringify(catalogo, null, 2)};\n`);
console.log(`contenido: ${catalogo.lecciones.length} lecciones, ${catalogo.tramos.length} tramos, ${catalogo.glosario.length} entradas${opts.incluirDemo ? ' (con demo)' : ''}${opts.estricto ? ' [estricto]' : ''}`);
```
`package.json` scripts (añadir; conservar los existentes):
```json
"content:build": "tsx scripts/contenido/compilar.ts",
"predev": "npm run content:build",
"prebuild": "npm run content:build",
"pretypecheck": "npm run content:build",
"pretest": "npm run content:build",
"pretest:int": "npm run content:build",
```

- [ ] **Step 11: Catálogo `src/lib/contenido/catalogo.ts`**

```ts
import 'server-only';
import { catalogo } from '@/content/generado/catalogo';
import type { EntradaGlosario, Ejercicio, Leccion, Nivel, Tema, Tramo } from './esquema';
import type { ItemCamino } from './camino';

const lecciones = new Map(catalogo.lecciones.map((l) => [l.id, l]));
const tramos = new Map(catalogo.tramos.map((t) => [t.id, t]));
const ejercicios = new Map<string, { ejercicio: Ejercicio; padreId: string; nivel: Nivel }>();
for (const l of catalogo.lecciones) for (const e of l.ejercicios) ejercicios.set(e.id, { ejercicio: e, padreId: l.id, nivel: l.nivel });
for (const t of catalogo.tramos) for (const e of t.preguntas) ejercicios.set(e.id, { ejercicio: e, padreId: t.id, nivel: t.nivel });

const aItem = (x: Leccion | Tramo): ItemCamino => ({ id: x.id, tipo: x.tipo, titulo: x.tipo === 'leccion' ? x.titulo : x.fuente.titulo, orden: x.orden, tema: x.tema, nivel: x.nivel });

export const getLeccion = (id: string): Leccion | undefined => lecciones.get(id);
export const getTramo = (id: string): Tramo | undefined => tramos.get(id);
export function getItem(id: string): ItemCamino | undefined {
  const x = lecciones.get(id) ?? tramos.get(id);
  return x && aItem(x);
}
export const getEjercicio = (id: string) => ejercicios.get(id);
export function caminoDeNivel(nivel: Nivel): ItemCamino[] {
  return [...catalogo.lecciones, ...catalogo.tramos].filter((x) => x.nivel === nivel).map(aItem).sort((a, b) => a.orden - b.orden);
}
export const tramosDeNivel = (nivel: Nivel): Tramo[] => catalogo.tramos.filter((t) => t.nivel === nivel).sort((a, b) => a.orden - b.orden);
export function glosarioPara(nivel: Nivel, tema: Tema, terminos: string[]): Record<string, EntradaGlosario> {
  const quiero = new Set(terminos);
  return Object.fromEntries(catalogo.glosario.filter((g) => g.nivel === nivel && g.tema === tema && quiero.has(g.termino)).map((g) => [g.termino, g]));
}
export const buscarEntrada = (nivel: Nivel, termino: string): EntradaGlosario | undefined =>
  catalogo.glosario.find((g) => g.nivel === nivel && g.termino === termino);
```
(`@/content/...` resuelve a `src/content/...` con el alias `@/*` → `src/*` existente.)

- [ ] **Step 12: Contenido golden en `content/_demo/` (tema backend, términos de git para no chocar con el contenido real)**

`content/_demo/glosario-demo.yaml`:
```yaml
tipo: glosario
nivel: A2
tema: backend
entradas:
  - { termino: commit, categoria: noun, traduccion_es: confirmación (commit), definicion_en: A saved group of changes in a project., ejemplo_en: I made a small commit before lunch., nivel: A2, tema: backend }
  - { termino: branch, categoria: noun, traduccion_es: rama, definicion_en: A separate line of work in a project., ejemplo_en: She is working on a new branch., nivel: A2, tema: backend }
  - { termino: merge, categoria: verb, traduccion_es: fusionar, definicion_en: To join two lines of work together., ejemplo_en: We merge the branch on Friday., nivel: A2, tema: backend }
  - { termino: review, categoria: noun, traduccion_es: revisión, definicion_en: When a person reads and checks your work., ejemplo_en: My review is ready., nivel: A2, tema: backend }
  - { termino: repository, categoria: noun, traduccion_es: repositorio, definicion_en: The place where a project and its history live., ejemplo_en: Clone the repository first., nivel: A2, tema: backend }
  - { termino: change, categoria: noun, traduccion_es: cambio, definicion_en: Something that is now different., ejemplo_en: This change fixes the button., nivel: A2, tema: backend }
```
`content/_demo/demo-01.yaml`:
```yaml
tipo: leccion
id: demo-01
nivel: A2
tema: backend
orden: 0
titulo: A Small Commit
objetivo: Puedo explicar qué es un commit y una rama.
gramatica: Present simple
lectura: |
  Every day, Leo opens the [[repository]] and creates a new [[branch]].
  He writes code and makes a small [[commit]] after each [[change]].
  Then a teammate does a [[review]]. If the code is good, they [[merge]] the branch.
video: { youtubeId: Ecu_7juyU0Q, start: 20, end: 80, titulo: "QA bug reporting basics", canal: "QA Unlocked" }
terminos: [commit, branch, merge]
ejercicios:
  - { id: demo-01-e1, tipo: opcion_multiple, enunciado: "What does Leo create every day?", opciones: ["A branch", "A database", "A bug"], correcta: 0, explicacion: "La lectura dice «creates a new branch».", terminos: [branch] }
  - { id: demo-01-e2, tipo: completar, enunciado: "Completa la frase.", texto: "He makes a small ___ after each change.", respuesta: commit, aceptadas: ["a commit"], explicacion: "Un commit guarda un grupo de cambios.", terminos: [commit] }
  - { id: demo-01-e3, tipo: ordenar, enunciado: "Ordena la frase.", piezas: ["They", "merge", "the", "branch"], explicacion: "Sujeto + verbo + complemento." }
  - { id: demo-01-e4, tipo: emparejar, enunciado: "Empareja cada término con su traducción.", pares: [{ a: commit, b: confirmación }, { a: branch, b: rama }, { a: review, b: revisión }], explicacion: "Vocabulario básico de git." }
  - { id: demo-01-e5, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "A teammate does a review before the merge.", correcta: true, explicacion: "Primero la revisión, luego el merge." }
revisado: false
```

`content/_demo/demo-t1.yaml`:
```yaml
tipo: tramo
id: demo-t1
nivel: A2
tema: backend
orden: 99
fuente: { podcast: "QA Unlocked", youtubeId: Ecu_7juyU0Q, start: 20, end: 80, titulo: "QA bug reporting basics", canal: "QA Unlocked" }
preguntaGuia: What does a good bug report need?
palabrasClave: [change, review]
preguntas:
  - { id: demo-t1-e1, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The video talks about bug reports.", correcta: true, explicacion: "El título lo indica." }
  - { id: demo-t1-e2, tipo: opcion_multiple, enunciado: "What is the video about?", opciones: ["Bug reports", "Cooking"], correcta: 0, explicacion: "Habla de informes de bugs." }
  - { id: demo-t1-e3, tipo: verdadero_falso, enunciado: "¿Verdadero o falso?", afirmacion: "The speaker talks about pizza.", correcta: false, explicacion: "No se habla de comida." }
revisado: false
```

- [ ] **Step 13: Test de la demo** — `src/lib/contenido/demo.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { validarCatalogo } from './reglas';

describe('content/_demo (lección golden)', () => {
  const dir = join(process.cwd(), 'content', '_demo');
  const archivos = readdirSync(dir).filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ ruta: `content/_demo/${f}`, demo: true, datos: parse(readFileSync(join(dir, f), 'utf8')) }));
  const r = validarCatalogo(archivos, { estricto: true });
  it('es válida incluso en modo estricto', () => expect(r.errores).toEqual([]));
  it('cubre los 5 tipos de ejercicio', () => {
    expect(new Set(r.catalogo.lecciones[0].ejercicios.map((e) => e.tipo)).size).toBe(5);
  });
  it('tiene un tramo', () => expect(r.catalogo.tramos.map((t) => t.id)).toEqual(['demo-t1']));
});
```
Run: `npm test` → PASS (incluye el `pretest` que compila sin demo y con `content/a2` vacío).
Run: `CONTENT_DEMO=1 npm run content:build` → «1 lecciones, 1 tramos, 6 entradas (con demo)».
Run: `VERCEL=1 CONTENT_DEMO=1 npm run content:build` → falla con «nunca se compila en un build de Vercel».
Run: `npm run lint && npm run typecheck && npm run build` → OK.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(contenido): esquema zod, reglas, compilador server-only, camino y lección golden"
```

---

### Task A2: Base de datos, repos y acciones comunes

**Files:**
- Modify: `src/lib/db/schema.ts`, `src/lib/db/test-utils.ts`, `src/lib/db/schema.int.test.ts` (si lista tablas)
- Create: `drizzle/0001_*.sql` (generado), `src/lib/tiempo/bogota.ts`, `src/lib/aprendizaje/terminos.ts`, `src/lib/aprendizaje/cola-registro.ts` (+ `cola-registro.test.ts`), `src/lib/aprendizaje/progreso.repo.ts`, `src/lib/aprendizaje/respuestas.repo.ts`, `src/lib/aprendizaje/tarjetas.repo.ts`, `src/lib/aprendizaje/actividad.repo.ts`, `src/app/(app)/_acciones/actions.ts`
- Test: `src/lib/tiempo/bogota.test.ts`, `src/lib/aprendizaje/terminos.test.ts`, `src/lib/aprendizaje/repos.int.test.ts`

**Interfaces:**
- Consumes: `getItem`, `getEjercicio`, `caminoDeNivel` (A1), `estadoCamino` (A1), `requireUser` (SP1).
- Produces (`bogota.ts`): `diaBogota(d: Date): string` ('YYYY-MM-DD'), `inicioDia(dia: string): Date`, `finDia(dia: string): Date`, `sumarDias(dia: string, n: number): string`, `lunesDe(dia: string): string`.
- Produces (`terminos.ts`): `normalizarTermino(s: string): string | null`.
- Produces (`cola-registro.ts`, lo usan B1, B2 y B4): `crearColaRegistro<T>(enviar: (x: T) => Promise<{ ok: boolean }>, opts?: { reintentos?: number; esperaMs?: number; onFalloPersistente?: () => void }): { encolar(x: T): void; pendientes(): number }`. Su test y su implementación están en **Task B1, Steps 3-4** (bloques `cola-registro.test.ts` y `cola-registro.ts`): en A2 se crean tal cual, y B1 no los vuelve a crear.
- Produces (repos, todos reciben `db: Db` primero):
  - `completarItem(db, userId, nivel: Nivel, itemId): Promise<'nuevo'|'ya'>`, `itemsCompletados(db, userId, nivel): Promise<Set<string>>`, `completadosEntre(db, userId, desde: Date, hasta: Date): Promise<number>`
  - `registrarRespuesta(db, r: { userId: string; itemId: string; correcta: boolean; origen: 'leccion'|'tramo'|'repaso'; caja?: number; at?: Date }): Promise<void>`
  - `agregarTarjetas(db, userId, nivel, terminos: string[], now: Date): Promise<number>` (nuevas insertadas), `contarPendientes(db, userId, now: Date): Promise<number>`
  - `sumarActividad(db, userId, dia: string, segundos: number): Promise<void>`, `MAX_SEGUNDOS_DIA = 14_400`
- Produces (acciones en `src/app/(app)/_acciones/actions.ts`):
  - `registrarRespuestaAction(input: { ejercicioId: string; correcta: boolean }): Promise<{ ok: true } | { ok: false }>` — si `correcta === false` añade los `terminos[]` del ejercicio a tarjetas.
  - `completarItemAction(input: { itemId: string }): Promise<{ ok: true; nuevo: boolean } | { ok: false; motivo: 'no_existe' | 'bloqueado' }>` — al completar una lección añade sus `terminos[]` a tarjetas.
  - `guardarTerminoAction(input: { termino: string; nivel: Nivel }): Promise<{ ok: true; nuevo: boolean } | { ok: false }>`

- [ ] **Step 1: Tests de tiempo (fallan)** — `src/lib/tiempo/bogota.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { diaBogota, inicioDia, finDia, sumarDias, lunesDe } from './bogota';

describe('tiempo en America/Bogota', () => {
  it('23:30 de Bogotá (04:30Z del día siguiente) es aún el mismo día', () => {
    expect(diaBogota(new Date('2026-10-08T04:30:00Z'))).toBe('2026-10-07');
  });
  it('00:10 de Bogotá ya es el día nuevo', () => expect(diaBogota(new Date('2026-10-08T05:10:00Z'))).toBe('2026-10-08'));
  it('inicio y fin del día', () => {
    expect(inicioDia('2026-10-07').toISOString()).toBe('2026-10-07T05:00:00.000Z');
    expect(finDia('2026-10-07').toISOString()).toBe('2026-10-08T04:59:59.999Z');
  });
  it('sumarDias cruza meses', () => expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02'));
  it('lunesDe: el lunes es inicio de semana y el domingo pertenece a la semana anterior', () => {
    expect(lunesDe('2026-10-05')).toBe('2026-10-05'); // lunes
    expect(lunesDe('2026-10-07')).toBe('2026-10-05'); // miércoles
    expect(lunesDe('2026-10-11')).toBe('2026-10-05'); // domingo
  });
});
```

- [ ] **Step 2: Implementar `bogota.ts`**

```ts
// Colombia no tiene horario de verano desde 1993: UTC-5 fijo.
const FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });

export const diaBogota = (d: Date): string => FMT.format(d);
export const inicioDia = (dia: string): Date => new Date(`${dia}T00:00:00.000-05:00`);
export const finDia = (dia: string): Date => new Date(`${dia}T23:59:59.999-05:00`);
export function sumarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function lunesDe(dia: string): string {
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return sumarDias(dia, -((dow + 6) % 7));
}
```
Run → PASS.

- [ ] **Step 3: Tests de `normalizarTermino` (fallan)**

```ts
import { describe, it, expect } from 'vitest';
import { normalizarTermino } from './terminos';

describe('normalizarTermino', () => {
  it.each([
    ['Tested,', 'tested'], ['  API ', 'api'], ['Don’t', "don't"], ['test  case', 'test case'], ['«bug».', 'bug'],
  ])('%s → %s', (entrada, salida) => expect(normalizarTermino(entrada)).toBe(salida));
  it.each(['', '   ', '!!!', 'x'.repeat(41)])('rechaza %j', (s) => expect(normalizarTermino(s)).toBeNull());
});
```

- [ ] **Step 4: Implementar `terminos.ts`**

```ts
import { terminoSchema } from '@/lib/contenido/esquema';

export function normalizarTermino(s: string): string | null {
  const t = s.normalize('NFC').replace(/[’‘]/g, "'").toLowerCase()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/\s+/g, ' ');
  return terminoSchema.safeParse(t).success ? t : null;
}
```
Run → PASS.

- [ ] **Step 5: Esquema de BD** — en `src/lib/db/schema.ts` añadir (importar `smallint, integer, boolean, date, check` de `drizzle-orm/pg-core` y `sql` de `drizzle-orm`):

```ts
export const origenEnum = pgEnum('origen_respuesta', ['leccion', 'tramo', 'repaso']);
```
En `users`, añadir la columna y el check (la tabla pasa a tener tercer argumento):
```ts
  metaDiariaMin: smallint('meta_diaria_min').notNull().default(10),
}, (t) => [check('users_meta_diaria', sql`${t.metaDiariaMin} in (5, 10, 15)`)]);
```
Tablas nuevas:
```ts
export const respuestas = pgTable(
  'respuestas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    correcta: boolean('correcta').notNull(),
    origen: origenEnum('origen').notNull(),
    /** Solo repaso: caja ANTES de responder (1-5). */
    caja: smallint('caja'),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [index('respuestas_user_at').on(t.userId, t.at)],
);

export const tarjetas = pgTable(
  'tarjetas',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    termino: text('termino').notNull(),
    nivel: nivelEnum('nivel').notNull(),
    caja: smallint('caja').notNull().default(1),
    proximaAt: ts('proxima_at').notNull(),
    ultimaAt: ts('ultima_at'),
    aciertos: integer('aciertos').notNull().default(0),
    fallos: integer('fallos').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.termino, t.nivel] }),
    index('tarjetas_user_proxima').on(t.userId, t.proximaAt),
    check('tarjetas_caja', sql`${t.caja} between 1 and 5`),
  ],
);

export const actividadDiaria = pgTable(
  'actividad_diaria',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    fecha: date('fecha', { mode: 'string' }).notNull(),
    segundos: integer('segundos').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.fecha] }), check('actividad_segundos', sql`${t.segundos} between 0 and 14400`)],
);
```
Run: `npm run db:generate` → crea `drizzle/0001_<nombre>.sql`. Revisar el SQL: `CREATE TYPE origen_respuesta`, 3 `CREATE TABLE`, `ALTER TABLE users ADD COLUMN meta_diaria_min smallint DEFAULT 10 NOT NULL`, los `CHECK` y FKs `ON DELETE cascade`.
`test-utils.ts`: `TRUNCATE respuestas, tarjetas, actividad_diaria, progress, login_attempts, sessions, invites, users RESTART IDENTITY CASCADE`.

- [ ] **Step 6: Tests de integración de repos (fallan)** — `src/lib/aprendizaje/repos.int.test.ts`

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, tarjetas, actividadDiaria, respuestas } from '@/lib/db/schema';
import { completarItem, itemsCompletados, completadosEntre } from './progreso.repo';
import { registrarRespuesta } from './respuestas.repo';
import { agregarTarjetas, contarPendientes } from './tarjetas.repo';
import { sumarActividad, MAX_SEGUNDOS_DIA } from './actividad.repo';

let userId: string;
const now = new Date('2026-10-07T15:00:00Z'); // 10:00 en Bogotá
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
});
afterAll(() => testPool.end());

describe('progreso', () => {
  it('completarItem es idempotente', async () => {
    expect(await completarItem(testDb, userId, 'A2', 'a2-qa-01')).toBe('nuevo');
    expect(await completarItem(testDb, userId, 'A2', 'a2-qa-01')).toBe('ya');
    expect([...(await itemsCompletados(testDb, userId, 'A2'))]).toEqual(['a2-qa-01']);
    expect(await completadosEntre(testDb, userId, new Date(0), new Date(Date.now() + 1000))).toBe(1);
  });
});

describe('tarjetas', () => {
  it('agregar no duplica y deja la tarjeta para mañana en caja 1', async () => {
    expect(await agregarTarjetas(testDb, userId, 'A2', ['bug', 'fix', 'bug'], now)).toBe(2);
    expect(await agregarTarjetas(testDb, userId, 'A2', ['bug'], now)).toBe(0);
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect(t.caja).toBe(1);
    expect(t.proximaAt.toISOString()).toBe('2026-10-08T05:00:00.000Z');
  });
  it('contarPendientes: vencen hoy (Bogotá) o antes', async () => {
    await agregarTarjetas(testDb, userId, 'A2', ['bug'], now);
    expect(await contarPendientes(testDb, userId, now)).toBe(0);
    expect(await contarPendientes(testDb, userId, new Date('2026-10-08T15:00:00Z'))).toBe(1);
  });
  it('lista vacía no consulta y devuelve 0', async () => expect(await agregarTarjetas(testDb, userId, 'A2', [], now)).toBe(0));
});

describe('respuestas', () => {
  it('registra con origen y caja', async () => {
    await registrarRespuesta(testDb, { userId, itemId: 'a2-qa-01-e1', correcta: false, origen: 'leccion' });
    await registrarRespuesta(testDb, { userId, itemId: 'bug', correcta: true, origen: 'repaso', caja: 3 });
    const filas = await testDb.select().from(respuestas);
    expect(filas.map((f) => [f.origen, f.caja])).toEqual(expect.arrayContaining([['leccion', null], ['repaso', 3]]));
  });
});

describe('actividad', () => {
  it('suma por día con tope de 4 h', async () => {
    await sumarActividad(testDb, userId, '2026-10-07', 600);
    await sumarActividad(testDb, userId, '2026-10-07', 120);
    let [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(720);
    for (let i = 0; i < 30; i++) await sumarActividad(testDb, userId, '2026-10-07', 600);
    [a] = await testDb.select().from(actividadDiaria);
    expect(a.segundos).toBe(MAX_SEGUNDOS_DIA);
  });
});

describe('users.meta_diaria_min', () => {
  it('por defecto 10 y rechaza valores fuera de 5/10/15', async () => {
    const [u] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(u.metaDiariaMin).toBe(10);
    await expect(testDb.update(users).set({ metaDiariaMin: 7 }).where(eq(users.id, userId))).rejects.toThrow();
  });
});
```
Run (con la BD de test levantada: `docker compose up -d db` y `DATABASE_URL_TEST` en `.env`, como en SP1): `npm run test:int` → FAIL.

- [ ] **Step 7: Implementar los repos**

`progreso.repo.ts`:
```ts
import { and, between, count, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { progress } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';

export async function completarItem(db: Db, userId: string, nivel: Nivel, itemId: string): Promise<'nuevo' | 'ya'> {
  const r = await db.insert(progress).values({ userId, nivel, leccionId: itemId }).onConflictDoNothing().returning({ id: progress.leccionId });
  return r.length ? 'nuevo' : 'ya';
}
export async function itemsCompletados(db: Db, userId: string, nivel: Nivel): Promise<Set<string>> {
  const filas = await db.select({ id: progress.leccionId }).from(progress).where(and(eq(progress.userId, userId), eq(progress.nivel, nivel)));
  return new Set(filas.map((f) => f.id));
}
export async function completadosEntre(db: Db, userId: string, desde: Date, hasta: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(progress).where(and(eq(progress.userId, userId), between(progress.completadaAt, desde, hasta)));
  return r.n;
}
```
`respuestas.repo.ts`:
```ts
import type { Db } from '@/lib/db/client';
import { respuestas } from '@/lib/db/schema';

export type Origen = 'leccion' | 'tramo' | 'repaso';
export async function registrarRespuesta(db: Db, r: { userId: string; itemId: string; correcta: boolean; origen: Origen; caja?: number; at?: Date }) {
  await db.insert(respuestas).values({ userId: r.userId, itemId: r.itemId, correcta: r.correcta, origen: r.origen, caja: r.caja ?? null, ...(r.at ? { at: r.at } : {}) });
}
```
`tarjetas.repo.ts`:
```ts
import { and, count, eq, lte } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { tarjetas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { diaBogota, finDia, inicioDia, sumarDias } from '@/lib/tiempo/bogota';

export async function agregarTarjetas(db: Db, userId: string, nivel: Nivel, terminos: string[], now: Date): Promise<number> {
  const unicos = [...new Set(terminos)];
  if (!unicos.length) return 0;
  const proximaAt = inicioDia(sumarDias(diaBogota(now), 1));
  const r = await db.insert(tarjetas).values(unicos.map((termino) => ({ userId, termino, nivel, caja: 1, proximaAt })))
    .onConflictDoNothing().returning({ t: tarjetas.termino });
  return r.length;
}
export async function contarPendientes(db: Db, userId: string, now: Date): Promise<number> {
  const [r] = await db.select({ n: count() }).from(tarjetas).where(and(eq(tarjetas.userId, userId), lte(tarjetas.proximaAt, finDia(diaBogota(now)))));
  return r.n;
}
```
`actividad.repo.ts`:
```ts
import { sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { actividadDiaria } from '@/lib/db/schema';

export const MAX_SEGUNDOS_DIA = 14_400;
export async function sumarActividad(db: Db, userId: string, dia: string, segundos: number): Promise<void> {
  await db.insert(actividadDiaria).values({ userId, fecha: dia, segundos: Math.min(segundos, MAX_SEGUNDOS_DIA) })
    .onConflictDoUpdate({
      target: [actividadDiaria.userId, actividadDiaria.fecha],
      set: { segundos: sql`least(${actividadDiaria.segundos} + ${segundos}, ${MAX_SEGUNDOS_DIA})` },
    });
}
```
Run `npm run test:int` → PASS.

- [ ] **Step 8: Acciones comunes** — `src/app/(app)/_acciones/actions.ts` (carpeta privada `_acciones`: no es ruta)

```ts
'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { getEjercicio, getItem, getLeccion, caminoDeNivel } from '@/lib/contenido/catalogo';
import { estadoCamino } from '@/lib/contenido/camino';
import { NIVELES } from '@/lib/progreso/niveles';
import { registrarRespuesta } from '@/lib/aprendizaje/respuestas.repo';
import { agregarTarjetas } from '@/lib/aprendizaje/tarjetas.repo';
import { completarItem, itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { normalizarTermino } from '@/lib/aprendizaje/terminos';

const idSchema = z.string().max(80);

export async function registrarRespuestaAction(input: { ejercicioId: string; correcta: boolean }) {
  const u = await requireUser();
  const p = z.object({ ejercicioId: idSchema, correcta: z.boolean() }).safeParse(input);
  const ref = p.success ? getEjercicio(p.data.ejercicioId) : undefined;
  if (!p.success || !ref) return { ok: false as const };
  const db = getDb();
  const origen = getLeccion(ref.padreId) ? 'leccion' : 'tramo';
  await registrarRespuesta(db, { userId: u.userId, itemId: p.data.ejercicioId, correcta: p.data.correcta, origen });
  if (!p.data.correcta && ref.ejercicio.terminos?.length) await agregarTarjetas(db, u.userId, ref.nivel, ref.ejercicio.terminos, new Date());
  return { ok: true as const };
}

export async function completarItemAction(input: { itemId: string }) {
  const u = await requireUser();
  const p = z.object({ itemId: idSchema }).safeParse(input);
  const item = p.success ? getItem(p.data.itemId) : undefined;
  if (!item) return { ok: false as const, motivo: 'no_existe' as const };
  const db = getDb();
  const estado = estadoCamino(caminoDeNivel(item.nivel), await itemsCompletados(db, u.userId, item.nivel))
    .items.find((i) => i.id === item.id)?.estado;
  if (estado === 'bloqueado') return { ok: false as const, motivo: 'bloqueado' as const };
  const r = await completarItem(db, u.userId, item.nivel, item.id);
  const leccion = getLeccion(item.id);
  if (r === 'nuevo' && leccion) await agregarTarjetas(db, u.userId, item.nivel, leccion.terminos, new Date());
  return { ok: true as const, nuevo: r === 'nuevo' };
}

export async function guardarTerminoAction(input: { termino: string; nivel: string }) {
  const u = await requireUser();
  const p = z.object({ termino: z.string().max(60), nivel: z.enum(NIVELES) }).safeParse(input);
  const termino = p.success ? normalizarTermino(p.data.termino) : null;
  if (!p.success || !termino) return { ok: false as const };
  const n = await agregarTarjetas(getDb(), u.userId, p.data.nivel, [termino], new Date());
  return { ok: true as const, nuevo: n > 0 };
}
```
Run: `npm test` → `guardas-app.test.ts` incluye `_acciones/actions.ts` y pasa (3 acciones con `requireUser`).
Run: `npm run lint && npm run typecheck` → OK.

- [ ] **Step 9: Cola de registro** — escribir `src/lib/aprendizaje/cola-registro.test.ts` copiando el bloque `cola-registro.test.ts` de **Task B1, Step 3**; ejecutarlo (FAIL); implementar `src/lib/aprendizaje/cola-registro.ts` copiando el bloque de **Task B1, Step 4**; ejecutarlo (PASS).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(datos): migración SP2 (respuestas, tarjetas, actividad, meta diaria), repos y acciones comunes"
```

---

### Task A3: Diseño base — tokens «Terminal Calma», tema, shell de navegación y componentes

Usa la skill `disenador-ui-accesible`.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/nivel-inicial/actions.ts`, `src/app/(app)/nivel-inicial/page.tsx`, `next.config.ts`, `src/components/boton.tsx`
- Create: `src/lib/tema.ts`, `src/components/navegacion.tsx`, `src/components/tarjeta.tsx`, `src/components/barra-progreso.tsx`, `src/components/estado-vacio-nivel.tsx`, `src/app/(app)/hoy/page.tsx`, `src/app/(app)/camino/page.tsx`, `src/app/(app)/escuchar/page.tsx`, `src/app/(app)/perfil/page.tsx` (stubs), `src/app/(app)/perfil/enlace-admin.tsx` (mover desde `(app)/enlace-admin.tsx`)
- Delete: `src/app/(app)/niveles/page.tsx`
- Test: `src/lib/tema.test.ts`

**Interfaces:**
- Produces: `TEMAS_UI = ['claro','oscuro','sistema']`, `type TemaUI`, `temaDesdeCookie(v: string | undefined): TemaUI`, `dataThemeDe(t: TemaUI): 'light' | 'dark' | undefined`, `COOKIE_TEMA = 'tema'`.
- Produces componentes: `<Tarjeta as?="section"|"article"|"div" className?>`, `<BarraProgreso valor={0-100} etiqueta="…" />` (`<progress>` nativo), `<EstadoVacioNivel nivel={string} />`, `<Boton variante?="primario"|"secundario"|"fantasma">`, `<Navegacion />` (cliente).
- Produces rutas: `/hoy`, `/camino`, `/escuchar`, `/perfil` (stubs con `requireUser`, las rellenan B1-B4), `/` → `/hoy` (o `/nivel-inicial`), `/niveles` → `/camino` (308).

- [ ] **Step 1: Test de tema (falla)**

```ts
import { describe, it, expect } from 'vitest';
import { temaDesdeCookie, dataThemeDe } from './tema';

describe('tema', () => {
  it('valores válidos', () => {
    expect(temaDesdeCookie('oscuro')).toBe('oscuro');
    expect(temaDesdeCookie('claro')).toBe('claro');
  });
  it('desconocido o ausente → sistema', () => {
    expect(temaDesdeCookie(undefined)).toBe('sistema');
    expect(temaDesdeCookie('<script>')).toBe('sistema');
  });
  it('data-theme', () => {
    expect(dataThemeDe('claro')).toBe('light');
    expect(dataThemeDe('oscuro')).toBe('dark');
    expect(dataThemeDe('sistema')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implementar `src/lib/tema.ts`**

```ts
export const COOKIE_TEMA = 'tema';
export const TEMAS_UI = ['claro', 'oscuro', 'sistema'] as const;
export type TemaUI = (typeof TEMAS_UI)[number];
export const temaDesdeCookie = (v: string | undefined): TemaUI => ((TEMAS_UI as readonly string[]).includes(v ?? '') ? (v as TemaUI) : 'sistema');
export const dataThemeDe = (t: TemaUI): 'light' | 'dark' | undefined => (t === 'claro' ? 'light' : t === 'oscuro' ? 'dark' : undefined);
```
Run → PASS.

- [ ] **Step 3: Tokens en `globals.css`** — sustituir los bloques `:root` por los valores de la sección Global Constraints, conservando nombres de variables y añadiendo los de lectura:

```css
:root {
  color-scheme: light dark;
  --bg: #ffffff; --surface: #f1f5f9; --text: #0f172a; --text-muted: #475569;
  --primary: #0f766e; --on-primary: #ffffff;
  --success: #15803d; --danger: #b91c1c; --warning: #b45309;
  --border-ui: #64748b; --focus: #0f766e;
  --lectura-bg: #fafaf7; --lectura-text: #1f2937;
}
/* oscuro: mismo bloque en @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} } y en :root[data-theme="dark"] */
  --bg: #0b1220; --surface: #131c2e; --text: #e2e8f0; --text-muted: #94a3b8;
  --primary: #2dd4bf; --on-primary: #04201d;
  --success: #4ade80; --danger: #f87171; --warning: #fbbf24;
  --border-ui: #64748b; --focus: #2dd4bf;
  --lectura-bg: #141418; --lectura-text: #ececf1;
```
En `@theme inline` añadir `--color-lectura-fondo: var(--lectura-bg); --color-lectura-texto: var(--lectura-text); --font-mono: ui-monospace, "Cascadia Code", "JetBrains Mono", Menlo, monospace;`. Añadir:
```css
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
```

- [ ] **Step 4: Tema sin parpadeo en `src/app/layout.tsx`**

```tsx
import { cookies } from 'next/headers';
import { COOKIE_TEMA, dataThemeDe, temaDesdeCookie } from '@/lib/tema';
// …
export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const tema = temaDesdeCookie((await cookies()).get(COOKIE_TEMA)?.value);
  return (
    <html lang="es" data-theme={dataThemeDe(tema)} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-fondo text-texto">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: `lucide-react` y componentes base**

```bash
npm install --save-exact lucide-react@latest
```
`src/components/boton.tsx`:
```tsx
import type { ButtonHTMLAttributes } from 'react';

const VARIANTES = {
  primario: 'bg-primario text-sobre-primario',
  secundario: 'border border-borde bg-superficie text-texto',
  fantasma: 'text-primario underline-offset-4 hover:underline',
} as const;

export function Boton({ className = '', variante = 'primario', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof VARIANTES }) {
  return <button className={`min-h-11 min-w-11 rounded-md px-4 font-semibold disabled:opacity-60 ${VARIANTES[variante]} ${className}`} {...props} />;
}
```
`src/components/tarjeta.tsx`:
```tsx
import type { HTMLAttributes } from 'react';
export function Tarjeta({ as: Tag = 'section', className = '', ...props }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div' }) {
  return <Tag className={`rounded-xl border border-borde/40 bg-superficie p-4 ${className}`} {...props} />;
}
```
`src/components/barra-progreso.tsx` — **sin atributos `style`**: la CSP de producción (`style-src 'self' 'nonce-…'`) bloquea los `style="…"` que el servidor emite en el HTML. Por eso `<progress>` nativo:
```tsx
export function BarraProgreso({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return <progress value={v} max={100} aria-label={etiqueta} className="barra-progreso h-2 w-full" />;
}
```
En `globals.css`:
```css
.barra-progreso { appearance: none; border: 0; border-radius: 9999px; overflow: hidden; background: color-mix(in srgb, var(--border-ui) 30%, transparent); }
.barra-progreso::-webkit-progress-bar { background: transparent; }
.barra-progreso::-webkit-progress-value { background: var(--primary); border-radius: 9999px; }
.barra-progreso::-moz-progress-bar { background: var(--primary); border-radius: 9999px; }
```
Regla para todas las tareas: **nunca** `style={…}` en componentes que se rendericen en el servidor. Comprobar con `npm run build && npm start` que la consola no muestra violaciones CSP.

`src/components/estado-vacio-nivel.tsx` (lo usan B1, B3 y B4):
```tsx
import Link from 'next/link';
import { Tarjeta } from './tarjeta';
export function EstadoVacioNivel({ nivel }: { nivel: string }) {
  return (
    <Tarjeta>
      <h2 className="text-lg font-semibold">El contenido de {nivel} llega pronto</h2>
      <p className="mt-1 text-texto-suave">Mientras tanto, practica con el camino A2.</p>
      <Link href="/camino/A2" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primario underline">Ir al camino A2</Link>
    </Tarjeta>
  );
}
```

- [ ] **Step 6: Navegación** — `src/components/navegacion.tsx` (cliente). Móvil (< 1024 px): barra inferior fija de 4 pestañas con icono + etiqueta. Escritorio (≥ 1024 px): barra lateral con las mismas secciones. Atajos `Alt+1…Alt+4` (no son de una sola tecla, cumple WCAG 2.1.4).

```tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { House, Map, Headphones, User } from 'lucide-react';

const SECCIONES = [
  { href: '/hoy', etiqueta: 'Hoy', Icono: House },
  { href: '/camino', etiqueta: 'Camino', Icono: Map },
  { href: '/escuchar', etiqueta: 'Escuchar', Icono: Headphones },
  { href: '/perfil', etiqueta: 'Perfil', Icono: User },
] as const;

export function Navegacion() {
  const ruta = usePathname();
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (e.altKey && !e.ctrlKey && !e.metaKey && n >= 1 && n <= SECCIONES.length) { e.preventDefault(); router.push(SECCIONES[n - 1].href); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-10 border-t border-borde/40 bg-fondo lg:static lg:w-56 lg:border-r lg:border-t-0">
      <ul className="mx-auto flex max-w-xl justify-around lg:flex-col lg:gap-1 lg:p-3">
        {SECCIONES.map(({ href, etiqueta, Icono }, i) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link href={href} aria-current={activa ? 'page' : undefined} aria-keyshortcuts={`Alt+${i + 1}`}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-3 lg:text-base ${activa ? 'font-semibold text-primario' : 'text-texto-suave'}`}>
                <Icono aria-hidden="true" className="size-5" />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```
`src/app/(app)/layout.tsx` (sin consultas a BD; `Salir` e Invitaciones se mueven a `/perfil`):
```tsx
import { Navegacion } from '@/components/navegacion';

// El layout no consulta la BD: así loading.tsx cubre el arranque en frío. Cada página y acción llama a requireUser/requireAdmin.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <Navegacion />
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 lg:pb-6">{children}</main>
    </div>
  );
}
```
Añadir un enlace «Saltar al contenido» (`href="#contenido"`, visible al foco) antes de `<Navegacion />` y `id="contenido"` en `<main>`.

- [ ] **Step 7: Rutas y redirecciones**

`next.config.ts`: añadir
```ts
  async redirects() {
    return [{ source: '/niveles', destination: '/camino', permanent: true }];
  },
```
(`permanent: true` → 308.) Borrar `src/app/(app)/niveles/page.tsx`. `src/app/(app)/page.tsx` → `redirect(u.nivelInicial ? '/hoy' : '/nivel-inicial')`. En `nivel-inicial/actions.ts` y `page.tsx`, `redirect('/niveles')` → `redirect('/hoy')`.

Stubs (los rellenan B1-B4; deben pasar el test de guardas):
```tsx
// src/app/(app)/hoy/page.tsx  (igual patrón para camino, escuchar y perfil con su título)
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';

export default async function HoyPage() {
  const u = await requireUser();
  if (!u.nivelInicial) redirect('/nivel-inicial');
  return <h1 className="text-2xl font-bold">Hoy</h1>;
}
```
`/perfil` stub incluye ya el formulario `Salir` (`salirAction`) y `<EnlaceAdmin />` (movido a `perfil/enlace-admin.tsx`, ajustar import), para no perder funciones del SP1.

- [ ] **Step 8: Verificación**

Run: `npm test && npm run lint && npm run typecheck && npm run build` → OK.
Run: `npm run dev` y comprobar a mano (o con `verificador`) en 360 px y 1366 px: barra inferior/lateral, `aria-current`, `Alt+2` navega a `/camino`, `/niveles` responde 308 a `/camino`, cookie `tema=oscuro` pinta oscuro sin parpadeo.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(ui): tokens Terminal Calma, tema por cookie, navegación de 4 pestañas y componentes base"
```

---

### Task A4: CSP para YouTube y `VideoFacade` (con spike de la IFrame API)

**Files:**
- Modify: `src/lib/security/csp.ts`, `src/lib/security/csp.test.ts`, `docs/seguridad.md`
- Create: `src/components/video-facade.tsx`, `src/lib/youtube.ts`
- Test: `src/lib/youtube.test.ts`

**Interfaces:**
- Produces: `urlMiniatura(id: string): string`, `urlEmbed(v: { youtubeId: string; start: number; end: number }, opts?: { api?: boolean }): string`, `cargarApiYouTube(): Promise<YTNamespace>` (carga `https://www.youtube.com/iframe_api` una vez, solo cuando se llama).
- Produces componente: `<VideoFacade video={Video} onError?={() => void} api?={boolean} onPlayer?={(p: YTPlayer) => void} />` (cliente). Antes de pulsar: miniatura + botón «Reproducir video: {titulo}» y crédito «{canal}». Después: iframe `youtube-nocookie` con `title`. Error (miniatura que no carga o `onError` del player): «Video no disponible» y el padre permite saltar.

- [ ] **Step 1: Tests de CSP (fallan)** — añadir a `csp.test.ts`:

```ts
  it('permite solo el iframe de youtube-nocookie y las miniaturas de i.ytimg.com', () => {
    expect(prod).toContain('frame-src https://www.youtube-nocookie.com');
    expect(prod).not.toContain("frame-src 'none'");
    expect(prod).toContain("img-src 'self' data: https://i.ytimg.com");
  });
  it('script-src sigue sin hosts (strict-dynamic propaga la confianza al script de la IFrame API cargado tras el clic)', () => {
    expect(prod).toMatch(/script-src 'self' 'nonce-abc' 'strict-dynamic'(;|$)/);
  });
```
Y quitar `frame-src 'none'` del test «bloquea framing y objetos» (mantener `frame-ancestors 'none'` y `object-src 'none'`).

- [ ] **Step 2: Implementar en `buildCsp`**

```ts
    "img-src 'self' data: https://i.ytimg.com",
    // …
    'frame-src https://www.youtube-nocookie.com',
```
Run `npx vitest run --project unit src/lib/security/csp.test.ts` → PASS.

- [ ] **Step 3: Tests de `youtube.ts` (fallan)**

```ts
import { describe, it, expect } from 'vitest';
import { urlEmbed, urlMiniatura } from './youtube';

describe('youtube', () => {
  it('miniatura', () => expect(urlMiniatura('Ecu_7juyU0Q')).toBe('https://i.ytimg.com/vi/Ecu_7juyU0Q/hqdefault.jpg'));
  it('embed nocookie con tramo, sin relacionados y autoplay tras el clic', () => {
    const u = new URL(urlEmbed({ youtubeId: 'Ecu_7juyU0Q', start: 20, end: 80 }));
    expect(u.origin).toBe('https://www.youtube-nocookie.com');
    expect(u.pathname).toBe('/embed/Ecu_7juyU0Q');
    expect(Object.fromEntries(u.searchParams)).toEqual({ start: '20', end: '80', rel: '0', autoplay: '1' });
  });
  it('con api añade enablejsapi', () => {
    expect(new URL(urlEmbed({ youtubeId: 'Ecu_7juyU0Q', start: 0, end: 60 }, { api: true })).searchParams.get('enablejsapi')).toBe('1');
  });
  it('rechaza ids inválidos', () => expect(() => urlMiniatura('../x')).toThrow());
});
```

- [ ] **Step 4: Implementar `youtube.ts`**

```ts
const ID = /^[A-Za-z0-9_-]{11}$/;
const valida = (id: string) => { if (!ID.test(id)) throw new Error('youtubeId inválido'); return id; };

export const urlMiniatura = (id: string) => `https://i.ytimg.com/vi/${valida(id)}/hqdefault.jpg`;
export function urlEmbed(v: { youtubeId: string; start: number; end: number }, opts: { api?: boolean } = {}) {
  const p = new URLSearchParams({ start: String(v.start), end: String(v.end), rel: '0', autoplay: '1' });
  if (opts.api) p.set('enablejsapi', '1');
  return `https://www.youtube-nocookie.com/embed/${valida(v.youtubeId)}?${p}`;
}

/* Tipos mínimos de la IFrame API que usamos. */
export type YTPlayer = { setPlaybackRate(r: number): void; playVideo(): void; seekTo(s: number, allow: boolean): void; destroy(): void };
export type YTNamespace = { Player: new (el: HTMLElement | string, o: { events?: Record<string, (e: { data: number; target: YTPlayer }) => void> }) => YTPlayer };

let promesa: Promise<YTNamespace> | null = null;
export function cargarApiYouTube(): Promise<YTNamespace> {
  if (promesa) return promesa;
  promesa = new Promise((resolve, reject) => {
    const w = window as unknown as { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return resolve(w.YT);
    w.onYouTubeIframeAPIReady = () => resolve(w.YT!);
    const s = document.createElement('script'); // confiable por 'strict-dynamic' (lo crea un script con nonce)
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { promesa = null; reject(new Error('No se pudo cargar la API de YouTube')); };
    document.head.appendChild(s);
  });
  return promesa;
}
```
Run → PASS.

- [ ] **Step 5: `VideoFacade`**

```tsx
'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Play, VideoOff } from 'lucide-react';
import type { Video } from '@/lib/contenido/esquema';
import { cargarApiYouTube, urlEmbed, urlMiniatura, type YTPlayer } from '@/lib/youtube';

export function VideoFacade({ video, api = false, onPlayer, onError }: { video: Video; api?: boolean; onPlayer?: (p: YTPlayer) => void; onError?: () => void }) {
  const [estado, setEstado] = useState<'facade' | 'video' | 'error'>('facade');
  const iframeId = useId().replace(/:/g, '');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fallo = () => { setEstado('error'); onError?.(); };

  useEffect(() => {
    if (estado !== 'video' || !api || !iframeRef.current) return;
    let player: YTPlayer | undefined;
    cargarApiYouTube()
      .then((YT) => { player = new YT.Player(iframeRef.current!, { events: { onReady: (e) => onPlayer?.(e.target), onError: fallo } }); })
      .catch(() => { /* sin API: el video sigue funcionando a 1x */ });
    return () => player?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, api]);

  if (estado === 'error') {
    return (
      <div role="status" className="flex aspect-video items-center justify-center gap-2 rounded-xl bg-superficie text-texto-suave">
        <VideoOff aria-hidden="true" className="size-5" /> Video no disponible
      </div>
    );
  }
  if (estado === 'video') {
    return (
      <iframe ref={iframeRef} id={iframeId} src={urlEmbed(video, { api })} title={video.titulo}
        allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video w-full rounded-xl" />
    );
  }
  return (
    <figure>
      <button type="button" onClick={() => setEstado('video')} className="group relative block w-full overflow-hidden rounded-xl" aria-label={`Reproducir video: ${video.titulo}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urlMiniatura(video.youtubeId)} alt="" loading="lazy" onError={fallo} className="aspect-video w-full object-cover" />
        <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primario text-sobre-primario">
          <Play aria-hidden="true" className="size-8" />
        </span>
      </button>
      <figcaption className="mt-1 text-sm text-texto-suave">{video.titulo} · {video.canal}</figcaption>
    </figure>
  );
}
```

- [ ] **Step 6: Spike en navegador real (obligatorio, ≤ 30 min)**

Crear temporalmente `src/app/(app)/hoy/page.tsx` con `<VideoFacade api video={{ youtubeId: 'Ecu_7juyU0Q', start: 20, end: 80, titulo: 't', canal: 'c' }} onPlayer={(p) => p.setPlaybackRate(0.75)} />` (envolver en un componente cliente), ejecutar `npm run build && npm start` (CSP de producción, sin `unsafe-eval`) y comprobar en Chrome y Firefox:
1. Antes de pulsar: ningún `<iframe>` en el DOM y ninguna petición a `youtube*.com` en la pestaña Red.
2. Tras pulsar: el video reproduce el tramo, la consola **no** muestra violaciones CSP y la velocidad pasa a 0,75x.
3. Resultado al informe: si la IFrame API choca con la CSP, **no** abrir `script-src` a hosts: dejar `api` desactivado (0,75x con el control nativo del reproductor) y anotarlo en `docs/seguridad.md`. Revertir el cambio temporal de `/hoy`.

- [ ] **Step 7: Documentar** en `docs/seguridad.md` (sección CSP): `frame-src` solo `youtube-nocookie`, `img-src` añade `i.ytimg.com`, `script-src` sin cambios (la IFrame API entra por `strict-dynamic` solo tras el clic), sin COEP, resultado del spike.

- [ ] **Step 8: Commit**

```bash
npm test && npm run lint && npm run typecheck
git add -A
git commit -m "feat(video): VideoFacade con youtube-nocookie tras el clic y CSP mínima para YouTube"
```

---

### Task A5: CI de contenido — modo estricto, oEmbed y revisión semanal, demo en E2E

**Files:**
- Create: `scripts/contenido/videos.ts`, `src/lib/contenido/videos.ts`, `.github/workflows/contenido-semanal.yml`
- Test: `src/lib/contenido/videos.test.ts`
- Modify: `.github/workflows/ci.yml`, `package.json`, `Dockerfile`, `docker-compose.yml`, `tests/docker-compose.yml`, `README.md` (sección Contenido)

**Interfaces:**
- Consumes: `validarCatalogo`, `opcionesCompilacion` (A1).
- Produces: `idsDeVideo(c: Catalogo): string[]` (únicos), `comprobarVideos(ids: string[], fetcher: typeof fetch): Promise<{ id: string; status: number }[]>` (solo los fallidos); script npm `content:check-videos`.

- [ ] **Step 1: Tests (fallan)** — `src/lib/contenido/videos.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { comprobarVideos, idsDeVideo } from './videos';

describe('videos', () => {
  it('idsDeVideo junta lecciones y tramos sin repetir', () => {
    const c = { lecciones: [{ video: { youtubeId: 'AAAAAAAAAAA' } }, {}], tramos: [{ fuente: { youtubeId: 'AAAAAAAAAAA' } }, { fuente: { youtubeId: 'BBBBBBBBBBB' } }], glosario: [] };
    expect(idsDeVideo(c as never)).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
  });
  it('comprobarVideos devuelve solo los que no dan 200, usando oEmbed', async () => {
    const urls: string[] = [];
    const fake = (async (u: string) => { urls.push(u); return { status: u.includes('BBBBBBBBBBB') ? 401 : 200 }; }) as unknown as typeof fetch;
    expect(await comprobarVideos(['AAAAAAAAAAA', 'BBBBBBBBBBB'], fake)).toEqual([{ id: 'BBBBBBBBBBB', status: 401 }]);
    expect(urls[0]).toBe('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DAAAAAAAAAAA');
  });
});
```

- [ ] **Step 2: Implementar `src/lib/contenido/videos.ts`**

```ts
import type { Catalogo } from './esquema';

export function idsDeVideo(c: Catalogo): string[] {
  return [...new Set([...c.lecciones.flatMap((l) => (l.video ? [l.video.youtubeId] : [])), ...c.tramos.map((t) => t.fuente.youtubeId)])];
}
export async function comprobarVideos(ids: string[], fetcher: typeof fetch) {
  const fallos: { id: string; status: number }[] = [];
  for (const id of ids) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const status = await fetcher(url).then((r) => r.status, () => 0);
    if (status !== 200) fallos.push({ id, status });
  }
  return fallos;
}
```
Run → PASS.

- [ ] **Step 3: Script `scripts/contenido/videos.ts`** — carga YAML igual que `compilar.ts` (sin demo), valida con `validarCatalogo(…, { estricto: false })`, llama a `comprobarVideos(idsDeVideo(catalogo), fetch)`, imprime `video caído: <id> (<status>)` por fallo y sale con código 1 si hay alguno. `package.json`: `"content:check-videos": "tsx scripts/contenido/videos.ts"`. Extraer la carga de archivos a `scripts/contenido/cargar.ts` (`cargarArchivos({ incluirDemo }): ArchivoCargado[]`) y usarla en ambos scripts.

- [ ] **Step 4: `ci.yml`** — en el job `calidad`:
  - A nivel de job: `env: { CONTENIDO_ESTRICTO: "${{ github.event_name == 'push' && github.ref == 'refs/heads/main' && '1' || '' }}" }` (en `main`, `revisado: false` rompe el build).
  - Paso nuevo tras `npm ci`: `- run: npm run content:check-videos`.
- [ ] **Step 5: `contenido-semanal.yml`**

```yaml
name: contenido-semanal
# Cada lunes comprueba que los videos del contenido siguen disponibles (oEmbed) y abre un issue si alguno cae.
on:
  schedule: [{ cron: "0 13 * * 1" }]
  workflow_dispatch:
permissions:
  contents: read
  issues: write
jobs:
  videos:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { persist-credentials: false }
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci --ignore-scripts
      - id: check
        run: npm run content:check-videos > videos.log 2>&1 || echo "fallo=1" >> "$GITHUB_OUTPUT"
      - if: steps.check.outputs.fallo == '1'
        env: { GH_TOKEN: "${{ github.token }}" }
        run: gh issue create --repo "$GITHUB_REPOSITORY" --title "Videos del contenido no disponibles ($(date -u +%F))" --body-file videos.log
```
- [ ] **Step 6: Demo en el stack E2E** — `Dockerfile` etapa `build`: añadir `ARG CONTENT_DEMO=` y `ENV CONTENT_DEMO=$CONTENT_DEMO` antes de `RUN npm run build`; copiar `content/` no hace falta en `run` (se compila en el build). `docker-compose.yml` servicios `migrate` y `web`: `build: { context: ., args: { CONTENT_DEMO: "${CONTENT_DEMO:-}" } }`. `tests/docker-compose.yml`: en `web` y `migrate` `build.args.CONTENT_DEMO: "1"`. (Vercel nunca define `CONTENT_DEMO`, y `opcionesCompilacion` lo prohíbe con `VERCEL=1`.)
- [ ] **Step 7: README** — sección «Contenido»: dónde vive, `npm run content:build`, reglas, `revisado`, demo, `content:check-videos`.
- [ ] **Step 8: Verificar y commit**

Run: `npm test && npm run lint && npm run typecheck && CONTENIDO_ESTRICTO=1 npm run content:build` → OK (con `content/a2` vacío).
Run: `docker compose -f docker-compose.yml -f tests/docker-compose.yml build web` → el log muestra «(con demo)».
```bash
git add -A
git commit -m "ci(contenido): modo estricto en main, oEmbed en CI y semanal, demo solo en el stack E2E"
```

---

### Task B1: Motor de lección, glosario tocable y camino

Usa `disenador-ui-accesible` y `test-driven-development`.

**Files:**
- Create: `src/lib/aprendizaje/corregir.ts`, `src/lib/aprendizaje/barajar.ts` (`cola-registro.ts` ya existe desde A2; su código está documentado en los Steps 3-4 de esta tarea)
- Create: `src/components/ejercicios/ejercicio.tsx`, `src/components/ejercicios/opcion-multiple.tsx`, `src/components/ejercicios/completar.tsx`, `src/components/ejercicios/ordenar.tsx`, `src/components/ejercicios/emparejar.tsx`, `src/components/ejercicios/verdadero-falso.tsx`, `src/components/ejercicios/secuencia-ejercicios.tsx`, `src/components/ejercicios/feedback.tsx`
- Create: `src/components/lectura/lectura.tsx`, `src/components/lectura/palabra-glosario.tsx`
- Create: `src/app/(app)/leccion/[id]/page.tsx`, `src/app/(app)/leccion/[id]/flujo-leccion.tsx`, `src/app/(app)/leccion/[id]/not-found.tsx`, `src/app/(app)/camino/page.tsx` (sustituye stub), `src/app/(app)/camino/[nivel]/page.tsx`
- Test: `src/lib/aprendizaje/corregir.test.ts`, `src/lib/aprendizaje/barajar.test.ts`

**Interfaces:**
- Consumes: catálogo y `estadoCamino` (A1), acciones `registrarRespuestaAction`, `completarItemAction`, `guardarTerminoAction` (A2), `itemsCompletados` (A2), `VideoFacade` (A4), `Tarjeta`, `BarraProgreso`, `Boton` (A3), `estadoNiveles` (SP1).
- Produces:
  - `type RespuestaUsuario = { tipo: 'opcion_multiple'; indice: number } | { tipo: 'completar'; texto: string } | { tipo: 'ordenar'; orden: string[] } | { tipo: 'emparejar'; asignacion: Record<string, string> } | { tipo: 'verdadero_falso'; valor: boolean }`
  - `normalizarRespuesta(s: string): string`, `corregir(e: Ejercicio, r: RespuestaUsuario): boolean`
  - `barajar<T>(items: readonly T[], semilla: string): T[]` (determinista; si `n ≥ 2` nunca devuelve el orden original)
  - `<SecuenciaEjercicios ejercicios={Ejercicio[]} etiqueta="Ejercicio" onCompletada={() => void} />` (registra cada respuesta con la cola)
  - `<Lectura texto={string} glosario={Record<string, EntradaGlosario>} nivel={Nivel} />`

- [ ] **Step 1: Tests de corrección (fallan)** — `corregir.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { corregir, normalizarRespuesta } from './corregir';
import type { Ejercicio } from '@/lib/contenido/esquema';

const base = { id: 'x-e1', enunciado: 'e', explicacion: 'x' };
describe('normalizarRespuesta', () => {
  it.each([['  I  Found ', 'i found'], ['don’t', "don't"], ['Tab\tand\nline', 'tab and line']])('%j → %j', (a, b) => expect(normalizarRespuesta(a)).toBe(b));
});
describe('corregir', () => {
  it('opcion_multiple', () => {
    const e: Ejercicio = { ...base, tipo: 'opcion_multiple', opciones: ['a', 'b'], correcta: 1 };
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 1 })).toBe(true);
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 0 })).toBe(false);
  });
  it('completar acepta respuesta y aceptadas tras normalizar', () => {
    const e: Ejercicio = { ...base, tipo: 'completar', texto: 'I ___ it', respuesta: 'found', aceptadas: ['have found'] };
    expect(corregir(e, { tipo: 'completar', texto: ' Found ' })).toBe(true);
    expect(corregir(e, { tipo: 'completar', texto: 'have  found' })).toBe(true);
    expect(corregir(e, { tipo: 'completar', texto: 'find' })).toBe(false);
    expect(corregir(e, { tipo: 'completar', texto: '' })).toBe(false);
  });
  it('ordenar', () => {
    const e: Ejercicio = { ...base, tipo: 'ordenar', piezas: ['They', 'merge', 'it'] };
    expect(corregir(e, { tipo: 'ordenar', orden: ['They', 'merge', 'it'] })).toBe(true);
    expect(corregir(e, { tipo: 'ordenar', orden: ['merge', 'They', 'it'] })).toBe(false);
    expect(corregir(e, { tipo: 'ordenar', orden: ['They', 'merge'] })).toBe(false);
  });
  it('emparejar exige todos los pares', () => {
    const e: Ejercicio = { ...base, tipo: 'emparejar', pares: [{ a: 'x', b: '1' }, { a: 'y', b: '2' }, { a: 'z', b: '3' }] };
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '2', z: '3' } })).toBe(true);
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '3', z: '2' } })).toBe(false);
    expect(corregir(e, { tipo: 'emparejar', asignacion: { x: '1', y: '2' } })).toBe(false);
  });
  it('verdadero_falso', () => {
    const e: Ejercicio = { ...base, tipo: 'verdadero_falso', afirmacion: 'a', correcta: false };
    expect(corregir(e, { tipo: 'verdadero_falso', valor: false })).toBe(true);
  });
  it('respuesta de otro tipo es incorrecta', () => {
    const e: Ejercicio = { ...base, tipo: 'verdadero_falso', afirmacion: 'a', correcta: true };
    expect(corregir(e, { tipo: 'opcion_multiple', indice: 0 })).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar `corregir.ts`**

```ts
import type { Ejercicio } from '@/lib/contenido/esquema';

export type RespuestaUsuario =
  | { tipo: 'opcion_multiple'; indice: number }
  | { tipo: 'completar'; texto: string }
  | { tipo: 'ordenar'; orden: string[] }
  | { tipo: 'emparejar'; asignacion: Record<string, string> }
  | { tipo: 'verdadero_falso'; valor: boolean };

export const normalizarRespuesta = (s: string) => s.normalize('NFC').replace(/[’‘]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase();

export function corregir(e: Ejercicio, r: RespuestaUsuario): boolean {
  if (e.tipo !== r.tipo) return false;
  switch (e.tipo) {
    case 'opcion_multiple': return (r as { indice: number }).indice === e.correcta;
    case 'completar': {
      const t = normalizarRespuesta((r as { texto: string }).texto);
      return t.length > 0 && [e.respuesta, ...(e.aceptadas ?? [])].some((ok) => normalizarRespuesta(ok) === t);
    }
    case 'ordenar': {
      const o = (r as { orden: string[] }).orden;
      return o.length === e.piezas.length && o.every((p, i) => p === e.piezas[i]);
    }
    case 'emparejar': {
      const a = (r as { asignacion: Record<string, string> }).asignacion;
      return e.pares.every((p) => a[p.a] === p.b);
    }
    case 'verdadero_falso': return (r as { valor: boolean }).valor === e.correcta;
  }
}
```
Run → PASS.

- [ ] **Step 3: Tests de `barajar` (fallan)** — el bloque `cola-registro.test.ts` de abajo es la referencia que **A2** ya implementó; en B1 solo se escribe `barajar.test.ts`.

```ts
// barajar.test.ts
import { describe, it, expect } from 'vitest';
import { barajar } from './barajar';
describe('barajar', () => {
  const xs = ['a', 'b', 'c', 'd'];
  it('determinista por semilla', () => expect(barajar(xs, 's1')).toEqual(barajar(xs, 's1')));
  it('misma multiset', () => expect([...barajar(xs, 's2')].sort()).toEqual(xs));
  it('nunca devuelve el orden original con n ≥ 2', () => {
    for (const s of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) expect(barajar(['x', 'y'], s)).toEqual(['y', 'x']);
  });
  it('no muta la entrada', () => { const c = [...xs]; barajar(c, 'z'); expect(c).toEqual(xs); });
});
```
```ts
// cola-registro.test.ts
import { describe, it, expect, vi } from 'vitest';
import { crearColaRegistro } from './cola-registro';
describe('crearColaRegistro', () => {
  it('reintenta y no bloquea; avisa si falla tras los reintentos', async () => {
    vi.useFakeTimers();
    const enviar = vi.fn().mockRejectedValueOnce(new Error('neon dormido')).mockResolvedValueOnce({ ok: true });
    const onFallo = vi.fn();
    const cola = crearColaRegistro(enviar, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola.encolar({ id: 1 });
    await vi.runAllTimersAsync();
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(cola.pendientes()).toBe(0);
    expect(onFallo).not.toHaveBeenCalled();

    const siempreMal = vi.fn().mockResolvedValue({ ok: false });
    const cola2 = crearColaRegistro(siempreMal, { reintentos: 2, esperaMs: 100, onFalloPersistente: onFallo });
    cola2.encolar({ id: 2 });
    await vi.runAllTimersAsync();
    expect(siempreMal).toHaveBeenCalledTimes(3);
    expect(onFallo).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
  it('mantiene el orden de envío', async () => {
    const vistos: number[] = [];
    const cola = crearColaRegistro(async (x: number) => { vistos.push(x); return { ok: true }; });
    cola.encolar(1); cola.encolar(2); cola.encolar(3);
    await new Promise((r) => setTimeout(r, 10));
    expect(vistos).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 4: Implementar `barajar.ts`** (el bloque `cola-registro.ts` es el que crea A2)

```ts
// barajar.ts — Fisher-Yates con PRNG mulberry32 sembrado por hash de la semilla.
function hash(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function barajar<T>(items: readonly T[], semilla: string): T[] {
  const out = [...items]; const rnd = mulberry32(hash(semilla));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  if (out.length >= 2 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}
```
```ts
// cola-registro.ts
export function crearColaRegistro<T>(enviar: (x: T) => Promise<{ ok: boolean }>, opts: { reintentos?: number; esperaMs?: number; onFalloPersistente?: () => void } = {}) {
  const { reintentos = 3, esperaMs = 2000, onFalloPersistente } = opts;
  const cola: T[] = []; let activo = false;
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function procesar() {
    if (activo) return; activo = true;
    while (cola.length) {
      const x = cola[0]; let ok = false;
      for (let i = 0; i <= reintentos && !ok; i++) {
        if (i > 0) await dormir(esperaMs * i);
        ok = await enviar(x).then((r) => r.ok, () => false);
      }
      cola.shift();
      if (!ok) onFalloPersistente?.();
    }
    activo = false;
  }
  return { encolar(x: T) { cola.push(x); void procesar(); }, pendientes: () => cola.length };
}
```
Run → PASS.

- [ ] **Step 5: Componentes de ejercicio** (cliente). Reglas comunes de accesibilidad: cada ejercicio es un `<form>` con `<fieldset>`/`<legend>` = `enunciado`; botón «Comprobar» (deshabilitado sin respuesta); tras comprobar se muestra `<Feedback>` en una región `role="status"` (`aria-live="polite"`) con icono (`CircleCheck`/`CircleX`), texto «¡Correcto!» / «No es correcto» y la `explicacion`; si falla: botón «Intentar de nuevo» (limpia y devuelve el foco al primer control); si acierta: botón «Continuar» que recibe el foco.
  - `opcion-multiple.tsx`: radios nativos (`min-h-11`).
  - `completar.tsx`: muestra `texto` partido por `___` con un `<input>` en medio, `aria-label="Respuesta"`, `autoComplete="off"`, `autoCapitalize="none"`, `spellCheck={false}`; Enter comprueba.
  - `ordenar.tsx`: piezas barajadas con `barajar(piezas, id)`; dos listas: «Disponibles» (botones que añaden) y «Tu frase» (botones que quitan, `aria-label="Quitar «{pieza}»"`); comprobar con el orden construido.
  - `emparejar.tsx`: para cada `a`, un `<select>` con las `b` barajadas (`barajar(bs, id)`) y opción vacía «Elige…»; accesible con teclado sin arrastrar.
  - `verdadero-falso.tsx`: dos radios «Verdadero» / «Falso» con la `afirmacion` como texto.
  - `ejercicio.tsx`: `<Ejercicio ejercicio onComprobado={(correcta) => void} onContinuar={() => void} />` despacha por `tipo` y usa `corregir`.
  - `secuencia-ejercicios.tsx`:
```tsx
'use client';
import { useMemo, useState } from 'react';
import type { Ejercicio as TEjercicio } from '@/lib/contenido/esquema';
import { registrarRespuestaAction } from '@/app/(app)/_acciones/actions';
import { crearColaRegistro } from '@/lib/aprendizaje/cola-registro';
import { BarraProgreso } from '@/components/barra-progreso';
import { Ejercicio } from './ejercicio';

export function SecuenciaEjercicios({ ejercicios, onCompletada }: { ejercicios: TEjercicio[]; onCompletada: () => void }) {
  const [i, setI] = useState(0);
  const [aviso, setAviso] = useState(false);
  const cola = useMemo(() => crearColaRegistro(registrarRespuestaAction, { onFalloPersistente: () => setAviso(true) }), []);
  const e = ejercicios[i];
  return (
    <div className="flex flex-col gap-4">
      <BarraProgreso valor={(i / ejercicios.length) * 100} etiqueta={`Ejercicio ${i + 1} de ${ejercicios.length}`} />
      <p className="text-sm text-texto-suave">Ejercicio {i + 1} de {ejercicios.length}</p>
      <Ejercicio key={e.id} ejercicio={e}
        onComprobado={(correcta) => cola.encolar({ ejercicioId: e.id, correcta })}
        onContinuar={() => (i + 1 < ejercicios.length ? setI(i + 1) : onCompletada())} />
      {aviso && <p role="status" className="text-sm text-aviso">No pudimos guardar alguna respuesta. Tu avance en pantalla sigue; lo intentaremos de nuevo.</p>}
    </div>
  );
}
```

- [ ] **Step 6: Lectura y glosario tocable**

`palabra-glosario.tsx` (cliente): botón en línea (`<button type="button" aria-expanded aria-controls>` con subrayado punteado y fuente mono) que abre un panel: en móvil hoja inferior (`fixed inset-x-0 bottom-0`), en escritorio popover junto a la palabra. El panel es un `<div role="dialog" aria-modal="true" aria-labelledby>` con foco atrapado (primer y último elemento enlazados por Tab), Escape y clic fuera cierran y devuelven el foco a la palabra. Contenido: término, categoría, `traduccion_es`, `definicion_en`, `ejemplo_en` (en cursiva, `lang="en"`) y botón «Guardar en mi repaso» → `guardarTerminoAction({ termino: base, nivel })` → «Guardada» o «Ya estaba en tu repaso» (`nuevo: false`). Sin entrada en el glosario: «Sin traducción disponible» + guardar igualmente (EP6-HU01/02).
`lectura.tsx` (server-friendly: recibe datos y renderiza `segmentarLectura`): contenedor `lang="en"` con `bg-lectura-fondo text-lectura-texto`, `text-[18px] leading-[1.7] max-w-[68ch]`, cada `{tipo:'termino'}` → `<PalabraGlosario visible base entrada={glosario[base]} nivel />`.

- [ ] **Step 7: Página de lección** — `src/app/(app)/leccion/[id]/page.tsx`:

```tsx
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { getLeccion, glosarioPara, caminoDeNivel } from '@/lib/contenido/catalogo';
import { terminosDeLectura } from '@/lib/contenido/lectura';
import { estadoCamino } from '@/lib/contenido/camino';
import { itemsCompletados } from '@/lib/aprendizaje/progreso.repo';
import { FlujoLeccion } from './flujo-leccion';

export default async function LeccionPage({ params }: PageProps<'/leccion/[id]'>) {
  const u = await requireUser();
  const { id } = await params;
  const leccion = getLeccion(id);
  if (!leccion) notFound();
  const estado = estadoCamino(caminoDeNivel(leccion.nivel), await itemsCompletados(getDb(), u.userId, leccion.nivel)).items.find((i) => i.id === id)?.estado;
  if (estado === 'bloqueado') redirect(`/camino/${leccion.nivel}`);
  const terminos = [...terminosDeLectura(leccion.lectura), ...leccion.terminos];
  return <FlujoLeccion leccion={leccion} glosario={glosarioPara(leccion.nivel, leccion.tema, terminos)} yaCompletada={estado === 'hecho'} />;
}
```
`flujo-leccion.tsx` (cliente): pasos `lectura → video (si hay; «Saltar video» siempre visible) → ejercicios → resumen`. Encabezado con título, `objetivo` («Puedo…») y gramática. Al terminar la secuencia: `completarItemAction({ itemId })`; resumen con «Lección completada», términos añadidos al repaso y botones «Siguiente» (`/camino/<nivel>`) y «Repasar» (`/repaso`). Mover el foco al `<h2>` de cada paso al cambiar (`tabIndex={-1}` + `focus()`). `not-found.tsx`: «Esta lección no existe» + enlace a `/camino`.

- [ ] **Step 8: Camino** — `/camino` (niveles A1-C2 con `estadoNiveles` del SP1 y, para el nivel en curso, `% del nivel` de `estadoCamino`) con enlace a `/camino/<nivel>`; `/camino/[nivel]` valida `isNivel` (si no, `notFound()`), lista los items de `estadoCamino(caminoDeNivel(nivel), completados)` como `<ol>` con estado (hecho = `CircleCheck` + «Hecho», actual = resaltado + «Empezar», bloqueado = `Lock` + «Bloqueado», sin enlace; tramo = `Headphones` + «Escuchar»), `BarraProgreso` del nivel y frase «puedo…» de la lección actual. Si el nivel no tiene items: `<EstadoVacioNivel nivel />` (A3).

- [ ] **Step 9: Verificar y commit**

Run: `npm test && npm run lint && npm run typecheck && CONTENT_DEMO=1 npm run build` → OK.
Run: `CONTENT_DEMO=1 npm run dev` y completar `demo-01` en 360 px y 1366 px solo con teclado; comprobar en la BD que hay 1 fila en `progress` y tarjetas `commit`, `branch`, `merge` (+ las de ejercicios fallados).
```bash
git add -A
git commit -m "feat(leccion): motor de 5 ejercicios, glosario tocable, flujo de lección y camino"
```

---

### Task B2: Repaso Leitner

**Files:**
- Create: `src/lib/repaso/leitner.ts`, `src/lib/repaso/repaso.repo.ts`, `src/app/(app)/repaso/page.tsx`, `src/app/(app)/repaso/sesion-repaso.tsx`, `src/app/(app)/repaso/actions.ts`
- Test: `src/lib/repaso/leitner.test.ts`, `src/lib/repaso/repaso.int.test.ts`

**Interfaces:**
- Consumes: `tarjetas`, `respuestas` (A2), `registrarRespuesta` (A2), `bogota.ts` (A2), `buscarEntrada` (A1).
- Produces: `INTERVALOS_DIAS = [1,3,7,14,30]`, `type Caja = 1|2|3|4|5`, `siguienteEstado(caja: Caja, sabia: boolean, hoy: string): { caja: Caja; proximaDia: string }`, `MAX_SESION = 20`; repo `tarjetasPendientes(db, userId, now, limite = 20): Promise<{ termino: string; nivel: Nivel; caja: number }[]>` (más atrasadas primero), `responderTarjeta(db, userId, termino, nivel, sabia, now): Promise<{ caja: Caja } | null>`; acción `responderTarjetaAction(input: { termino: string; nivel: Nivel; sabia: boolean })`.

- [ ] **Step 1: Tests Leitner (fallan)**

```ts
import { describe, it, expect } from 'vitest';
import { siguienteEstado } from './leitner';

describe('siguienteEstado', () => {
  it.each([
    [1, true, 2, '2026-10-10'], [2, true, 3, '2026-10-14'], [3, true, 4, '2026-10-21'], [4, true, 5, '2026-11-06'], [5, true, 5, '2026-11-06'],
  ] as const)('caja %i + «La sabía» → caja %i', (caja, sabia, nueva, dia) => {
    expect(siguienteEstado(caja, sabia, '2026-10-07')).toEqual({ caja: nueva, proximaDia: dia });
  });
  it('«No la sabía» vuelve a caja 1 y mañana', () => expect(siguienteEstado(4, false, '2026-10-07')).toEqual({ caja: 1, proximaDia: '2026-10-08' }));
});
```

- [ ] **Step 2: Implementar `leitner.ts`**

```ts
import { sumarDias } from '@/lib/tiempo/bogota';

export const INTERVALOS_DIAS = [1, 3, 7, 14, 30] as const;
export const MAX_SESION = 20;
export type Caja = 1 | 2 | 3 | 4 | 5;
export function siguienteEstado(caja: Caja, sabia: boolean, hoy: string): { caja: Caja; proximaDia: string } {
  const nueva = (sabia ? Math.min(5, caja + 1) : 1) as Caja;
  return { caja: nueva, proximaDia: sumarDias(hoy, INTERVALOS_DIAS[nueva - 1]) };
}
```

- [ ] **Step 3: Tests de integración del repo (fallan)** — `repaso.int.test.ts`: (a) `tarjetasPendientes` devuelve solo las vencidas hoy o antes, ordenadas por `proxima_at` asc, máx. `limite`; (b) `responderTarjeta(…, true, now)` sube de caja, fija `proxima_at = inicioDia(proximaDia)`, `ultima_at = now`, `aciertos + 1` y registra en `respuestas` una fila `origen: 'repaso'`, `item_id = termino`, `caja` = caja **anterior**; (c) `false` → caja 1, `fallos + 1`; (d) tarjeta inexistente → `null` sin escribir.

```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, testPool, resetDb } from '@/lib/db/test-utils';
import { users, tarjetas, respuestas } from '@/lib/db/schema';
import { tarjetasPendientes, responderTarjeta } from './repaso.repo';

let userId: string;
const now = new Date('2026-10-07T15:00:00Z');
beforeEach(async () => {
  await resetDb();
  [{ id: userId }] = await testDb.insert(users).values({ alias: 'ana', passwordHash: 'x' }).returning({ id: users.id });
  await testDb.insert(tarjetas).values([
    { userId, termino: 'bug', nivel: 'A2', caja: 3, proximaAt: new Date('2026-10-01T05:00:00Z') },
    { userId, termino: 'fix', nivel: 'A2', caja: 1, proximaAt: new Date('2026-10-07T05:00:00Z') },
    { userId, termino: 'api', nivel: 'A2', caja: 1, proximaAt: new Date('2026-10-08T05:00:00Z') },
  ]);
});
afterAll(() => testPool.end());

describe('repaso', () => {
  it('pendientes: vencidas, más atrasadas primero, con límite', async () => {
    expect((await tarjetasPendientes(testDb, userId, now)).map((t) => t.termino)).toEqual(['bug', 'fix']);
    expect(await tarjetasPendientes(testDb, userId, now, 1)).toHaveLength(1);
  });
  it('«La sabía» sube de caja y registra la caja anterior', async () => {
    expect(await responderTarjeta(testDb, userId, 'bug', 'A2', true, now)).toEqual({ caja: 4 });
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect(t.proximaAt.toISOString()).toBe('2026-10-21T05:00:00.000Z');
    expect(t.aciertos).toBe(1);
    const [r] = await testDb.select().from(respuestas);
    expect([r.origen, r.itemId, r.caja, r.correcta]).toEqual(['repaso', 'bug', 3, true]);
  });
  it('«No la sabía» → caja 1 mañana', async () => {
    expect(await responderTarjeta(testDb, userId, 'bug', 'A2', false, now)).toEqual({ caja: 1 });
    const [t] = await testDb.select().from(tarjetas).where(eq(tarjetas.termino, 'bug'));
    expect([t.caja, t.fallos, t.proximaAt.toISOString()]).toEqual([1, 1, '2026-10-08T05:00:00.000Z']);
  });
  it('tarjeta inexistente → null', async () => {
    expect(await responderTarjeta(testDb, userId, 'nada', 'A2', true, now)).toBeNull();
    expect(await testDb.select().from(respuestas)).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Implementar `repaso.repo.ts`**

```ts
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { tarjetas, respuestas } from '@/lib/db/schema';
import type { Nivel } from '@/lib/progreso/niveles';
import { diaBogota, finDia, inicioDia } from '@/lib/tiempo/bogota';
import { MAX_SESION, siguienteEstado, type Caja } from './leitner';

export async function tarjetasPendientes(db: Db, userId: string, now: Date, limite = MAX_SESION) {
  return db.select({ termino: tarjetas.termino, nivel: tarjetas.nivel, caja: tarjetas.caja }).from(tarjetas)
    .where(and(eq(tarjetas.userId, userId), lte(tarjetas.proximaAt, finDia(diaBogota(now)))))
    .orderBy(asc(tarjetas.proximaAt)).limit(limite);
}

export async function responderTarjeta(db: Db, userId: string, termino: string, nivel: Nivel, sabia: boolean, now: Date): Promise<{ caja: Caja } | null> {
  return db.transaction(async (tx) => {
    const clave = and(eq(tarjetas.userId, userId), eq(tarjetas.termino, termino), eq(tarjetas.nivel, nivel));
    const [t] = await tx.select({ caja: tarjetas.caja }).from(tarjetas).where(clave).for('update');
    if (!t) return null;
    const sig = siguienteEstado(t.caja as Caja, sabia, diaBogota(now));
    await tx.update(tarjetas).set({
      caja: sig.caja, proximaAt: inicioDia(sig.proximaDia), ultimaAt: now,
      ...(sabia ? { aciertos: sql`${tarjetas.aciertos} + 1` } : { fallos: sql`${tarjetas.fallos} + 1` }),
    }).where(clave);
    await tx.insert(respuestas).values({ userId, itemId: termino, correcta: sabia, origen: 'repaso', caja: t.caja, at: now });
    return { caja: sig.caja };
  });
}
```
Run `npm run test:int` → PASS.

- [ ] **Step 5: Acción y página**

`repaso/actions.ts`:
```ts
'use server';
import { z } from 'zod';
import { getDb } from '@/lib/db/client';
import { requireUser } from '@/lib/auth/current-user';
import { NIVELES } from '@/lib/progreso/niveles';
import { responderTarjeta } from '@/lib/repaso/repaso.repo';

export async function responderTarjetaAction(input: { termino: string; nivel: string; sabia: boolean }) {
  const u = await requireUser();
  const p = z.object({ termino: z.string().max(60), nivel: z.enum(NIVELES), sabia: z.boolean() }).safeParse(input);
  if (!p.success) return { ok: false as const };
  const r = await responderTarjeta(getDb(), u.userId, p.data.termino, p.data.nivel, p.data.sabia, new Date());
  return r ? { ok: true as const, caja: r.caja } : { ok: false as const };
}
```
`repaso/page.tsx`: `requireUser`, `tarjetasPendientes`, enriquece cada una con `buscarEntrada(nivel, termino)` (puede faltar) y pasa la lista a `<SesionRepaso>`. Sin pendientes: «No tienes repasos pendientes hoy. ¡Bien!» + enlace a `/hoy`.
`sesion-repaso.tsx` (cliente): una tarjeta a la vez con contador «3 de 12»; muestra el término y su `ejemplo_en` (con el término resaltado, `lang="en"`) o solo el término si no hay entrada; botón «Mostrar respuesta» → revela `traduccion_es` y `definicion_en`; luego dos botones grandes «La sabía» / «No la sabía» (atajos visibles `Alt+1` / `Alt+2` no; usar Enter/Espacio sobre el botón enfocado: el foco va a «La sabía» al revelar). Cada respuesta se envía con `crearColaRegistro(responderTarjetaAction)` (de `@/lib/aprendizaje/cola-registro`, creado en A2). Al terminar: resumen «Sabías 9 de 12».

- [ ] **Step 6: Verificar y commit**

Run: `npm test && npm run test:int && npm run lint && npm run typecheck` → OK.
```bash
git add -A
git commit -m "feat(repaso): Leitner de 5 cajas, sesión de repaso y registro de respuestas"
```

---

### Task B3: Actividad, «Hoy», «Perfil» y meta diaria

**Files:**
- Create: `src/lib/security/origen.ts`, `src/app/api/actividad/route.ts`, `src/components/medidor-actividad.tsx`, `src/lib/avance/semana.ts`, `src/lib/avance/avance.repo.ts`, `src/app/(app)/hoy/page.tsx` (sustituye stub), `src/app/(app)/perfil/page.tsx` (sustituye stub), `src/app/(app)/perfil/actions.ts`, `src/lib/auth/guardas-api.test.ts`
- Modify: `src/app/(app)/layout.tsx` (montar `<MedidorActividad />`), `src/app/(app)/nivel-inicial/page.tsx`, `src/app/(app)/nivel-inicial/actions.ts`, `src/lib/progreso/repo.ts`
- Test: `src/lib/security/origen.test.ts`, `src/lib/avance/semana.test.ts`, `src/lib/avance/avance.int.test.ts`

**Interfaces:**
- Consumes: `sumarActividad`, `MAX_SEGUNDOS_DIA`, `contarPendientes`, `itemsCompletados`, `completadosEntre` (A2), `bogota.ts` (A2), `caminoDeNivel`, `estadoCamino`, `getLeccion` (A1), `COOKIE_TEMA`, `TEMAS_UI` (A3), `getCurrentUser` (SP1).
- Produces: `mismoOrigen(origin: string | null, secFetchSite: string | null, propio: string): boolean`; `resumenSemana(input: DatosSemana): ResumenSemana` (ver Step 3); `datosSemana(db, userId, now): Promise<DatosSemana>`; `tarjetasPorCaja(db, userId): Promise<Record<1|2|3|4|5, number>>`; `setMetaDiaria(db, userId, meta: 5|10|15)`; acciones `cambiarMetaAction(form: FormData)`, `cambiarTemaAction(form: FormData)`.

- [ ] **Step 1: Tests de `mismoOrigen` (fallan)**

```ts
import { describe, it, expect } from 'vitest';
import { mismoOrigen } from './origen';
const P = 'https://app-ingles-mauve.vercel.app';
describe('mismoOrigen', () => {
  it('Origin igual → sí', () => expect(mismoOrigen(P, null, P)).toBe(true));
  it('Origin distinto → no', () => expect(mismoOrigen('https://evil.example', 'cross-site', P)).toBe(false));
  it('sin Origin, Sec-Fetch-Site same-origin → sí (sendBeacon en algunos navegadores)', () => expect(mismoOrigen(null, 'same-origin', P)).toBe(true));
  it('sin Origin ni Sec-Fetch-Site → no', () => expect(mismoOrigen(null, null, P)).toBe(false));
  it('Origin "null" → no', () => expect(mismoOrigen('null', 'same-origin', P)).toBe(false));
});
```
Implementar:
```ts
export function mismoOrigen(origin: string | null, secFetchSite: string | null, propio: string): boolean {
  if (origin !== null) return origin === propio;
  return secFetchSite === 'same-origin';
}
```

- [ ] **Step 2: Route handler `src/app/api/actividad/route.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getDb } from '@/lib/db/client';
import { sumarActividad } from '@/lib/aprendizaje/actividad.repo';
import { diaBogota } from '@/lib/tiempo/bogota';
import { mismoOrigen } from '@/lib/security/origen';

const cuerpo = z.object({ segundos: z.number().int().min(1).max(600) });

export async function POST(req: NextRequest) {
  if (!mismoOrigen(req.headers.get('origin'), req.headers.get('sec-fetch-site'), req.nextUrl.origin)) {
    return NextResponse.json({ error: 'origen' }, { status: 403 });
  }
  const u = await getCurrentUser(); // sesión comprobada dentro del handler (el proxy solo mira la cookie)
  if (!u) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const p = cuerpo.safeParse(json);
  if (!p.success) return NextResponse.json({ error: 'datos' }, { status: 400 });
  await sumarActividad(getDb(), u.userId, diaBogota(new Date()), p.data.segundos);
  return new NextResponse(null, { status: 204 });
}
```
`src/lib/auth/guardas-api.test.ts`: recorre `src/app/api/**/route.ts` (excepto `salud/route.ts`) y exige `/\b(getCurrentUser|requireUser|requireAdmin)\(/`; además que la lista no esté vacía (al menos `actividad/route.ts`).
**Detrás de Vercel**, `req.nextUrl.origin` es el host público; si en preview difiere, comparar también con `process.env.APP_URL` cuando esté definido. Probarlo en la Fase C con el preview.

- [ ] **Step 3: Tests de `resumenSemana` (fallan)** — `src/lib/avance/semana.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { resumenSemana } from './semana';

const base = { hoy: '2026-10-07', actividad: [], repasos: [], consolidadasTotal: 0, leccionesSemana: 0, metaDiariaMin: 10 };
describe('resumenSemana', () => {
  it('7 días de lunes a domingo, futuros marcados', () => {
    const r = resumenSemana(base);
    expect(r.dias.map((d) => d.fecha)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(r.dias.map((d) => d.futuro)).toEqual([false, false, false, true, true, true, true]);
  });
  it('día activo con ≥ 60 s; minutos de la semana y de hoy', () => {
    const r = resumenSemana({ ...base, actividad: [{ fecha: '2026-10-05', segundos: 59 }, { fecha: '2026-10-06', segundos: 60 }, { fecha: '2026-10-07', segundos: 300 }] });
    expect(r.diasActivos).toBe(2);
    expect(r.minutosSemana).toBe(7);
    expect(r.minutosHoy).toBe(5);
    expect(r.metaHoyPct).toBe(50);
  });
  it('aciertos en repasos maduros = % «La sabía» con caja anterior ≥ 3; null si no hay', () => {
    expect(resumenSemana(base).aciertosMadurosPct).toBeNull();
    const r = resumenSemana({ ...base, repasos: [{ correcta: true, caja: 3 }, { correcta: false, caja: 4 }, { correcta: true, caja: 1 }] });
    expect(r.aciertosMadurosPct).toBe(50);
  });
  it('consolidadas nuevas = aciertos con caja anterior 3 (pasan a 4)', () => {
    const r = resumenSemana({ ...base, consolidadasTotal: 7, repasos: [{ correcta: true, caja: 3 }, { correcta: true, caja: 3 }, { correcta: false, caja: 3 }] });
    expect([r.consolidadasTotal, r.consolidadasNuevas]).toEqual([7, 2]);
  });
  it('meta de días: 5 y gracia de 2', () => expect([resumenSemana(base).metaDias, resumenSemana(base).diasGracia]).toEqual([5, 2]));
});
```

- [ ] **Step 4: Implementar `semana.ts`**

```ts
import { lunesDe, sumarDias } from '@/lib/tiempo/bogota';

export type DatosSemana = {
  hoy: string; metaDiariaMin: number;
  actividad: { fecha: string; segundos: number }[];
  repasos: { correcta: boolean; caja: number | null }[];
  consolidadasTotal: number; leccionesSemana: number;
};
export const SEGUNDOS_DIA_ACTIVO = 60;
export const META_DIAS = 5;

export function resumenSemana(d: DatosSemana) {
  const lunes = lunesDe(d.hoy);
  const seg = new Map(d.actividad.map((a) => [a.fecha, a.segundos]));
  const dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, activo: (seg.get(fecha) ?? 0) >= SEGUNDOS_DIA_ACTIVO, futuro: fecha > d.hoy };
  });
  const totalSeg = dias.reduce((s, x) => s + (seg.get(x.fecha) ?? 0), 0);
  const maduros = d.repasos.filter((r) => (r.caja ?? 0) >= 3);
  const minutosHoy = Math.floor((seg.get(d.hoy) ?? 0) / 60);
  return {
    dias,
    diasActivos: dias.filter((x) => x.activo).length,
    metaDias: META_DIAS, diasGracia: 7 - META_DIAS,
    minutosSemana: Math.floor(totalSeg / 60),
    minutosHoy,
    metaHoyPct: Math.min(100, Math.round((minutosHoy * 100) / d.metaDiariaMin)),
    aciertosMadurosPct: maduros.length ? Math.round((maduros.filter((r) => r.correcta).length * 100) / maduros.length) : null,
    consolidadasTotal: d.consolidadasTotal,
    consolidadasNuevas: d.repasos.filter((r) => r.correcta && r.caja === 3).length,
    leccionesSemana: d.leccionesSemana,
  };
}
export type ResumenSemana = ReturnType<typeof resumenSemana>;
```
Run → PASS.

- [ ] **Step 5: Repo de avance + test de integración** — `avance.repo.ts`:
  - `datosSemana(db, userId, now)`: `hoy = diaBogota(now)`, `lunes = lunesDe(hoy)`; `actividad` = filas de `actividad_diaria` con `fecha between lunes and sumarDias(lunes, 6)`; `repasos` = `respuestas` `origen = 'repaso'` con `at between inicioDia(lunes) and finDia(sumarDias(lunes, 6))` (columnas `correcta`, `caja`); `consolidadasTotal` = `count(tarjetas where caja >= 4)`; `leccionesSemana` = `completadosEntre(...)` del mismo rango; `metaDiariaMin` de `users`.
  - `tarjetasPorCaja(db, userId)` → `{1: n, …, 5: n}` (con ceros).
  - `setMetaDiaria(db, userId, meta)` en `src/lib/progreso/repo.ts`.
  `avance.int.test.ts`: inserta actividad del domingo anterior y de esta semana, respuestas de repaso de la semana pasada y de esta, y comprueba que `datosSemana` solo devuelve lo de la semana actual; `tarjetasPorCaja` con ceros; `setMetaDiaria` con 15.

- [ ] **Step 6: Medidor** — `src/components/medidor-actividad.tsx` (cliente, montado en `(app)/layout.tsx`):

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const RUTAS = [/^\/leccion\//, /^\/repaso$/, /^\/escuchar\/.+/];
const INACTIVO_MS = 60_000;
const ENVIO_MS = 120_000;

export function MedidorActividad() {
  const ruta = usePathname();
  const acumulado = useRef(0);
  const ultimaInteraccion = useRef(Date.now());
  const medir = RUTAS.some((r) => r.test(ruta));

  useEffect(() => {
    const enviar = (beacon: boolean) => {
      const segundos = Math.min(600, Math.round(acumulado.current));
      if (segundos < 1) return;
      acumulado.current = 0;
      const body = JSON.stringify({ segundos });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/actividad', new Blob([body], { type: 'application/json' }));
      else void fetch('/api/actividad', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
    };
    const tocar = () => { ultimaInteraccion.current = Date.now(); };
    const tic = setInterval(() => {
      if (medir && document.visibilityState === 'visible' && Date.now() - ultimaInteraccion.current < INACTIVO_MS) acumulado.current += 1;
    }, 1000);
    const lote = setInterval(() => enviar(false), ENVIO_MS);
    const alSalir = () => enviar(true);
    const eventos = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, tocar, { passive: true }));
    window.addEventListener('pagehide', alSalir);
    return () => { clearInterval(tic); clearInterval(lote); eventos.forEach((e) => window.removeEventListener(e, tocar)); window.removeEventListener('pagehide', alSalir); enviar(false); };
  }, [medir, ruta]);
  return null;
}
```
(Al cambiar de ruta — fin de un paso/página — el cleanup envía lo acumulado.)

- [ ] **Step 7: «Hoy»** — `src/app/(app)/hoy/page.tsx` (server): `requireUser`, `nivelInicial` obligatorio; en paralelo (`Promise.all`): `datosSemana`, `contarPendientes`, `itemsCompletados(nivel)`. Secciones (cada una `<Tarjeta>` con `<h2>`):
  1. **Meta de hoy:** `BarraProgreso` con `metaHoyPct`, texto «{minutosHoy} de {meta} min».
  2. **Tu semana:** 7 círculos L-D (`<ol aria-label="Días activos de esta semana">`, cada `<li>` con texto accesible «lunes: activo» / «sin actividad» / «pendiente») y «{diasActivos}/7 días · meta 5».
  3. **Métricas:** aciertos en repasos maduros («—» si `null`, con explicación corta), palabras consolidadas (total y «+N esta semana»), minutos de la semana.
  4. **Repaso:** «Tienes N palabras para repasar» + botón a `/repaso` (o «Sin repasos pendientes»).
  5. **Siguiente lección:** `estadoCamino(caminoDeNivel(nivel), completados).siguiente` → título, «puedo…» (`getLeccion(id).objetivo`) y botón «Empezar». Sin contenido en el nivel → `<EstadoVacioNivel nivel />` (A3). Nivel completado → «¡Completaste {nivel}!».
- [ ] **Step 8: «Perfil»** — `perfil/page.tsx`: alias; avance semanal detallado (las mismas métricas + lecciones esta semana); «Mi vocabulario»: `tarjetasPorCaja` como lista «Caja 1 (mañana): n…» y «Consolidadas (caja ≥ 4)»; formulario **Meta diaria** (radios 5/10/15 → `cambiarMetaAction`); formulario **Tema** (radios Claro/Oscuro/Sistema → `cambiarTemaAction`, que valida con `TEMAS_UI` y hace `(await cookies()).set(COOKIE_TEMA, v, { path: '/', sameSite: 'lax', secure: process.env.COOKIE_INSECURE !== 'true', httpOnly: true, maxAge: 31536000 })` y `revalidatePath('/', 'layout')`); `<EnlaceAdmin />` y botón **Salir** (ya movidos en A3). `perfil/actions.ts` solo exporta funciones async con `requireUser()` al inicio.
- [ ] **Step 9: Onboarding** — `/nivel-inicial` añade un segundo `<fieldset>` «¿Cuánto tiempo al día?» con radios 5/10/15 (10 por defecto); `nivelInicialAction` valida `meta` con zod (`z.coerce.number().pipe(z.union([z.literal(5), z.literal(10), z.literal(15)]))`) y llama también a `setMetaDiaria`.
- [ ] **Step 10: Verificar y commit**

Run: `npm test && npm run test:int && npm run lint && npm run typecheck` → OK.
Run (dev, sesión iniciada): `curl -i -X POST http://127.0.0.1:3000/api/actividad -H 'content-type: application/json' -d '{"segundos":30}'` sin cookie → 401; con `-H 'Origin: https://evil.example'` → 403; `{"segundos":601}` con cookie y Origin propio → 400.
```bash
git add -A
git commit -m "feat(avance): medidor de actividad, /api/actividad, Hoy, Perfil, meta diaria y tema"
```

---

### Task B4: Escuchar — tramos y 3 pasadas

**Files:**
- Create: `src/app/(app)/escuchar/page.tsx` (sustituye stub), `src/app/(app)/escuchar/[id]/page.tsx`, `src/app/(app)/escuchar/[id]/flujo-tramo.tsx`, `src/app/(app)/escuchar/[id]/not-found.tsx`
- Test: `src/lib/aprendizaje/pasadas.test.ts`, `src/lib/aprendizaje/pasadas.ts`

**Interfaces:**
- Consumes: `tramosDeNivel`, `getTramo`, `glosarioPara` (A1), `estadoCamino`, `caminoDeNivel` (A1), `itemsCompletados` (A2), `completarItemAction` (A2), `VideoFacade` con `api` y `onPlayer` (A4), `SecuenciaEjercicios`, `EstadoVacioNivel` (B1).
- Produces: `PASADAS = [{ n: 1, nombre: 'Escucha global', velocidad: 1, ayuda: false }, { n: 2, nombre: 'Con palabras clave', velocidad: 0.75, ayuda: true }, { n: 3, nombre: 'Sin ayuda', velocidad: 1, ayuda: false }]`, `siguientePaso(paso: Paso): Paso` con `Paso = 'pasada-1'|'pasada-2'|'pasada-3'|'preguntas'|'hecho'`.

- [ ] **Step 1: Test y lógica de pasos** — `pasadas.test.ts`: `siguientePaso('pasada-1') === 'pasada-2'`, … `'preguntas' → 'hecho'`, `'hecho' → 'hecho'`; `PASADAS[1].velocidad === 0.75`. Implementar en `pasadas.ts`.
- [ ] **Step 2: `/escuchar`** — lista de tramos del nivel del usuario (`tramosDeNivel`) con tema, título, canal, duración («{end-start} s») y estado (hecho / disponible). Sin tramos → `<EstadoVacioNivel nivel />`.
- [ ] **Step 3: `/escuchar/[id]`** — server: `requireUser`, `getTramo` o `notFound()`; pasa `tramo` y `glosarioPara(nivel, tema, palabrasClave)` a `<FlujoTramo>`.
- [ ] **Step 4: `flujo-tramo.tsx`** (cliente): pregunta guía siempre visible arriba. Para cada pasada, cabecera «Pasada {n} de 3: {nombre}», `<VideoFacade api video={tramo.fuente} onPlayer={(p) => { playerRef.current = p; p.setPlaybackRate(velocidad); }} />`; en la pasada 2 se listan las palabras clave con su traducción (`<dl>`), y si `playerRef` no llega (API no disponible) se muestra «Si puedes, baja la velocidad a 0,75 en el reproductor (⚙)». Botón «Siguiente pasada» siempre activo (no se puede verificar que se haya visto; no bloquear). Tras la 3.ª: `<SecuenciaEjercicios ejercicios={tramo.preguntas} onCompletada={…} />` → `completarItemAction({ itemId })` → «Tramo completado» + enlaces a `/escuchar` y `/camino/<nivel>`. Video no disponible → mensaje y se puede pasar directamente a las preguntas.
- [ ] **Step 5: Verificar y commit**

Run: `npm test && npm run lint && npm run typecheck`; `CONTENT_DEMO=1 npm run build && npm start` y completar `demo-t1` (comprobar 0,75x en la pasada 2 y que no hay iframe antes de pulsar).
```bash
git add -A
git commit -m "feat(escuchar): tramos de YouTube con 3 pasadas, 0,75x y preguntas"
```

---

### Tasks C1-C4: Contenido A2 por tema (una por tema: ia, qa, backend, frontend)

**Agente:** Sonnet. **No** escribe código. Un worktree por tema. Solo crea archivos en `content/a2/`.

**Files (ejemplo C2 = qa; sustituir el tema):**
- Create: `content/a2/glosario-qa.yaml`, `content/a2/a2-qa-01.yaml`, `content/a2/a2-qa-02.yaml`, `content/a2/a2-qa-t1.yaml`

**Interfaces:**
- Consumes: esquema y reglas de A1 (`src/lib/contenido/esquema.ts`, `reglas.ts`), ejemplo completo en `content/_demo/`, temario y videos en `docs/investigacion/sp2-contenido-a2.md` (§1.2, §2, §3), metodología en `docs/investigacion/sp2-metodologia.md`.
- Produces: 2 lecciones + 1 tramo + glosario del tema, válidos con `npm run content:build`, `revisado: false`.

**Asignación fija (decisión D3):**
| Tema | Lecciones (orden) | Tramo (orden, video) |
|---|---|---|
| C1 ia | `a2-ia-01` (1), `a2-ia-02` (2) | `a2-ia-t1` (3), `90TEhlBgL5U` (alt. `R44aOvXeKaU`) |
| C2 qa | `a2-qa-01` (4), `a2-qa-02` (5) | `a2-qa-t1` (6), `Ecu_7juyU0Q` (alt. `g0176p-SYP8`) |
| C3 backend | `a2-backend-01` (7), `a2-backend-02` (8) | `a2-backend-t1` (9), `6wb6Dph9AYM` (alt. `-0MmWEYR2a8`) |
| C4 frontend | `a2-frontend-01` (10), `a2-frontend-02` (11) | `a2-frontend-t1` (12), `GicRMTSelys` (alt. `gPsCJy4T67M`) |

Videos de lección: el primero de la lista de §3.1 para cada lección, con un `start`/`end` de 40-90 s que el agente elige leyendo el título/duración (anotar en el informe que el fragmento exacto lo valida la revisión).

- [ ] **Step 1:** Leer el esquema, las reglas, `content/_demo/*.yaml` y las secciones del temario de su tema.
- [ ] **Step 2: Glosario** `glosario-<tema>.yaml`: todas las palabras del vocabulario del temario de sus 2 lecciones + las palabras clave del tramo + toda palabra marcada `[[…]]` en las lecturas. `termino` en forma base y minúsculas («found» → entrada `find`; en la lectura `[[found|find]]`). `definicion_en` en inglés A2 (≤ 15 palabras), `ejemplo_en` técnico y corto, `traduccion_es` natural para Colombia/España neutra.
- [ ] **Step 3: Lecciones** según §2 del temario: `lectura` de 120-180 palabras, A2, con 8-12 marcas `[[…]]`; `objetivo` «Puedo…» en español; `gramatica` del §1.2; `terminos` 5-8 términos clave; **6-8 ejercicios cubriendo al menos 4 de los 5 tipos**, ids `<leccion>-e1…`, `explicacion` breve en español que enseña (no solo «correcto»), `terminos[]` en los ejercicios de vocabulario. Inglés natural, técnicamente exacto. Prohibido copiar textos de terceros.
- [ ] **Step 4: Tramo** `a2-<tema>-t1.yaml`: `fuente` con el video asignado y un fragmento de 60-120 s; `preguntaGuia` en inglés simple; 3-5 `palabrasClave`; 3-5 `preguntas` (`verdadero_falso`/`opcion_multiple`) que se respondan **solo** con el fragmento. Si el agente no puede ver el video, basar las preguntas en el título y la descripción oEmbed y marcar en el informe «preguntas por verificar contra el video».
- [ ] **Step 5: Validar:** `npm run content:build` → sin errores (avisos de `revisado: false` esperados). `npm run content:check-videos` → sin videos caídos.
- [ ] **Step 6: Commit:** `git add content/a2 && git commit -m "content(a2): lecciones, tramo y glosario de <tema>"`.

---

### Task D1: E2E del SP2 (Playwright + BDD, `CONTENT_DEMO=1`)

**Files:**
- Create: `tests/features/aprendizaje/leccion.feature`, `tests/features/aprendizaje/repaso.feature`, `tests/features/aprendizaje/escuchar.feature`, `tests/features/aprendizaje/glosario.feature`, `tests/features/aprendizaje/preferencias.feature`, `tests/steps/aprendizaje.steps.ts`, `tests/pages/leccion.page.ts`, `tests/pages/repaso.page.ts`, `tests/pages/escuchar.page.ts`, `tests/pages/hoy.page.ts`, `tests/api/actividad.spec.ts`
- Modify: `tests/fixtures/index.ts`, `tests/pages/niveles.page.ts`, `tests/steps/niveles.steps.ts`, `tests/features/niveles/mapa.feature`, `tests/data/local/rutas.yaml`, `tests/data/preview/rutas.yaml`, `tests/api/cabeceras.spec.ts`

**Interfaces:**
- Consumes: todas las pantallas (A3-B4) y la demo (A1). Los selectores usan roles y textos accesibles (nada de `data-testid` salvo que no haya alternativa).

- [ ] **Step 1: Ajustar lo existente** — tras elegir nivel se llega a `/hoy` (`niveles.titulo()` → heading «Hoy»); `mapa.feature` pasa a `/camino` (A1 «Omitido», A2 «En curso», B1 «Bloqueado»); `salir()` navega primero a «Perfil»; `rutas.yaml` (local y preview) añade como protegidas `/hoy`, `/camino`, `/camino/A2`, `/leccion/demo-01` (solo local), `/repaso`, `/escuchar`, `/perfil` (`pagina`) y `/api/actividad` (`api`).
- [ ] **Step 2: Escenarios** (español, `# language: es`):
  - `leccion.feature` `@smoke @responsive`: completar `demo-01` de punta a punta (lectura → «Saltar video» → 5 ejercicios, fallando uno a propósito y reintentando → resumen «Lección completada»); después `/camino/A2` muestra `demo-01` como «Hecho»; `/hoy` muestra «palabras para repasar» ≥ 0 y sin scroll horizontal; axe sin violaciones graves. `@a11y` variante solo teclado (Tab/Espacio/Enter) en 1366.
  - **Privacidad (RNF-PRI-01):** en la lección, `page.locator('iframe')` cuenta 0 y no hubo peticiones a `youtube` antes de pulsar «Reproducir video»; tras pulsar existe `iframe[src^="https://www.youtube-nocookie.com/embed/"]`. (Registrar peticiones con `page.on('request')`.)
  - `glosario.feature`: tocar «commit» → diálogo con «confirmación (commit)»; Escape cierra y el foco vuelve a la palabra; «Guardar en mi repaso» → «Guardada»; repetir → «Ya estaba en tu repaso».
  - `repaso.feature`: tras completar la lección, `/repaso` muestra «No tienes repasos pendientes hoy» (las tarjetas nuevas vencen mañana) y `/perfil` muestra las palabras en «Caja 1». No se añaden rutas de test a la app para forzar tarjetas vencidas: la lógica de cajas y vencimientos la cubren los tests de integración de B2.
  - `escuchar.feature`: `/escuchar` lista `demo-t1`; completar las 3 pasadas (con «Siguiente pasada») y las 3 preguntas → «Tramo completado».
  - `preferencias.feature`: en Perfil elegir «Oscuro» → `html[data-theme="dark"]`; recargar → persiste; meta diaria 15 → `/hoy` muestra «de 15 min».
  - Nivel sin contenido: cuenta nueva elige «B1» → `/hoy` y `/camino/B1` muestran «El contenido de B1 llega pronto».
- [ ] **Step 3: API** — `tests/api/actividad.spec.ts`: sin cookie → 401; con cookie de sesión (storage del setup) y `Origin` ajeno → 403; `{ segundos: 0 }` → 400; `{ segundos: 30 }` → 204. `cabeceras.spec.ts`: la CSP contiene `frame-src https://www.youtube-nocookie.com` y `img-src 'self' data: https://i.ytimg.com`.
- [ ] **Step 4: Ejecutar** el stack E2E local (como en `ci.yml`, job `e2e`): `docker compose -f docker-compose.yml -f tests/docker-compose.yml up -d --build --wait web` y `… run --rm --build tests` → todo verde. Adjuntar el resumen al informe.
- [ ] **Step 5: Commit** — `test(e2e): flujos del SP2 (lección, glosario, escuchar, preferencias, actividad)`.

---

### Task Q: Fase C — calidad, revisión y despliegue (la orquesta el controlador)

- [ ] **Q1. Revisión de contenido (Opus):** por cada archivo de `content/a2/`: inglés natural A2, exactitud técnica, ejercicios con una única respuesta correcta, `explicacion` útil, preguntas de tramo que se respondan con el fragmento; corregir en una rama `fix/sp2-contenido`.
- [ ] **Q2. Muestreo del usuario:** 2 lecciones + 1 tramo elegidos por el usuario en el entorno local (`npm run dev`). Si aprueba → poner `revisado: true` en todo `content/a2/` (commit `content(a2): revisado por Opus y muestreo del usuario`). Si no → corregir y repetir.
- [ ] **Q3. Revisión final de código (Opus)** de todo el diff `be4ce04..main` con `requesting-code-review` → ola de fixes de **todo** lo Important (decisión 2026-10-06).
- [ ] **Q4. `auditor-seguridad-web`** (estática + checklist) → fixes.
- [ ] **Q5. `verificador`:** `npm run lint`, `typecheck`, `test`, `test:int`, `CONTENIDO_ESTRICTO=1 npm run build`, `content:check-videos`, E2E Docker, presupuesto JS (tamaño de los chunks de `/leccion/[id]` en la salida de `next build` ≤ 200 KB) y prueba manual en celular (lección, video, repaso).
- [ ] **Q6. Push a `main`** (con aprobación del usuario) → `ci` → `deploy.yml`: preview → puerta (E2E `test:preview` + ZAP) → producción con aprobación del environment. Verificar en producción con `verificador`.
- [ ] **Q7. Vault:** `estado.md`, `pendientes.md`, `decisiones.md` (D1-D3 de este plan), bitácora del día; actualizar `~/.claude/skills/disenador-ui-accesible/tokens.md` con los tokens «Terminal Calma».
