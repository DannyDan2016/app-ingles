# SP2 — Contenido, aprendizaje y rediseño («Duolingo para devs»)

- **Fecha:** 2026-10-07 · **Estado:** propuesto (pendiente de revisión del usuario)
- **Depende de:** SP1 en producción (`be4ce04`).
- **Insumos:** [requisitos](../../requisitos.md) (EP5, EP6, EP11, §5-§7), [contenido A2](../../investigacion/sp2-contenido-a2.md), [metodología](../../investigacion/sp2-metodologia.md), [UX y podcasts](../../investigacion/sp2-ux-podcasts.md), [mockups](../../diseno/sp2-direcciones-visuales.html).

## 1. Objetivo y criterio de éxito

Convertir la base del SP1 en una app de aprendizaje real para profesionales de tecnología: se aprende inglés **y** desarrollo a la vez (CLIL/ESP), con un bucle corto estilo Duolingo pero con tono profesional.

**Éxito:** desde el celular y el PC, un usuario A2 abre «Hoy», hace una lección completa (lectura → video → ejercicios → resumen), la ve completada, su % de nivel sube, sus palabras entran al repaso espaciado y su avance semanal se actualiza. Las 8 lecciones y 4 tramos A2 están publicados con `revisado: true`.

## 2. Alcance

**Incluye:** rediseño visual completo (dirección A «Terminal Calma» + tono cálido de B en lectura), navegación nueva, motor de lecciones con 5 tipos de ejercicio, glosario propio con palabras tocables, repaso espaciado Leitner, dashboard de avance semanal, podcasts/listening por tramos de YouTube, contenido A2 (8 lecciones + 4 tramos + glosario), validación de contenido en CI.

**Fuera (va después):**
| Qué | Dónde |
|---|---|
| Evaluación de paso de nivel, simulacros de entrevista, speaking | SP3 |
| Recordatorios (.ics/push), PWA | SP4/SP5 |
| Diccionario completo FreeDict | Cuando entren B1+ |
| Niveles distintos de A2 | Olas posteriores (4 agentes por tema + revisión) |
| Sonidos, ligas, vidas, mascota | Descartados (ver §9) |
| Audio por RSS | Descartado: abriría la CSP a hosts de terceros |

## 3. Base pedagógica (lo que guía cada decisión)

Con evidencia fuerte: **práctica de recuperación** (ejercicios y tarjetas antes que releer), **repetición espaciada**, **feedback inmediato con explicación**, **sesiones cortas diarias** (meta 5/10/15 min). Con evidencia moderada y encaje alto: **CLIL/ESP** (contenido técnico real como vehículo del idioma), input comprensible + producción. El «método Harvard» para idiomas no existe como tal: no se usa esa marca. Gamificación solo donde hay evidencia: racha semanal con días de gracia. Las cifras de los papers no se muestran en la app sin verificarlas (la investigación no pudo abrir los textos completos).

## 4. Arquitectura

```
content/a2/*.yaml ──(prebuild: zod + reglas + oEmbed en CI)──► src/content/generado/*.ts (server-only)
                                                                 │
App Router (server components) ◄─────────────────────────────────┘
      │ respuestas · repasos · tiempo (server actions / POST /api/actividad)
      ▼
Neon: progress · respuestas · tarjetas · actividad_diaria
```

- El contenido vive en el repo (versionado, revisable por diff) y se compila en el build a módulos con `import 'server-only'`. Nunca se sirve como archivo estático: las rutas siguen protegidas por sesión. Publicar contenido = push + pipeline.
- En Neon solo hay datos del usuario. Leer una lección no consulta la BD.
- YAML inválido **rompe el build**; nunca falla en ejecución.

## 5. Modelo de contenido

Directorio `content/<nivel>/`, un archivo por unidad. IDs estables: el progreso y las tarjetas los referencian, así que un ID publicado no se renombra.

