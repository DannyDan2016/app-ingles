# SP3 — Evaluaciones y paso de nivel

- **Fecha:** 2026-10-13 · **Estado:** borrador para revisión del usuario · Plan: pendiente
- **Depende de:** SP2 en producción (`67961fc`), contenido A2 `revisado: true`; contenido B1 en preparación (rama `content/b1`).
- **Insumos:** [requisitos](../../requisitos.md) (EP7-HU01, HU02, HU03; §5 MVP; P4), [spec SP2](2026-10-07-sp2-contenido-design.md), [temario B1/B2](../../investigacion/contenido-b1-b2.md).

## 1. Objetivo y criterio de éxito

Cerrar el ciclo **estudiar → practicar → evaluar → desbloquear**. Un alumno que completó todas las lecciones de su nivel presenta una evaluación de 20 preguntas corregida en el servidor; si saca ≥ 80 % el nivel queda «Aprobado» y el siguiente pasa a «En curso»; si no, ve qué bloques reforzar, hace un refuerzo y puede reintentar al día siguiente con preguntas distintas.

**Éxito:** en celular y PC, un usuario A2 con las 8 lecciones hechas presenta la evaluación, la deja a medias, la retoma, la envía y ve su nota por bloque con cada fallo explicado. Aprobando, el Camino muestra A2 «Aprobado» y B1 «En curso». Suspendiendo, hace el refuerzo, espera 24 h y el nuevo intento tiene al menos 10 de 20 preguntas distintas. Bancos A2 y B1 publicados con `revisado: true`.

## 2. Alcance

**Incluye:** banco de preguntas por nivel (YAML compilado `server-only`), campo `bloque` en los ejercicios de práctica, 2 tablas nuevas, módulo `src/lib/evaluacion/`, server actions, pantallas de evaluación, resultado y refuerzo, tarjeta en Camino, aviso en Hoy, historial en Perfil; bancos **A2 y B1**.

**Fuera (YAGNI):**
| Qué | Motivo / dónde |
|---|---|
| Cronómetro | Decisión del usuario: sin límite de tiempo, reanudable |
| Certificado descargable, ranking | Sin valor para el objetivo; gamificación limitada (SP2 §3) |
| Evaluación de nivelación inicial | Todos empiezan en A2 (decisión 2026-10-13) |
| Banco B2 | Llega con el contenido B2 (siguiente ola) |
| Importar progreso | Descartado: cada usuario usa un solo dispositivo (2026-10-13) |
| Entrevistas / speaking | SP4 |

## 3. Decisiones del brainstorming (2026-10-13)

| # | Decisión |
|---|---|
| E1 | Entre un suspenso y el reintento: **24 h + refuerzo obligatorio** de los bloques flojos. |
| E2 | Refuerzo = 10-15 ejercicios de práctica de las lecciones del nivel de los bloques < 80 %, corregidos en el cliente, **sin nota mínima**. |
| E3 | **Sin cronómetro, reanudable**: cada respuesta se guarda en el servidor; el intento caduca a las 48 h y cuenta como no presentado. Sin feedback hasta el final. |
| E4 | Lectura y listening con **material inédito** (textos y fragmentos de YouTube no usados en lecciones ni tramos). |
| E5 | Arquitectura **A**: intento materializado en el servidor (descartadas: formularios fijos A/B y token firmado sin estado). |
| E6 | Reglas heredadas: ≥ 80 % para aprobar; 100 % de lecciones del nivel para presentar; 4 bloques; 20 preguntas de un banco de 40; ≥ 50 % distintas al reintentar; corrección en el servidor. |

## 4. Arquitectura

```
content/<nivel>/evaluacion-<nivel>.yaml ─(prebuild: zod + reglas + oEmbed en CI)─► src/content/generado/*.ts (server-only)
                                                                                     │
/evaluacion/[nivel] (server components) ◄── server actions ── src/lib/evaluacion/ ◄──┘
      │ iniciar · guardarRespuesta · finalizar · completarRefuerzo
      ▼
Neon: evaluacion_intentos · evaluacion_respuestas   (→ niveles aprobados → estadoNiveles())
```

El banco con las soluciones nunca sale del servidor. El cliente solo recibe el enunciado y las opciones de la pregunta actual; la respuesta correcta y la explicación llegan únicamente en el resultado de un intento terminado.

## 5. Modelo de contenido

