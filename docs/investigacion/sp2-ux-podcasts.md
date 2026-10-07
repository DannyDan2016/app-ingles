# Investigación UX y podcasts para app-ingles

Fecha: 2026-10-06. Método: conocimiento de producto de las apps citadas (no se re-verificó cada una en vivo), más verificación en vivo de canales de YouTube, feeds RSS y oEmbed (curl, sin claves). Los contrastes de las paletas están calculados con la fórmula WCAG 2.x.

## 1. Resumen ejecutivo

- El patrón Duolingo que más rinde es el bucle corto: ejercicio, feedback inmediato, progreso visible, cierre con resumen. Para adultos se mantiene el bucle y se baja el tono: sin mascota infantil, sin culpa por perder racha, sonido opcional y apagado por defecto.
- La barra inferior recomendada para móvil tiene 5 pestañas: Hoy, Camino, Entrevista, Escuchar y Perfil. El repaso de vocabulario va dentro de Hoy, como tarjeta destacada y pestaña interna, para no sobrecargar la barra.
- Dirección visual recomendada: **A "Terminal Calma"**, teal sobre neutros fríos. Es sobria y tiene buen contraste. Es el mejor compromiso entre profesional y motivadora, y la más barata en rendimiento (solo CSS, sin imágenes pesadas).
- Para coste 0 y rendimiento, la tipografía debe ser la del sistema para el texto (`system-ui`) y una sola mono opcional (JetBrains Mono, auto-hospedada con `next/font`, solo 1 peso) para código y términos técnicos.
- La tabla lista 27 entradas (podcasts y canales de vídeo). 24 tienen al menos un ID de YouTube con oEmbed 200 y autor comprobado; 15 tienen RSS público con HTTP 200 y `<enclosure>`. Pendientes: feed de Test Guild (404), RSS de Software Engineering Daily (403 por Cloudflare con curl), A/B Testing (sin verificar), JS Party y Stack Overflow (sin ID de YouTube).
- Recomendación de embebido: YouTube con `youtube-nocookie.com` y facade (miniatura propia más clic) es la opción principal. El audio del RSS es un respaldo opcional con consentimiento explícito, porque el `<audio>` conecta directamente con hosts de terceros (Megaphone, Substack, op3.dev, etc.) que no están en la lista de terceros permitidos.
- Pedagogía: para aprendices A2-B1, tramos de 30 a 90 s con start/end, transcripción propia (o la oficial enlazada), preguntas guía antes de escuchar, velocidad 0,75x y repetición en tres pasadas.

## 2. Parte 1: UX/UI de referencia

### 2.1 Patrones de Duolingo y su adaptación adulta

| Patrón | Por qué funciona | Adaptación profesional |
|---|---|---|
| Camino de lecciones (nodos en zigzag) y unidades | Un "siguiente paso" evidente reduce la fatiga de decidir | Camino vertical más compacto y alineado a la izquierda, con nodos que muestran un icono y no un personaje. Cada unidad lleva un título de escenario real ("Daily stand-up", "Reportar un bug") |
| Feedback inmediato (sonido, animación) | Cierra el ciclo de refuerzo en menos de 1 s | Microanimación de 150 a 200 ms, sonido discreto desactivado por defecto, mensaje breve con la regla ("Usa *which* para cosas, no *who*") |
| Racha | Fuerte motor de hábito | "Días activos esta semana" (L M X J V) en vez de un contador que se rompe. Se permiten 2 días de gracia a la semana |
| XP | Medición de esfuerzo | Llamarlo "Minutos de práctica" o "Puntos de práctica". XP puede quedarse como número discreto, sin ligas competitivas (≤20 usuarios) |
| Metas diarias | Compromiso pequeño | Meta de 5, 10 o 15 min, elegida por el usuario, con recordatorio opcional |
| Barra inferior | Alcanzable con el pulgar | 5 pestañas con icono y etiqueta siempre visibles (nunca solo icono) |
| Corazones y vidas | Fricción | **No adoptar.** Es adverso para adultos con poco tiempo |

Principios de tono adulto: respeto por el tiempo del usuario ("5 min bastan"), contenido que se parece a su trabajo, sin infantilizar, errores explicados en una frase y sin castigo.

### 2.2 Comparativa de referentes