### 5.1 `leccion`
```yaml
tipo: leccion
id: a2-qa-01              # <nivel>-<tema>-<nn>
nivel: A2
tema: qa                  # ia | qa | backend | frontend
orden: 3                  # posición en el camino del nivel
titulo: A Bug in the Login Page
objetivo: Puedo describir un bug y los pasos para reproducirlo.   # «puedo…» (español)
gramatica: Past simple (regular e irregular)
lectura: |
  Yesterday I [[tested]] the [[login]] page. I typed my [[password]] and ...
video: { youtubeId: Ecu_7juyU0Q, start: 20, end: 80, titulo: "…", canal: "…" }   # opcional
terminos: [bug, login, password, report, fix]   # términos clave → repaso al completar
ejercicios: [ ... ]       # 5-8, ver 5.4
revisado: false
```
`[[palabra]]` marca una palabra tocable; su forma base debe existir en el glosario (alias permitidos: `[[tested|test]]`).

### 5.2 `tramo` (podcast / listening)
```yaml
tipo: tramo
id: a2-qa-t1
nivel: A2
tema: qa
orden: 4
fuente: { podcast: "…", youtubeId: Ecu_7juyU0Q, start: 20, end: 80, titulo: "…", canal: "…" }
preguntaGuia: What does a good bug report need first?
palabrasClave: [steps, expected, actual]     # deben existir en el glosario
preguntas: [ ... ]        # 3-5, ejercicios de 5.4 (normalmente opcion_multiple / verdadero_falso)
revisado: false
```
Sin transcripciones copiadas de terceros: solo preguntas y palabras clave propias.

### 5.3 `glosario`
`content/<nivel>/glosario-<tema>.yaml` con `entradas[]`: `termino` (forma base, minúsculas), `categoria` (noun|verb|adjective|adverb|phrase), `traduccion_es`, `definicion_en` (adecuada al nivel), `ejemplo_en` (frase técnica), `nivel`, `tema`. Unicidad global de `termino` por nivel.

### 5.4 Ejercicios (unión discriminada por `tipo`)
Campos comunes: `id` (único global, p. ej. `a2-qa-01-e3`), `enunciado`, `explicacion` (breve, en español), `terminos[]` (opcional, entran al repaso si se falla).

| tipo | Campos propios |
|---|---|
| `opcion_multiple` | `opciones[]` (2-4), `correcta` (índice) |
| `completar` | `texto` con un único `___`, `respuesta`, `aceptadas[]` (opcional) |
| `ordenar` | `piezas[]` (orden correcto; la UI las baraja) |
| `emparejar` | `pares[]` de `{ a, b }` (3-5) |
| `verdadero_falso` | `afirmacion`, `correcta` (bool) |

### 5.5 Reglas de validación (CI y prebuild)
1. Esquema zod de cada tipo; error con archivo y ruta del campo.
2. IDs únicos (lecciones, tramos, ejercicios); `orden` único por nivel.
3. Todo `[[término]]`, `terminos[]` y `palabrasClave[]` existe en el glosario del nivel.
4. `start < end`, tramo de 30-120 s.
5. En `main` (y en el build de Vercel) todo lo de `content/<nivel>/` debe tener `revisado: true`; en ramas se permite `false` con aviso. `content/_demo/` está exento porque nunca se publica.
6. Script `content:check-videos`: oEmbed de cada `youtubeId` (200 = OK) en CI y en un workflow semanal programado (`schedule`) que abre un issue si un video cae.

## 6. Datos del usuario (migración nueva)

| Tabla | Columnas | Uso |
|---|---|---|
| `progress` (existe) | user_id, nivel, leccion_id, completada_at | lección o tramo completado (una vez) |
| `respuestas` | id, user_id, item_id, correcta, origen (`leccion`/`tramo`/`repaso`), caja (si repaso), at | precisión y métricas |
| `tarjetas` | user_id, termino, nivel, caja (1-5), proxima_at, ultima_at, aciertos, fallos — PK (user_id, termino, nivel) | cola Leitner |
| `actividad_diaria` | user_id, fecha (día en America/Bogota), segundos — PK (user_id, fecha) | días activos y minutos |
| `users` (+ columnas) | meta_diaria_min (5/10/15, def. 10) | meta diaria |