### 5.1 `evaluacion` (un archivo por nivel: `content/<nivel>/evaluacion-<nivel>.yaml`)

```yaml
tipo: evaluacion
nivel: A2
revisado: false
recursos:
  - id: a2-ev-l1          # lectura inédita, longitud del nivel (A2 100-150, B1 180-250 palabras)
    tipo: lectura
    titulo: "..."
    texto: "..."
  - id: a2-ev-v1          # fragmento de YouTube inédito, 60-120 s
    tipo: video
    fuente: { id: "...", start: 30, end: 120 }
preguntas:                # exactamente 40: 10 por bloque
  - id: a2-ev-q01
    bloque: lectura       # lectura | listening | vocabulario | gramatica
    recurso: a2-ev-l1     # obligatorio en lectura y listening; prohibido en los otros bloques
    tipo: opcion_multiple # uno de los 5 tipos de ejercicio del SP2 (mismos campos)
    # ...campos del tipo
    explicacion: "..."    # español; se muestra en el resultado si se falla
```

### 5.2 Reglas nuevas del compilador
- Exactamente 10 preguntas por bloque; IDs únicos con prefijo `<nivel>-ev-`.
- Lectura y listening: 2-3 recursos por bloque, cada recurso con ≥ 4 preguntas; toda referencia `recurso` existe y su tipo coincide con el bloque.
- Ningún video del banco aparece en lecciones ni tramos (de ningún nivel).
- Nivel del archivo = carpeta (regla ya existente en `fix/deuda-sp2`).
- Con `VERCEL=1`, `revisado: true` obligatorio (igual que lecciones).
- `content:check-videos` incluye los videos del banco.

### 5.3 Campo `bloque` en ejercicios de práctica
Campo **opcional** `bloque` en `ejercicioSchema` para que el refuerzo filtre con exactitud. Regla por defecto si falta: ejercicios con `terminos[]` → vocabulario; `completar`/`ordenar` → gramática; preguntas de tramos → listening; resto → lectura. Se etiqueta explícitamente el contenido A2 y B1 donde la regla por defecto no acierte.

### 5.4 Producción de los bancos
Como en el SP2: subagentes Sonnet redactan (uno por bloque en paralelo), revisión Opus, muestreo del usuario (1 lectura + 1 listening + 5 preguntas sueltas) → `revisado: true`. Videos verificados con oEmbed; fragmentos y preguntas de listening validados contra el video por el usuario.

## 6. Datos (migración nueva)

| Tabla | Columnas |
|---|---|
| `evaluacion_intentos` | `id uuid pk`, `user_id → users (cascade)`, `nivel nivel`, `estado` (`en_curso`·`aprobado`·`suspendido`·`caducado`), `preguntas text[]` (20 IDs en orden), `iniciado_at`, `terminado_at null`, `nota smallint null` (0-100), `nota_lectura`, `nota_listening`, `nota_vocabulario`, `nota_gramatica` (`smallint null`), `refuerzo_completado_at null` |
| `evaluacion_respuestas` | `intento_id → evaluacion_intentos (cascade)`, `pregunta_id text`, `respuesta text` (JSON validado con zod por tipo), `respondida_at`; PK (`intento_id`, `pregunta_id`) |

- Índice único parcial `(user_id, nivel) WHERE estado = 'en_curso'`: un solo intento abierto por usuario y nivel.
- Índice `(user_id, nivel, iniciado_at desc)` para el último intento.
- CHECKs: notas entre 0 y 100; `terminado_at` no nulo si el estado es `aprobado`/`suspendido`.
- **Niveles aprobados** = `select distinct nivel ... where estado = 'aprobado'` → `estadoNiveles({ nivelInicial, aprobados })` (sin cambios en `users`).
- `admin:reset-avance` y la exportación de progreso incluyen las tablas nuevas.

## 7. Lógica (`src/lib/evaluacion/`)

### 7.1 `elegibilidad(estado) → resultado`
Pura. Resultados: `bloqueado_nivel` · `faltan_lecciones(n)` · `reanudar(intentoId)` · `espera(hasta)` · `falta_refuerzo(intentoId, bloques)` · `aprobado(intentoId)` · `puede`.
Orden: nivel no «En curso» → `bloqueado_nivel` (salvo aprobado); intento `en_curso` vigente → `reanudar`; lecciones del nivel < 100 % → `faltan_lecciones`; último intento `suspendido` sin refuerzo → `falta_refuerzo`; con refuerzo pero < 24 h desde `terminado_at` → `espera`; si no → `puede`.