| Referente | Qué copiar | Qué evitar |
|---|---|---|
| Duolingo | Bucle de ejercicios, barra de progreso, camino, celebraciones breves | Gamificación agresiva, vidas, mascota protagonista |
| Busuu | Revisión con feedback de hablantes nativos, planes de estudio por objetivo | Dependencia de comunidad (aquí no aplica con ≤20 usuarios) |
| Babbel | Diálogos realistas, explicaciones gramaticales cortas, repaso inteligente | Interfaz algo plana |
| Speak | Práctica conversacional guiada, enfoque de adulto | Requiere IA/voz, fuera de alcance (sin LLM) |
| ELSA Speak | Puntuación de pronunciación por fonema | Requiere motor de voz, fuera de alcance |
| Brilliant | Interacción por manipulación, explicaciones visuales, tono sobrio para adultos | Contenido muy curado a mano |
| Codecademy | Lección dividida en teoría, ejercicio y verificación; mapa de progreso | Muro de pago |
| Exercism | Estética limpia de dev, insignias sobrias, tracks por tema | Poca gamificación; sirve como ejemplo de tono |
| Linear / Raycast | Estética dev: neutros, tipografía nítida, atajos de teclado, modo oscuro cuidado | Exceso de minimalismo puede resultar frío para aprender |

### 2.3 Wireframes de las pantallas clave en móvil (ASCII, 360 px)

**1. Inicio / Hoy (dashboard semanal)**

```
+------------------------------------+
| Buenos días, Danny        [ajustes]|
|                                    |
| Esta semana                        |
|  L   M   X   J   V   S   D         |
| [x] [x] [x] [ ] [ ] [ ] [ ]        |
| 3 de 5 días activos  · 42 min      |
|                                    |
| Meta de hoy: 10 min                |
| [=========-----------]  6/10 min   |
|                                    |
| +--------------------------------+ |
| | CONTINUAR                      | |
| | Unidad 3 · Daily stand-up (B1) | |
| | Lección 4 de 6                 | |
| | [      Seguir lección       ]  | |
| +--------------------------------+ |
|                                    |
| Repaso de vocabulario              |
| 12 palabras para hoy  [Repasar]    |
|                                    |
| Para escuchar hoy                  |
| [mini-tarjeta podcast, 60 s]       |
+------------------------------------+
| Hoy | Camino | Entrev. | Escuchar | Perfil |
+------------------------------------+
```

**2. Camino de nivel**

```
+------------------------------------+
| < Nivel B1 · Backend    [cambiar]  |
| Unidad 3: Daily stand-up           |
|                                    |
|  (v) 1. Saludos de equipo          |
|   |                                |
|  (v) 2. Reportar avance            |
|   |                                |
|  (>) 3. Hablar de bloqueos  <- aquí|
|   |                                |
|  ( ) 4. Pedir ayuda                |
|   |                                |
|  [#] 5. Repaso de unidad           |
|   |                                |
|  [*] Test de unidad                |
|                                    |
| Unidad 4: Code review (bloqueada)  |
+------------------------------------+
| Hoy | Camino | Entrev. | Escuchar | Perfil |
```

Leyenda: `(v)` completada, `(>)` actual, `( )` pendiente, `[#]` repaso, `[*]` test. En la interfaz real cada estado lleva icono y texto, no solo color.

**3. Lección: lectura con palabras tocables y vídeo**

```
+------------------------------------+
| [x]  [====----------]  paso 2 de 6 |
|                                    |
| Lectura: "A failed deploy"         |
|                                    |
| Yesterday our ~pipeline~ failed    |
| after a ~merge~. We ~rolled back~  |
| and opened an ~incident~.          |
|                                    |
|  ~palabra~ = tocable (subrayada)   |
| +--------------------------------+ |
| | rolled back (phrasal verb)     | |
| | revertir un cambio             | |
| | [oír]  [guardar en repaso]     | |
| +--------------------------------+ |
|                                    |
| [ Ver vídeo (tramo 0:40-1:20) ]    |
| [       Continuar        ]         |
+------------------------------------+
```

**4. Lección: ejercicio con feedback**

```
+------------------------------------+
| [x]  [=========-------]  paso 4 de 6|
|                                    |
| Completa la frase                  |
| "The tests ____ before the merge." |
|                                    |
| ( ) pass                           |
| (o) passed                         |
| ( ) passing                        |
|                                    |
| [        Comprobar         ]       |
+------------------------------------+
| tras comprobar, panel inferior:    |
| +--------------------------------+ |
| | [check] Correcto               | |
| | Pasado simple: passed.         | |
| | [      Continuar       ]       | |
| +--------------------------------+ |
```