Índices: `respuestas(user_id, at)`, `tarjetas(user_id, proxima_at)`. Todas con `ON DELETE CASCADE` desde `users`.

## 7. Pantallas y navegación

- **Móvil:** barra inferior de 4 pestañas con icono + etiqueta: **Hoy · Camino · Escuchar · Perfil**. **Escritorio (≥1024 px):** barra lateral con las mismas secciones y atajos de teclado. «Entrevista» se añade en el SP3 (sin pestañas vacías).
- Iconos: `lucide-react` (tree-shaking, solo los usados).

| Ruta | Contenido |
|---|---|
| `/hoy` (`/` redirige) | meta diaria con barra, semana (días activos/gracia), 3 métricas (aciertos en repasos maduros, palabras consolidadas, minutos), tarjeta de repaso pendiente, siguiente lección |
| `/camino` | niveles A1-C2 con estado (reemplaza `/niveles`, que redirige 308) |
| `/camino/[nivel]` | camino de lecciones y tramos (hecho / actual / bloqueado), frase «puedo…» y % del nivel |
| `/leccion/[id]` | pasos: lectura (tono cálido) → video (facade) → ejercicios uno a uno con barra → resumen → completada |
| `/repaso` | sesión Leitner (máx. 20): término en su frase → recordar → revelar → «La sabía / No la sabía» |
| `/escuchar`, `/escuchar/[id]` | lista de tramos; 3 pasadas: global → con palabras clave a 0,75x → sin ayuda → preguntas |
| `/perfil` | avance semanal detallado, mi vocabulario (cajas), meta diaria, tema claro/oscuro/sistema, Invitaciones (admin), Salir |
| `/nivel-inicial` | onboarding: nivel + meta diaria |

**Glosario tocable:** popover/hoja inferior accesible (botón con `aria-expanded`, foco atrapado, Escape cierra) con traducción, categoría, definición, ejemplo y «Guardar en mi repaso». Palabra sin entrada → «Sin traducción disponible» + guardar igualmente (EP6-HU01/02).

**Video (facade):** miniatura de `i.ytimg.com` + botón; el iframe `youtube-nocookie.com/embed/<id>?start&end&rel=0` se monta solo al pulsar. La velocidad 0,75x de los tramos usa la IFrame API cargada tras el clic. Si el video no está disponible: «Video no disponible» y el paso se puede saltar.

## 8. Diseño visual

- **Dirección A «Terminal Calma»** (tokens con contraste AA verificado en `docs/investigacion/sp2-ux-podcasts.md` §2.5): fondo `#FFFFFF`/`#0B1220`, superficie `#F1F5F9`/`#131C2E`, texto `#0F172A`/`#E2E8F0`, secundario `#475569`/`#94A3B8`, primario `#0F766E` (texto blanco) / `#2DD4BF` (texto `#04201D`), acierto `#15803D`/`#4ADE80`, error `#B91C1C`/`#F87171`.
- **Pantalla de lectura con tono B:** fondo `#FAFAF7`/`#141418`, texto `#1F2937`/`#ECECF1`, interlineado 1,7, ancho máx. ~68 caracteres, tamaño base 18 px.
- Fuente del sistema; `ui-monospace` / Cascadia / JetBrains Mono (si está instalada, sin descargar fuentes) para código y términos.
- Tema de 3 estados (claro/oscuro/sistema) en cookie `tema` → el servidor pone `data-theme` en `<html>` (sin parpadeo).
- Reglas: feedback = color + icono + texto; animaciones cortas y nulas con `prefers-reduced-motion`; sin sonidos; objetivos táctiles de 44 px; sin scroll horizontal de 360 a 1920 px; microcopy en español profesional, sin infantilizar.
- Implementación guiada por la skill `disenador-ui-accesible` (actualizar su `tokens.md` con estos valores).