### 7.2 `seleccionar(banco, anterior, rng) → ids[20]`
5 preguntas por bloque. Prioriza las que no estaban en el intento anterior (con 10 por bloque y 5 usadas, siempre hay 5 nuevas por bloque → 100 % distintas si el banco está completo; el mínimo exigido es 10 de 20). Las preguntas que comparten recurso se eligen por recurso (se toma el recurso y sus preguntas hasta completar 5) y salen juntas. Aleatoriedad con `crypto.getRandomValues` (inyectable en tests).

### 7.3 `corregir(ejercicio, respuesta) → boolean`
Se extrae la corrección de la práctica a un módulo puro compartido (práctica en cliente y examen en servidor usan el mismo código). Normalización igual que la práctica (`aceptadas`, mayúsculas, espacios, apóstrofo tipográfico).

### 7.4 Nota
Por bloque = aciertos/5 × 100. Global = aciertos/20 × 100 (equivale a la media de bloques). Aprueba con ≥ 80 (16/20). Bloque «a reforzar» si < 80 (< 4/5).

### 7.5 Server actions (todas con `requireUser`; verifican propiedad del intento)
| Acción | Comportamiento |
|---|---|
| `iniciarEvaluacion(nivel)` | Calcula elegibilidad; si `puede`, crea el intento en transacción. Si choca con el índice único, devuelve el intento abierto. |
| `guardarRespuesta(intentoId, preguntaId, respuesta)` | Exige intento propio, `en_curso`, no caducado y pregunta perteneciente al intento; valida la forma con zod; upsert. No devuelve si acertó. |
| `finalizarEvaluacion(intentoId)` | Exige 20 respuestas; corrige, guarda notas y estado. Idempotente: si ya terminó, devuelve el resultado guardado. |
| `completarRefuerzo(intentoId)` | Intento propio y `suspendido`; fija `refuerzo_completado_at` (idempotente). |

### 7.6 Caducidad
Perezosa: al leer un intento `en_curso` con `iniciado_at` + 48 h < ahora, se marca `caducado` (no exige espera ni refuerzo). Si una pregunta del intento ya no existe en el banco (deploy nuevo), el intento se marca `caducado` y se avisa. Sin cron.

### 7.7 Refuerzo
`armarRefuerzo(catalogo, nivel, bloques)` → 12 ejercicios de práctica (repartidos entre los bloques flojos; si un bloque no tiene suficientes, se completa con los demás flojos). Corrección en el cliente como en las lecciones; al terminar se llama a `completarRefuerzo`. Sin persistencia de respuestas del refuerzo.

## 8. Pantallas

| Ruta / lugar | Contenido |
|---|---|
| Camino `/camino/[nivel]` | Tarjeta «Evaluación de <nivel>» al final con el estado de §7.1: faltan N lecciones (barra, botón desactivado) · Empezar · Continuar (n/20, «Caduca el …») · Refuerzo pendiente · «Podrás reintentar desde …» · Aprobado con X % |
| Hoy | Aviso cuando la evaluación está disponible o hay un intento a medias |
| `/evaluacion/[nivel]` | Intro (reglas en 4 líneas, sin feedback hasta el final) → pregunta n/20 → revisión (respondidas/pendientes) → Enviar con confirmación |
| `/evaluacion/[nivel]/resultado/[intentoId]` | Nota global y por bloque (color + icono + texto); cada fallo con tu respuesta, la correcta y la explicación; aprobado → «B1 desbloqueado» y botón al Camino; suspendido → «Hacer el refuerzo» |
| `/evaluacion/[nivel]/refuerzo` | 12 ejercicios con corrección inmediata; al final «Podrás reintentar desde …» |
| Perfil | Historial de evaluaciones: fecha, nivel, nota, estado |

- Preguntas: reutilizan los componentes de ejercicio del SP2 en **modo examen** (sin corrección inmediata). Lectura con estilo «tono B» y glosario tocable desactivado. Listening con el reproductor facade del SP2 (0,75x permitido).
- Anterior/Siguiente; se puede cambiar una respuesta hasta enviar. Barra de progreso por bloque.
- Guardado con la cola de reintentos del SP2 (`crearColaRegistro`) y aviso discreto; «Enviar» se bloquea hasta que las 20 estén confirmadas por el servidor.
- Accesibilidad (reglas del SP2): objetivos ≥ 44 px, feedback color + icono + texto, `prefers-reduced-motion`, foco al enunciado al cambiar de pregunta, sin sonidos, sin scroll horizontal de 360 a 1920 px.
- Nivel bloqueado → redirige al Camino con mensaje (nunca 404). Aprobar un nivel sin contenido publicado → estado vacío existente «El contenido de <nivel> llega pronto».