Si falla: panel con icono distinto, texto "Casi: la respuesta es *passed*" y la explicación. El feedback se anuncia con `aria-live="polite"`.

**5. Repaso espaciado de vocabulario**

```
+------------------------------------+
| Repaso · 12 pendientes   [3/12]    |
| [===------------]                  |
|                                    |
| +--------------------------------+ |
| |           rollback             | |
| |        /ˈroʊlbæk/   [oír]      | |
| |   "We did a rollback at 3am."  | |
| |                                | |
| |       [ Ver significado ]      | |
| +--------------------------------+ |
| Tras revelar:                      |
| Revertir a una versión anterior    |
|                                    |
| [Otra vez] [Difícil] [Bien] [Fácil]|
|   <1 min    1 día    3 días  7 días|
+------------------------------------+
```

Los intervalos se muestran con texto, como Anki, y son la base del algoritmo (SM-2 simplificado, sin servicios externos).

**6. Simulacro de entrevista**

```
+------------------------------------+
| Simulacro · QA Engineer · B2       |
| Pregunta 2 de 5       [00:45 libre]|
|                                    |
| "How do you decide what to         |
|  automate and what to test by hand?"|
|                                    |
| 1) Lee y piensa (sin límite)       |
| 2) Escribe tu respuesta            |
| +--------------------------------+ |
| |                                | |
| +--------------------------------+ |
| Ayudas: [vocabulario] [estructura] |
|                                    |
| [Enviar]  -> compara con modelo    |
|    + rúbrica: ¿incluí ejemplo?     |
|      ¿usé conectores? ¿tiempo?     |
+------------------------------------+
```

Sin LLM: el feedback viene de una rúbrica de autoevaluación con casillas, una respuesta modelo, frases clave que el usuario marca como "usé" o "no usé", y comparación con ejemplos de nivel B1, B2 y C1.

**7. Podcast / escuchar**

```
+------------------------------------+
| Escuchar · Tramos guiados          |
| Filtro: [IA] [QA] [Backend] [Front]|
|                                    |
| +--------------------------------+ |
| | [miniatura facade]  > 1:10     | |
| | Latent Space · B2              | |
| | "Agentic search" · tramo 1:10  | |
| +--------------------------------+ |
|                                    |
| Antes de escuchar                  |
|  - ¿Qué es "agentic search"?       |
| Velocidad: [0,75x] [1x]            |
| [Transcripción]  [Palabras clave]  |
| Después: 3 preguntas  [Empezar]    |
+------------------------------------+
```

**8. Perfil / progreso (bonus)**

```
+------------------------------------+
| Danny · Nivel actual B1            |
| Progreso del nivel  [======---] 62%|
|                                    |
| Últimas 8 semanas (minutos)        |
| ▂ ▃ ▅ ▃ ▆ ▇ ▅ ▆   (con valores)    |
|                                    |
| Vocabulario: 214 palabras (88 sólidas)|
| Simulacros: 4 completados          |
| [Ajustes: meta, tema, sonido,      |
|  movimiento reducido, texto grande]|
+------------------------------------+
```

### 2.4 Navegación

Móvil: barra inferior de 5 pestañas, altura 56 a 64 px, objetivos táctiles ≥ 44 px (WCAG 2.2 pide mínimo 24 px, se recomienda 44):

| Pestaña | Icono (lucide) | Contenido |
|---|---|---|
| Hoy | `house` o `layout-dashboard` | Resumen semanal, meta, continuar, repaso del día |
| Camino | `route` | Unidades y lecciones del nivel actual |
| Entrevista | `mic` o `messages-square` | Simulacros por rol y nivel |
| Escuchar | `headphones` | Podcasts y vídeos con tramos guiados |
| Perfil | `user-round` | Progreso, ajustes, vocabulario guardado |

Escritorio (≥1024 px): barra lateral izquierda de 240 px con las mismas 5 entradas más "Vocabulario" y "Ajustes"; contenido central de máximo 720 px; panel derecho opcional con el resumen semanal. Atajos de teclado estilo Linear/Raycast: `g h` (Hoy), `g c` (Camino), `?` para ayuda, y `Intro` para comprobar y continuar en ejercicios.