## 9. Lógica

### 9.1 Ejercicios y lecciones
- Corrección **en el cliente** (feedback instantáneo aun con Neon despertando). Cada respuesta se registra en segundo plano (server action con `requireUser`); si falla, se reintenta y se muestra un aviso discreto sin bloquear.
- `completar`: se compara tras normalizar (trim, espacios colapsados, minúsculas, apóstrofos `’`→`'`) contra `respuesta` y `aceptadas[]`.
- Fallo → se puede reintentar; los `terminos[]` del ejercicio entran al repaso.
- Lección/tramo **completado** cuando todos sus ejercicios terminan en acierto. Se registra una vez (idempotente).
- Camino **lineal** por `orden`: se desbloquea al completar el anterior; lo hecho se puede repetir. % del nivel = completados / total.
- Las evaluaciones del SP3 sí se corregirán en el servidor.

### 9.2 Leitner
- Cajas 1-5, intervalos 1, 3, 7, 14, 30 días. «La sabía» → caja +1 (máx. 5); «No la sabía» → caja 1, `proxima_at` = mañana.
- Entran tarjetas (caja 1, sin duplicar): `terminos[]` al completar una lección, «Guardar» desde el glosario y términos de ejercicios fallados.
- Pendientes = `proxima_at` ≤ fin del día de hoy. Sesión de máx. 20, las más atrasadas primero.
- **Consolidada** = caja ≥ 4.

### 9.3 Avance semanal (lunes-domingo, America/Bogota)
- **Día activo** = ≥ 60 s de práctica. Meta: 5 días/semana (2 de gracia). Se muestra «4/7 días».
- **Minutos:** tiempo con la pestaña visible y actividad en los últimos 60 s en lección, repaso o escuchar. Se envía al terminar cada paso y en `pagehide` (`navigator.sendBeacon`) a `POST /api/actividad` con `requireUser`, zod y tope de 600 s por envío y 4 h por día.
- **Aciertos en repasos maduros** = % de «La sabía» esta semana en tarjetas de caja ≥ 3 (retención ≥ 7 días).
- **Palabras consolidadas** (total y nuevas esta semana) y **lecciones completadas** esta semana.
- Zona horaria fija `America/Bogota` (supuesto: usuarios en Colombia; si cambia, pasa a preferencia del usuario).

### 9.4 Errores
| Situación | Comportamiento |
|---|---|
| Neon en arranque en frío | skeleton de `loading.tsx` |
| Falla registrar respuesta/actividad | reintento en segundo plano, aviso discreto |
| Video caído o sin embebido | «Video no disponible», paso saltable |
| ID inexistente | 404 propio |
| YAML inválido | falla el build |
| `/api/actividad` sin sesión / datos fuera de rango | 401 / 400 |

## 10. Seguridad

- Se mantiene: toda `page` y server action de `(app)` llama a `requireUser`/`requireAdmin` (test estático existente); todo route handler nuevo (`/api/actividad`) también, dentro del handler.
- CSP: `frame-src https://www.youtube-nocookie.com`, `img-src 'self' data: https://i.ytimg.com`, `script-src` + IFrame API de YouTube solo tras el clic (`https://www.youtube.com/iframe_api` y sus scripts: revisar con nonce/`strict-dynamic`). Nunca COEP. Tests de cabeceras actualizados.
- El contenido es `server-only`; no hay archivos de contenido en `public/`.
- `POST /api/actividad`: misma-origen (comprobación de `Origin`), zod, topes; cuenta para el rate limit general si abusa.
- `auditor-seguridad-web` + ZAP antes del deploy.

## 11. Ejecución en paralelo

