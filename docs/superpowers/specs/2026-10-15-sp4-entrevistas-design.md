# SP4 — Entrevistas: banco de preguntas y shadowing con video

- **Fecha:** 2026-10-15 · **Estado:** borrador, pendiente de revisión del usuario
- **Depende de:** SP3 y B2 en producción (`75caa9e`).
- **Insumos:** [requisitos](../../requisitos.md) EP9-HU01/HU02 (entrevistas) y EP8 (speaking), reducidos por decisión del usuario (§3).
- **Enfoque:** spec corto de flujo feliz. Pruebas solo de happy path + seguridad importante.

## 1. Objetivo y criterio de éxito

Preparar entrevistas técnicas en inglés. La práctica oral la hace el usuario con otra persona (habla inglés y sabe de desarrollo); la app aporta **qué preguntan y cómo responder**, y **shadowing con video** para entrenar oído y ritmo.

**Éxito:** en celular y PC, entro en «Entrevistas», filtro por QA y B2, abro una pregunta y veo la respuesta modelo, las estructuras para armar la mía y el vocabulario. En la pestaña «Shadowing» abro un set, escucho cada frase del video (se para sola), leo el texto si lo necesito y la repito en voz alta.

## 2. Alcance

**Incluye:** tipos de contenido `entrevista` y `shadowing` (YAML validado, `server-only`), sección «Entrevistas» con banco filtrable y detalle, pestaña «Shadowing» con lista y detalle, 54 preguntas y 5 sets de shadowing.

**Fuera (YAGNI):**
| Qué | Motivo |
|---|---|
| Grabar voz, micrófono, transcripción, evaluar pronunciación | Decisión del usuario 2026-10-15: quitar complejidad; habla con otra persona |
| Shadowing con grabación (EP8-HU02 original) | Igual; el shadowing es solo escuchar y repetir en voz alta |
| Temporizador, marcar practicadas, progreso | No aporta al objetivo |
| Cambios en `Permissions-Policy` | El micrófono sigue bloqueado |

## 3. Decisiones (brainstorming 2026-10-15)

| # | Decisión |
|---|---|
| D1 | Sin grabación ni evaluación de voz en la app |
| D2 | Cada pregunta: respuesta modelo + 4–6 estructuras + vocabulario con traducción |
| D3 | Banco inicial: 4 preguntas por rol (ia, qa, backend, frontend) y nivel (A2, B1, B2) = 48 + 6 generales (rol `general`, nivel B1) = 54 |
| D4 | Shadowing dentro de Entrevistas, con videos reales de entrevistas técnicas: 5 sets (general + 4 roles) de 6 frases, nivel B1/B2 |
| D5 | Cada frase = tramo `start`/`end` del video con el `VideoFacade` existente (youtube-nocookie; se para solo al final). Reutiliza lo que ya usa Escuchar; sin cambios de CSP |
| D6 | Todo el material visible sin depender del nivel del usuario (es de consulta); protegido por sesión |

## 4. Diseño

### 4.1 Esquemas (`src/lib/contenido/esquema.ts`)
- `entrevistaSchema`: `tipo: 'entrevista'`, `id`, `rol` (`general|ia|qa|backend|frontend`), `nivel` (A2|B1|B2), `pregunta`, `respuesta` (texto en inglés al nivel de la pregunta), `estructuras` (4–6 textos), `vocabulario` (1–8 `{ termino, traduccion }`), `revisado`.
- `shadowingSchema`: `tipo: 'shadowing'`, `id`, `rol`, `nivel` (B1|B2), `titulo`, `video` (`youtubeId`, `titulo`, `canal`), `frases` (exactamente 6 `{ texto, traduccion, start, end }`, `end > start`, ≤ 15 s por frase), `revisado`.
- Las reglas del compilador (`reglas.ts`) los incorporan al catálogo con las mismas validaciones que el resto: ids únicos, `revisado: true` obligatorio en modo estricto, videos incluidos en `content:check-videos`.
- Ubicación: `content/entrevistas/preguntas-<rol>.yaml` (lista de preguntas por rol) y `content/entrevistas/shadowing-<rol>.yaml`. Contenido demo mínimo para E2E en `content/_demo/`.

### 4.2 Pantallas
- **`/entrevistas`** (server component): pestañas «Preguntas» y «Shadowing». En «Preguntas», filtros por rol y nivel como enlaces con query (`?rol=qa&nivel=B2`), validados contra listas cerradas (valor desconocido = sin filtro). Lista de preguntas filtradas; sin resultados: «Aún no hay preguntas para este filtro».
- **`/entrevistas/[id]`**: pregunta, «Respuesta modelo», «Estructuras para tu respuesta», «Vocabulario». Id desconocido → 404.
- **`/entrevistas/shadowing`**: lista de sets (rol, nivel, título).
- **`/entrevistas/shadowing/[id]`** (componente cliente mínimo para la frase actual): video de la frase actual con el `VideoFacade` existente (`src/components/video-facade.tsx`, youtube-nocookie, `start`/`end`; cambiar de frase cambia el tramo con `key` para reiniciar el embed), botones «Escuchar frase» (carga/reinicia el tramo), «Mostrar texto»/«Ocultar texto», «Anterior», «Siguiente», indicador «Frase N de 6», texto y traducción. Atribución del video (título y canal).
- **Navegación:** 5ª sección «Entrevistas» (icono de lucide-react ya instalado), atajo `Alt+5`.
- Accesibilidad con la skill `disenador-ui-accesible` (táctil ≥ 44 px, foco visible, 360 px).

### 4.3 Seguridad
- Rutas nuevas bajo el grupo `(app)`: sesión con `requireUser`; sin rutas públicas nuevas ni APIs nuevas.
- Contenido solo en el servidor (catálogo `server-only`); los YAML no se sirven.
- Sin cambios de CSP, `Permissions-Policy` ni dependencias. `check:no-pc` aplica al contenido nuevo.

### 4.4 Contenido
- **Preguntas:** redacción (Sonnet) siguiendo D2/D3 → revisión Opus → muestreo del usuario (2 preguntas por rol) → `revisado: true`.
- **Shadowing:** búsqueda de videos reales de entrevistas técnicas en inglés (Claude; verificación oEmbed; título/canal sin patrones de `check:no-pc`), frases y tiempos desde subtítulos públicos (solo lectura, sin descargar video ni instalar herramientas) → revisión Opus → muestreo del usuario (los 5 sets, tiempos de frase) → `revisado: true`.

## 5. Pruebas (happy path + seguridad)
- **Unit:** esquemas `entrevista` y `shadowing` aceptan un ejemplo válido; el filtro de preguntas por rol/nivel devuelve solo coincidencias.
- **E2E:** filtrar «QA» + «B2» y abrir una pregunta (ve respuesta modelo y estructuras); abrir un set de shadowing y avanzar a la frase 2.
- **Seguridad:** `/entrevistas`, `/entrevistas/<id>`, `/entrevistas/shadowing` y `/entrevistas/shadowing/<id>` sin sesión → `/login` (añadir a `rutas.yaml` local y preview); test estático de guardas del grupo `(app)` sigue en verde.
- **Puertas existentes:** check:no-pc, gitleaks, npm audit, E2E Docker, ZAP en la puerta del deploy, verificador en producción.