Accesibilidad de la navegación: `<nav aria-label="Principal">`, `aria-current="page"`, etiqueta de texto visible siempre, foco visible de 2 px con offset, y enlace "Saltar al contenido".

### 2.5 Direcciones visuales

Todos los contrastes son texto sobre fondo calculados con la fórmula WCAG. AA exige ≥4,5 para texto normal y ≥3 para componentes de interfaz y texto grande.

#### Dirección A: "Terminal Calma" (recomendada)

Teal sobre neutros fríos, sobria, cercana a la estética de herramientas dev sin ser oscura por defecto.

| Token | Claro | Oscuro |
|---|---|---|
| Fondo | `#FFFFFF` | `#0B1220` |
| Superficie | `#F1F5F9` | `#131C2E` |
| Texto | `#0F172A` (17,85:1) | `#E2E8F0` (15,19:1) |
| Texto secundario | `#475569` (7,58:1) | `#94A3B8` (7,30:1) |
| Primario (botón) | fondo `#0F766E`, texto `#FFFFFF` (5,47:1) | fondo `#2DD4BF`, texto `#04201D` (9,18:1) |
| Acierto | `#15803D` (5,02:1) | `#4ADE80` (10,74:1) |
| Error | `#B91C1C` (6,47:1) | `#F87171` (6,77:1) |

- Tipografía: `system-ui` para la interfaz; `JetBrains Mono` (OFL, auto-hospedada con `next/font`, 1 peso) para código y términos técnicos. Tamaño base 16 px, interlineado 1,6.
- Iconografía: lucide-react con importación por icono (tree-shaking), trazo 1,75 px.
- Microcopy: segunda persona del singular, directo y sin exclamaciones excesivas. Ejemplos: "Bien. Sigue" / "Casi. Mira la regla" / "Hoy llevas 6 de 10 min" / "Sin prisa, mañana retomas".
- Pros: máxima legibilidad, mínimo coste de rendimiento, el verde-teal evita colisionar con la semántica acierto/error (el acierto va con icono de check, no solo verde). Contras: puede parecer genérica, hay que darle personalidad con el microcopy y la ilustración mínima.

#### Dirección B: "Cuaderno cálido"

Fondo crema, índigo y ámbar. Más humana, parecida a Brilliant o Readwise.

| Token | Claro | Oscuro |
|---|---|---|
| Fondo | `#FAFAF7` | `#141418` |
| Texto | `#1F2937` (14,04:1) | `#ECECF1` (15,60:1) |
| Primario | fondo `#4338CA`, texto `#FFFFFF` (7,90:1) | fondo `#A5B4FC`, texto `#141418` (9,22:1) |
| Racha / énfasis | `#B45309` sobre fondo (4,80:1) | `#FBBF24` (11,01:1) |

- Tipografía: `Georgia` o `ui-serif` en títulos de lectura y `system-ui` en el resto (cero descargas).
- Pros: invita a leer, diferencia claramente de las herramientas de trabajo, el ámbar da calidez a la racha. Contras: el ámbar claro tiene un margen de contraste ajustado (4,80:1, usar solo para texto con peso ≥600), y puede percibirse menos "dev".

#### Dirección C: "Raycast / Linear dev"

Oscuro primero, neutros casi negros y un único acento azul.

| Token | Claro | Oscuro |
|---|---|---|
| Fondo | `#FFFFFF` | `#09090B` |
| Texto | `#111827` (17,74:1) | `#F4F4F5` (18,10:1) |
| Acento | fondo `#1D4ED8`, texto `#FFFFFF` (6,70:1) | fondo `#60A5FA`, texto `#09090B` (7,83:1) |

- Tipografía: `Inter` variable auto-hospedada (≈ 30 a 50 KB subconjunto latino) o `system-ui` si se quiere 0 KB, más mono para atajos.
- Pros: identidad dev inmediata, atajos de teclado, aspecto muy pulido. Contras: se siente frío, menos motivadora para un público que necesita constancia, y los bordes sutiles de bajo contraste son un riesgo de accesibilidad (los bordes de componentes deben llegar a ≥3:1).

#### Notas transversales de rendimiento y accesibilidad