**Fase A — base y contratos (secuencial; 1 agente Sonnet + revisión):** esquema zod y pipeline de contenido con todas las reglas de §5.5 y el workflow semanal; tokens, tema, shell de navegación y componentes base (`Tarjeta`, `BarraProgreso`, `Boton`, `VideoFacade`) con la apertura de CSP; migración de §6; redirecciones `/niveles`→`/camino`; **lección «golden» `demo-01` + tramo + glosario de ejemplo** en `content/_demo/`, completos y válidos: referencia para los agentes de contenido y datos de los tests. `content/_demo/` solo se compila con `CONTENT_DEMO=1` (E2E local en Docker y tests); el build de Vercel nunca lo incluye (test que lo comprueba). La puerta E2E del preview hace humo con la primera lección real del camino A2.

**Fase B — en paralelo (un worktree por pista):**
| Pista | Agente | Entrega |
|---|---|---|
| B1 | Sonnet + TDD | motor de lección: lectura + glosario tocable, video, 5 ejercicios, resumen, progreso, desbloqueo, `/camino` |
| B2 | Sonnet + TDD | Leitner: tarjetas, `/repaso`, guardar desde glosario |
| B3 | Sonnet + TDD | actividad (`/api/actividad`, medidor de tiempo), `/hoy`, `/perfil`, meta diaria en onboarding |
| B4 | Sonnet + TDD | `/escuchar`: tramos y 3 pasadas |
| C1-C4 | Sonnet ×4 | contenido A2 por tema (IA, QA, backend, frontend): 2 lecciones + glosario del tema + 1 tramo, según [temario](../../investigacion/sp2-contenido-a2.md) y videos verificados; `revisado: false` |

Orden de merge: A → B1 → B2/B3/B4 → C1-C4. Cada pista tiene revisión propia antes del merge.

**Fase C — calidad:** revisión del contenido por Opus (inglés natural, nivel A2, exactitud técnica, preguntas de tramo que se responden con el fragmento del video) y corrección → **muestreo del usuario** (2 lecciones + 1 tramo; si aprueba, se marca todo `revisado: true`) → revisión final de código (Opus) → ola de fixes de todo lo Important → `auditor-seguridad-web` → `verificador` → deploy con aprobación.

## 12. Testing y QA

- **Unit (TDD):** esquemas y reglas de contenido (incluidos casos inválidos), normalización de `completar`, Leitner (transiciones y fechas en America/Bogota), métricas semanales, desbloqueo, topes de actividad.
- **Integración:** repositorios de `respuestas`, `tarjetas`, `actividad_diaria`, `progress` (BD `_test`).
- **E2E (Playwright + BDD en español, Docker, con `CONTENT_DEMO=1`):** completar la lección golden de punta a punta en 360 y 1366 px; repaso Leitner; tramo con 3 pasadas; glosario (encontrada / sin traducción / guardar sin duplicar); tema claro/oscuro persistente; ejercicio solo con teclado; axe sin violaciones serias en las páginas nuevas; **el iframe de YouTube no existe hasta pulsar** (privacidad, RNF-PRI-01); cabeceras CSP nuevas; `/api/actividad` 401 sin sesión.
- **Contenido en CI:** validación completa + oEmbed; build falla en `main` si hay `revisado: false`.
- **Manual:** muestreo del contenido; prueba en celular real (lección completa, video, repaso); exploratoria de 30 min con notas.

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Videos técnicos reales suelen ser B1-B2 | tramos cortos, pregunta guía, palabras clave, 0,75x; Opus valida que el fragmento sea abordable |
| Videos que desaparecen | oEmbed en CI + revisión semanal + «Video no disponible» |
| Inglés o exactitud técnica incorrectos en contenido generado | revisión Opus + muestreo del usuario + `revisado` obligatorio |
| Conflictos entre pistas paralelas | Fase A congela contratos y shell; worktrees; orden de merge fijo |
| La IFrame API de YouTube choca con la CSP estricta | spike corto en Fase A; si no encaja, 0,75x solo con el control nativo del reproductor |
| Presupuesto de JS (≤ 200 KB) | server components por defecto; cliente solo en ejercicio, glosario, repaso y medidor; `lucide-react` por icono |