## 9. Errores y casos límite

| Caso | Comportamiento |
|---|---|
| Dos pestañas pulsan «Empezar» | El índice único deja un intento; la segunda lo reanuda |
| Doble envío / recarga en el resultado | `finalizarEvaluacion` idempotente |
| Neon en frío o red caída al guardar | Cola de reintentos + aviso; «Enviar» bloqueado hasta confirmar las 20 |
| Pregunta ajena al intento, intento ajeno o terminado | Error tipado; nada se guarda |
| Intento > 48 h | `caducado`; «Caducó, puedes empezar otro» |
| Banco cambiado con intento abierto | `caducado` + aviso; nunca 500 |
| 24 h | Horas reales desde `terminado_at`; se muestra en hora de Bogotá |

## 10. Seguridad
- Soluciones y explicaciones solo en módulos `server-only`; test que comprueba que el HTML/payload de una pregunta en curso no contiene la respuesta correcta ni la explicación.
- Toda `page.tsx` y action nueva llama a `requireUser()` (test de guardas existente); rutas nuevas en `tests/data/*/rutas.yaml`.
- Validación zod de cada respuesta por tipo; tamaño máximo de respuesta (≤ 500 caracteres).
- El rate limit de `/api/actividad` (deuda SP2) no aplica; las actions de evaluación están acotadas por la propia lógica (20 preguntas, un intento abierto).

## 11. Ejecución en paralelo (para el plan)
- **Ola A (código):** esquema + reglas del banco y campo `bloque`; migración + repo; `corregir` compartido; `seleccionar` + `elegibilidad` + nota; actions; pantallas; refuerzo; Camino/Hoy/Perfil.
- **Ola B (contenido, en paralelo a A):** banco A2 (4 redactores, uno por bloque), etiquetado `bloque` de A2 y B1, banco de demo para E2E; luego banco B1.
- **Ola C:** E2E, revisión final Opus, `auditor-seguridad-web` + ZAP, E2E Docker, deploy y `verificador` en producción.

## 12. Pruebas (criterio del usuario, 2026-10-13: happy path + seguridad importante)

La app es para aprender inglés, no un proyecto de QA: no se prueban todos los casos límite de §9 (se implementan, pero sin test dedicado salvo los de seguridad).

- **Happy path (unit + 1 E2E):**
  - Unit: `seleccionar` devuelve 5 por bloque y ≥ 10 distintas del intento anterior; `corregir` acierta los 5 tipos; nota y bloques a reforzar.
  - E2E (banco de demo, `CONTENT_DEMO=1`): completar lecciones → presentar → aprobar → el siguiente nivel queda «En curso»; y suspender → refuerzo → reintento.
- **Seguridad (obligatorio):**
  - Sin sesión: rutas nuevas en `tests/data/*/rutas.yaml` (401/redirect); test de guardas exige `requireUser` en `page.tsx` y actions nuevas.
  - Nadie toma control de otro intento: integración que comprueba que no se puede responder ni finalizar un intento ajeno.
  - Sin soluciones en el cliente: el payload/HTML de una pregunta en curso no contiene la respuesta correcta ni la explicación.
  - Se mantienen las puertas existentes: `check:no-pc`, gitleaks, npm audit, cabeceras/CSP, ZAP sobre la preview, `auditor-seguridad-web`.
- **Puerta de salida:** revisión final Opus, E2E en Docker (suite existente + los nuevos) y `verificador` en producción.

## 13. Riesgos
| Riesgo | Mitigación |
|---|---|
| Videos inéditos de nivel adecuado difíciles de encontrar | Temario B1/B2 ya trae candidatos verificados por oEmbed; el usuario valida fragmentos |
| Preguntas de listening no contrastadas con el audio | Muestreo obligatorio del usuario antes de `revisado: true` |
| Cambio de banco con intentos abiertos | Caducidad + aviso (§7.6) |
| Límite de sesión de Claude en olas paralelas | Máx. 4-5 agentes por ola; ledger SDD para retomar |