- Presupuesto: JS inicial ≤200 KB gzip. Mantener Server Components por defecto, componentes de cliente solo en ejercicios y repaso, y sin librerías de animación pesadas (CSS transitions y `@keyframes`).
- LCP ≤2,5 s: el dashboard debe renderizar texto en servidor, sin imagen hero, con `font-display: swap` y un solo archivo de fuente (o ninguno).
- `prefers-reduced-motion: reduce`: desactivar confeti, rebotes y transiciones de barra; sustituir por cambio instantáneo más texto. Ofrecer además un interruptor propio en Ajustes.
- Sin depender solo del color: acierto = icono de check + texto "Correcto"; error = icono + "Revisa"; estados del camino con icono distinto; gráficas con etiquetas de valor.
- Sonido: desactivado por defecto, con control en Ajustes y en la lección. Nada de audio automático (WCAG 1.4.2).
- Objetivos táctiles ≥44 px, foco visible, orden de foco lógico, `aria-live` para feedback, texto escalable hasta 200 %.
- Tema: respetar `prefers-color-scheme` con interruptor manual de tres estados (sistema, claro, oscuro).

Recomendación: partir de A como base y tomar de C los atajos de teclado, y de B el tono cálido de las pantallas de lectura. Se puede implementar con tokens (CSS variables) para cambiar de dirección sin reescribir componentes.

## 3. Parte 2: podcasts y vídeos de valor

### 3.1 Metodología de verificación

- Canal de YouTube: se cargó la página `youtube.com/@handle/videos` y se extrajeron IDs de vídeo reales.
- oEmbed: `curl https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json` devolvió 200 en todos los IDs de la tabla, y se comprobó el campo `author_name` contra el canal esperado. Un 200 de oEmbed indica que el vídeo existe y es incrustable. Además `youtube-nocookie.com/embed/NYFGCESmikA` devuelve HTTP 200.
- RSS: se descargó el feed y se comprobó HTTP 200 más presencia de `<enclosure>`.
- Los IDs de la tabla son de vídeos recientes de cada canal en la fecha de consulta, con título comprobado. Las URL de feeds de Substack usan el ID de feed numérico y se confirmó el título del feed.
- Los IDs corresponden a vídeos recientes que pueden quedar despublicados en el futuro. El pipeline de contenido debe volver a validar con oEmbed (script de CI).

### 3.2 Tabla de podcasts y canales verificados

CEFR estimado: es una estimación basada en velocidad, léxico y registro del habla; no es una medición. Casi todo el material es B2-C2.

| # | Podcast / canal | Tema | YouTube (handle) | RSS verificado | CEFR | Por qué aporta | ID(s) oEmbed 200 (autor verificado) |
|---|---|---|---|---|---|---|---|
| 1 | Lex Fridman Podcast | IA, ciencia, programación | @lexfridman | `https://lexfridman.com/feed/podcast/` | C1-C2 | Entrevistas largas con líderes de IA y software, mucho vocabulario abstracto | `NYFGCESmikA` (DHH, programación e IA), `s7d2d8FhevU` |
| 2 | Latent Space | Ingeniería de IA | @LatentSpacePod | `https://api.substack.com/feed/podcast/1084089.rss` | C1 | Jerga real de AI engineering: agentes, evals, inferencia | `MWX36ZYnsm0`, `kog7mwsDqnk` |
| 3 | Dwarkesh Podcast | IA, historia, ciencia | @DwarkeshPatel | `https://api.substack.com/feed/podcast/69345.rss` | C1-C2 | Conversaciones densas con fundadores e investigadores | `LwQQ7nBCGSs`, `f6cjAEr08qk` (los vídeos recientes tratan temas de historia, buscar episodios de IA) |
| 4 | Lenny's Podcast | Producto, carrera, IA aplicada | @LennysPodcast | `https://api.substack.com/feed/podcast/10845.rss` | B2-C1 | Habla de producto y carrera con estructura clara, útil para entrevistas | `MM-C3JqCXBk`, `sEXdyK6woKU` |
| 5 | The Pragmatic Engineer | Ingeniería de software, carrera | @PragmaticEngineer | `https://api.substack.com/feed/podcast/458709.rss` | B2-C1 | Cultura de ingeniería de grandes empresas, vocabulario de equipo | `Ru99FGJ_yuE` |
| 6 | Software Engineering Daily | Backend, arquitectura | @SoftwareDaily | Existe, pero curl devuelve 403 de Cloudflare; probar desde navegador | B2-C1 | Temas técnicos de backend e infraestructura en entrevista | `5hhnfTlOwcA` |
| 7 | Syntax | Frontend, web | @syntaxfm | `https://feed.syntax.fm/rss` | B2 | Tono informal, ritmo rápido, vocabulario de frontend muy actual | `POylAyrYzTw`, `SdJXHYuRr48` |
| 8 | The Changelog | Open source, desarrollo | @Changelog | `https://changelog.com/podcast/feed` | B2-C1 | Entrevistas con mantenedores, léxico de open source | `THQQH-F9yow` |
| 9 | JS Party | JavaScript, frontend | (RSS del Changelog, canal no verificado) | `https://changelog.com/jsparty/feed` | B2 | Conversación de panel sobre JS y CSS | Sin ID verificado, usar RSS |
| 10 | Talk Python To Me | Python, backend | @TalkPython | `https://talkpython.fm/episodes/rss` (200; el `<enclosure>` no coincide con mi patrón de búsqueda, revisar a mano) | B2 | Entrevistas claras y pausadas, buen puente hacia B2 | `yZdfOf8kQo4` |
| 11 | Python Bytes | Python, noticias | @PythonBytes | `https://pythonbytes.fm/episodes/rss` (200; mismo aviso de `<enclosure>`) | B2 | Formato de noticias cortas, bueno para tramos | `UNRsvoFOV1I` (episodio antiguo, comprobado) |
| 12 | Test Guild / Automation Testing (Joe Colantonio) | QA y automatización | @TestGuild y @JoeColantonio | Feed `testguild.com/feed/podcast/` devolvió 404; localizar el feed real antes de usarlo | B2 | Vocabulario de QA (flaky tests, CI, E2E), imprescindible para el tema QA | `rnGBDrT9VI8` (canal "Automation Testing with Joe Colantonio") |
| 13 | A/B Testing Podcast | Experimentación / QA | @ABTesting existe (título "A/B Testing") | No verificado | B2 | Dudoso como fuente de QA: no confirmé que sea el programa esperado ni su contenido | Sin ID, descartar hasta revisar |
| 14 | Practical AI | IA aplicada | @PracticalAI | `https://changelog.com/practicalai/feed` | B2 | IA práctica explicada con claridad | `zpVaY12xU0g` |
| 15 | No Priors | IA y startups | @nopriorspodcast | `https://feeds.megaphone.fm/nopriors` | C1 | Conversaciones con fundadores e inversores de IA | `OpeCP4wCxkA`, `TCpRwJBQvW0` |
| 16 | Hard Fork (NYT) | Noticias de tecnología e IA | @HardFork | `https://feeds.simplecast.com/l2i9YnTd` | B2-C1 | Periodismo tecnológico, humor y registro cuidado | `YQV_TLAER_A`, `EdtNP-CJg_w` |
| 17 | The Cognitive Revolution | IA | @cognitiverevolution | `https://feeds.megaphone.fm/RINTP3108857801` | C1 | Entrevistas técnicas sobre modelos y seguridad de IA | `2BRC2N5Y8sQ` |
| 18 | The TWIML AI Podcast | Machine learning | @twimlai | `https://twimlai.com/feed/` | C1 | ML industrial, investigadores | `9Aato-NfjoU` |
| 19 | The AI Daily Brief | Noticias de IA | @AIDailyBrief | `https://anchor.fm/s/f7cac464/podcast/rss` | B2 | Resumen diario con un locutor, ritmo uniforme y claro | `nXKbGxi5tOg` |
| 20 | The Stack Overflow Podcast | Desarrollo | (YouTube no verificado; el handle @stackoverflow no es el oficial) | `https://feeds.simplecast.com/XA_851k3` | B2 | Entrevistas cortas sobre cultura de desarrollo | Sin ID verificado |
| 21 | AI Engineer (conferencia) | Ingeniería de IA | @aiDotEngineer | n/a (canal de charlas) | B2-C1 | Charlas técnicas de 15 a 20 min, ideales para tramos | `X4w2Pkz5tDY` |
| 22 | Computerphile | Informática, conceptos | @Computerphile | n/a | B2 | Explicaciones pausadas, el mejor candidato B1-B2 | `S6PqsZ65Mg4` |
| 23 | Fireship | Desarrollo, noticias | @Fireship | n/a | B2 | Vídeos de 2 a 10 min, ritmo muy rápido pero con subtítulos limpios | `_5p1_TNSWqQ` |
| 24 | Two Minute Papers | IA, investigación | @TwoMinutePapers | n/a | B2 | Narración pausada de papers, acento característico | `ZHVNTTKu9fU` |
| 25 | Google DeepMind | IA | @GoogleDeepMind | n/a | B2-C1 | Divulgación oficial y entrevistas | `HIUzrxQxTtw` |
| 26 | Y Combinator | Startups, IA | @ycombinator | n/a | B2-C1 | Charlas de fundadores | `xc2FTBGRSJo` |
| 27 | Anthropic (canal oficial) | IA | @anthropic-ai | n/a | B2-C1 | Contenido oficial sobre IA, buen contexto | `DdCEmlAydcw` |

Observaciones de la verificación:
- Se descartó el handle `@TestGuild` como fuente de IDs (la página no devolvió vídeos) y `@NoPriors`, `@Anthropic` y `@stackoverflow`, porque apuntan a canales ajenos. Se muestran los handles correctos.
- Fireship, Computerphile, Two Minute Papers, Google DeepMind, Y Combinator y Anthropic son canales de vídeo, no podcasts. Se incluyen por valor y porque Computerphile y Fireship tienen ritmo más amable.
- Los títulos de los episodios cambian a diario; los IDs son de la fecha de hoy.
- No verifiqué la política de embebido por vídeo concreto más allá del 200 de oEmbed. Algunos creadores pueden desactivar el embebido en vídeos puntuales, por eso hay que comprobar cada ID antes de publicarlo.
- Candidatos adicionales sin verificar (no usar hasta comprobarlos): Shoptalk Show (feed RSS 200 verificado: `https://shoptalkshow.com/feed/podcast/`), Practical Dev, Ship It.

### 3.3 Embebido de YouTube frente a audio RSS

| Criterio | YouTube con `youtube-nocookie.com` | Audio del RSS (enclosure directo) |
|---|---|---|
| Legalidad | Es el uso oficial permitido por los Términos de YouTube (embed por iframe API) | El enclosure es una URL pública para reproducir; reproducirla directamente desde el host no copia ni rehospeda, pero conviene revisar los términos de cada podcast |
| Privacidad | `youtube-nocookie.com` evita cookies hasta que se reproduce, aun así carga recursos de Google al activarse | El navegador contacta con el host (Megaphone, Substack, op3.dev, Podtrac, Simplecast, Art19, Blubrry...), muchos con redirecciones por trackers de estadísticas |
| CSP | `frame-src https://www.youtube-nocookie.com;` y `img-src` para miniaturas si se usan las de YouTube (mejor facade con miniatura propia) | `media-src` tendría que permitir muchos dominios (o `https:`), lo que debilita la CSP, y las redirecciones de enclosure cambian de host |
| Tramos | `start` y `end` en la URL del iframe (en segundos) | `#t=start,end` en el `src` del `<audio>` (media fragments), con soporte irregular |
| Subtítulos | Subtítulos de YouTube con `cc_load_policy=1` | No hay |
| Fiabilidad | Un vídeo borrado rompe el enlace (revalidar con oEmbed) | El host puede cambiar el enclosure |
| Peso | El iframe se carga solo al clic (facade) | `<audio preload="none">` |

Recomendación:
1. **Principal: YouTube con facade.** Miniatura estática propia o una imagen local, y al hacer clic se monta el iframe `https://www.youtube-nocookie.com/embed/<ID>?start=S&end=E&rel=0&cc_load_policy=1&hl=en`. Parámetros útiles: `start`, `end`, `rel=0`, `cc_load_policy=1`, `playsinline=1`. Para velocidad 0,75x, usar la IFrame Player API (`setPlaybackRate`) con `enablejsapi=1`, lo que implica cargar `iframe_api`; mantenerlo detrás del clic para no pagar el JS por adelantado.
2. **Respaldo opcional: audio del RSS** solo para podcasts sin vídeo y detrás de un aviso ("esto conecta con el servidor del podcast"). Guardar solo la URL del feed y del episodio como enlace, nunca el archivo.
3. CSP mínima propuesta: `frame-src https://www.youtube-nocookie.com; img-src 'self' data:; media-src 'self'` y añadir hosts de audio solo si se activa el respaldo (por ejemplo con una lista corta). No descargar, no extraer audio, no rehospedar, no incluir transcripciones copiadas de terceros.
4. Transcripciones: escribir un resumen propio y glosario por tramo, o enlazar a la transcripción oficial del podcast (muchos la publican, como Lex Fridman y Latent Space). No copiar el texto completo.
5. Script de CI o de contenido: validar cada ID con oEmbed, fallar si no devuelve 200 y registrar fecha de verificación.
6. Cita y atribución: mostrar siempre el nombre del podcast, el invitado y un enlace al original.

### 3.4 Cómo usar contenido B2-C2 con aprendices A2-B1

1. **Tramos cortos.** Cortar de 30 a 90 s con `start` y `end` donde el hablante dice algo completo y claro. Un episodio de 2 h aporta decenas de tramos. Nunca más de 2 min seguidos para A2-B1.
2. **Antes de escuchar (1 min).** Una pregunta guía en español o inglés sencillo ("¿Por qué recomienda usar tests?"), 3 a 5 palabras clave con significado y audio.
3. **Tres pasadas.**
   - Pasada 1: global, a 1x o 0,75x, sin pausar, y se responde una pregunta de comprensión general.
   - Pasada 2: a 0,75x con la transcripción propia o resumen; se completan huecos de 3 a 5 palabras.
   - Pasada 3: a 1x, sin ayuda, y se compara con la pasada 1.
4. **Andamiaje por nivel.**
   - A2: pregunta de verdadero o falso, palabras clave en español, tramo ≤30 s.
   - B1: elegir la idea principal y 1 o 2 detalles, tramo de 45 a 60 s.
   - B2+: sin transcripción, resumen en 2 frases y reutilizar 2 expresiones.
5. **Extracción de léxico.** Cada tramo aporta de 3 a 6 expresiones (por ejemplo "ship it", "flaky test", "tech debt") que pasan al repaso espaciado con el ejemplo del propio audio como frase de contexto.
6. **Velocidad y control.** 0,75x como predeterminada para A2-B1, con botones 0,75x y 1x y un botón "repetir tramo". Evitar el 0,5x (distorsiona la entonación).
7. **Gradación.** Marcar cada tramo con un nivel de dificultad real (velocidad de habla, vocabulario, acento) y no con el nivel del podcast completo. Computerphile, Talk Python, Fireship con subtítulos y AI Daily Brief son los mejores puntos de entrada.
8. **Cierre.** Un mini-ejercicio de producción: escribir 1 frase usando una expresión nueva, y opcionalmente grabarse (sin enviar el audio a ningún sitio) para comparar.
9. **Sin sobrecarga.** Máximo 1 tramo de escucha y 5 a 8 palabras nuevas por sesión de 10 min.

## 4. Recomendaciones y siguientes pasos

1. Adoptar la dirección A como base, con tokens CSS (claro y oscuro) y tema de tres estados. Auditar con axe y Lighthouse.
2. Decidir el diseño de navegación (5 pestañas, repaso dentro de Hoy). Proponer un prototipo estático en HTML y Tailwind antes de la implementación completa.
3. Crear el modelo de datos de tramos: `{ youtubeId, start, end, level, topic, keywords[], questions[], source, verifiedAt }`, con validación oEmbed en CI.
4. Completar la verificación pendiente: feed de Test Guild (404 en la URL probada), RSS de Software Engineering Daily desde navegador, YouTube oficial de Stack Overflow Podcast y JS Party, y comprobar el `<enclosure>` de Talk Python y Python Bytes.
5. Revisar con el usuario (de forma manual) qué podcasts incluye en la primera versión. Proponer empezar con 6 a 8: Computerphile, Talk Python, Syntax, Latent Space, Lex Fridman, Hard Fork, Practical AI y Test Guild.
6. Sugerencia para el vault: guardar como decisión la política "YouTube nocookie con facade como fuente principal; RSS solo como respaldo con aviso".

Limitaciones: la comparativa de apps (Busuu, Babbel, Speak, ELSA, Brilliant, Codecademy, Exercism, Linear/Raycast) se basa en conocimiento general y no en una verificación en vivo de cada producto. El nivel CEFR de los podcasts es una estimación.
