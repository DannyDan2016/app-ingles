# Investigación pedagógica A2 — app-ingles (MVP)

Fecha: 2026-10-06. Alcance: 8 lecciones (ia, qa, backend, frontend x2), 4 listening, evaluación 20/40.
Nota de método: los descriptores CEFR se citan de memoria de fuentes oficiales (no se abrió cada PDF en esta sesión); antes de publicar conviene contrastar las citas literales con el Companion Volume (2020) y el English Vocabulary Profile (EVP). Los videos SÍ están verificados (oEmbed + duración leída de la página del video).

## 1. Descriptores CEFR A2 y gramática

### 1.1 Descriptores
Fuentes: CoE = Council of Europe, CEFR Companion Volume (2020), escalas de Reading, Listening y Vocabulary range; EP = English Profile (English Grammar Profile y English Vocabulary Profile); KET = Cambridge A2 Key (Reading & Writing, Listening, Vocabulary List).

- Lectura (CoE): entiende textos cortos y sencillos sobre temas concretos y cotidianos, con vocabulario de alta frecuencia y léxico internacional.
- Lectura (CoE): encuentra información específica y predecible en material cotidiano (anuncios, menús, correos breves, instrucciones).
- Lectura (CoE): entiende instrucciones sencillas de equipos de uso cotidiano y mensajes de interfaz (pertinente para tutoriales de software).
- Lectura (KET Reading): textos de ~100-200 palabras, frases cortas, conectores básicos (and, but, because, then).
- Escucha (CoE): entiende lo que se dice despacio y con claridad; frases y expresiones de uso muy frecuente en áreas de relevancia inmediata.
- Escucha (CoE): capta la idea principal de mensajes y anuncios breves, claros y sencillos; identifica el tema de una conversación lenta.
- Escucha (KET Listening): extrae datos concretos (números, nombres, horas, lugares) de diálogos y monólogos breves.
- Vocabulario (CoE, Vocabulary range): repertorio suficiente para necesidades básicas; sin léxico abstracto.
- Vocabulario (EVP / KET Vocabulary List): ~1.000-1.500 palabras acumuladas A1+A2; el léxico técnico debe limitarse a términos frecuentes y transparentes (test, bug, user, server, page, button, data).
- Vocabulario (EP): los cognados internacionales (database, internet, software) son accesibles aunque no estén en EVP; verbos de oficina (click, open, save, send, check, fix).
- Gramática (EP Grammar Profile A2): present simple vs continuous; past simple regular e irregular; comparativos y superlativos básicos; can/can't, must/mustn't, should; going to; contables/incontables con some/any/much/many; preposiciones de tiempo (at/on/in) y lugar; imperativo.
- Gramática (EP): coordinación con and/but/or y subordinación simple con because, when, if.
- Producción (CoE): describe rutinas, tareas pasadas y planes en frases simples enlazadas; escribe notas y mensajes breves.
- Estrategia (CoE): pide repetición y aclaración; reconoce palabras clave para captar la idea general.

### 1.2 Gramática repartida en las 8 lecciones
| Lección | Punto principal | Apoyo |
|---|---|---|
| a2-ia-01 | Present simple vs present continuous | adverbios de frecuencia |
| a2-ia-02 | Imperatives (instrucciones / prompts) | please, don't, first/then |
| a2-qa-01 | Past simple regular e irregular | yesterday, last week, there was/were |
| a2-qa-02 | can/can't, must/mustn't, should | because |
| a2-backend-01 | Countable/uncountable (some, any, much, many, a lot of) | a/an |
| a2-backend-02 | Prepositions of time and place (at, on, in, from...to) | when |
| a2-frontend-01 | Comparatives y superlativos | than, as...as |
| a2-frontend-02 | going to (planes) + will (decisión rápida) | if + present (extra en banco) |

## 2. Temario de las 8 lecciones

Vocabulario: término | traducción | categoría. Lecturas de 120-180 palabras, A2.

### a2-ia-01 — My Assistant Is Working Now
- Tema ia. Objetivo: explicar qué hace y qué está haciendo ahora una herramienta de IA. Gramática: present simple vs continuous.
- Vocabulario: AI | IA | noun; assistant | asistente | noun; chatbot | chatbot | noun; question | pregunta | noun; answer | respuesta | noun; data | datos | noun; learn | aprender | verb; understand | entender | verb; write | escribir | verb; useful | útil | adj; wrong | incorrecto | adj; tool | herramienta | noun.
- Lectura: Sara, desarrolladora junior, usa un chatbot cada día para entender mensajes de error; ahora mismo le pide que explique un error y el chatbot está escribiendo la respuesta (contraste rutina/ahora).
- Ejercicios: (1) opción múltiple (simple vs continuous); (2) completar huecos con la forma del verbo; (3) verdadero/falso sobre la lectura.

### a2-ia-02 — Ask the AI Clearly
- Tema ia. Objetivo: dar instrucciones claras a una IA paso a paso. Gramática: imperativos y secuenciadores.
- Vocabulario: prompt | instrucción (prompt) | noun; example | ejemplo | noun; short | corto | adj; clear | claro | adj; explain | explicar | verb; list | lista / enumerar | noun/verb; translate | traducir | verb; check | comprobar | verb; copy | copiar | verb; result | resultado | noun; step | paso | noun; mistake | error | noun.
- Lectura: una mentora da a un compañero 4 pasos para pedir ayuda a una IA («First, write a short prompt. Give an example. Don't write a long text...»).
- Ejercicios: (1) ordenar palabras (formar un imperativo); (2) emparejar término-definición; (3) opción múltiple (elegir el prompt más claro).

### a2-qa-01 — A Bug in the Login Page
- Tema qa. Objetivo: contar qué pasó al encontrar un bug. Gramática: past simple.
- Vocabulario: tester | tester / probador | noun; bug | error / fallo | noun; login | inicio de sesión | noun; page | página | noun; button | botón | noun; screen | pantalla | noun; click | hacer clic | verb; find (found) | encontrar | verb; report | reportar / informe | verb/noun; fix | arreglar | verb; password | contraseña | noun; message | mensaje | noun.
- Lectura: a tester reports a bug in the login page: ayer escribió su usuario, hizo clic en el botón y la página no se abrió; envió un informe al desarrollador.
- Ejercicios: (1) completar huecos con past simple; (2) ordenar los pasos de la historia; (3) verdadero/falso.

### a2-qa-02 — What Should We Test?
- Tema qa. Objetivo: expresar obligaciones y recomendaciones en un plan de pruebas. Gramática: can/can't, must/mustn't, should.
- Vocabulario: test case | caso de prueba | noun; expected result | resultado esperado | noun; steps | pasos | noun; pass | pasar / aprobar | verb; fail | fallar | verb; requirement | requisito | noun; browser | navegador | noun; mobile | móvil | adj/noun; automatic test | prueba automática | noun; screenshot | captura de pantalla | noun; priority | prioridad | noun; environment | entorno | noun.
- Lectura: el equipo prepara la prueba de la página de pago: «You must test the button on mobile. You should write the expected result. You can't release with a failed test.»
- Ejercicios: (1) opción múltiple (modal correcto); (2) completar huecos (must/should/can); (3) emparejar término-definición.

### a2-backend-01 — Data on the Server
- Tema backend. Objetivo: describir qué datos guarda y devuelve un servidor. Gramática: contables/incontables.
- Vocabulario: server | servidor | noun; database | base de datos | noun; request | petición | noun; response | respuesta | noun; user | usuario | noun; table | tabla | noun; store | guardar / almacenar | verb; send | enviar | verb; information | información (incontable) | noun; data | datos (incontable) | noun; error | error | noun; slow | lento | adj.
- Lectura: una app de tienda: el servidor guarda información de usuarios y productos en una base de datos; «How many users are online? There isn't much data about...».
- Ejercicios: (1) opción múltiple (much/many/some/any); (2) clasificar contable/incontable (variante de emparejar); (3) completar huecos.

### a2-backend-02 — When the API Answers
- Tema backend. Objetivo: explicar cuándo y dónde ocurre una petición a una API. Gramática: preposiciones de tiempo y lugar.
- Vocabulario: API | API / interfaz | noun; endpoint | punto de acceso | noun; return | devolver | verb; code | código | noun; status | estado | noun; timeout | tiempo agotado | noun; deploy | desplegar | verb; cloud | nube | noun; log | registro | noun; schedule | programar | verb; update | actualizar | verb/noun; backup | copia de seguridad | noun.
- Lectura: el equipo despliega una actualización «on Friday at 6 p.m.»; la API está «on the server in the cloud»; hay mantenimiento «from 2 to 3 a.m.».
- Ejercicios: (1) completar huecos con preposición; (2) opción múltiple; (3) verdadero/falso.

### a2-frontend-01 — Which Layout Is Better?
- Tema frontend. Objetivo: comparar dos diseños de página. Gramática: comparativos y superlativos.
- Vocabulario: layout | diseño / maquetación | noun; screen | pantalla | noun; color | color | noun; font | tipografía | noun; image | imagen | noun; menu | menú | noun; responsive | adaptable | adj; fast | rápido | adj; large | grande | adj; simple | sencillo | adj; mobile phone | teléfono móvil | noun; header | cabecera | noun.
- Lectura: dos diseñadores comparan la página A y la B: «Page B is faster than page A. The menu is simpler. This is the best layout for mobile.»
- Ejercicios: (1) completar huecos con comparativo; (2) ordenar palabras; (3) opción múltiple.

### a2-frontend-02 — We Are Going to Build a Form
- Tema frontend. Objetivo: hablar de planes de desarrollo. Gramática: going to + will.
- Vocabulario: form | formulario | noun; field | campo | noun; HTML | HTML | noun; CSS | CSS | noun; style | estilo / dar estilo | noun/verb; add | añadir | verb; change | cambiar | verb; link | enlace | noun; input | entrada | noun; submit | enviar | verb; design | diseñar / diseño | verb/noun; browser | navegador | noun.
- Lectura: Luis is going to build un formulario de contacto: añadirá campos con HTML, dará estilo con CSS y probará en el navegador.
- Ejercicios: (1) completar huecos con going to; (2) emparejar término-definición (HTML/CSS/field...); (3) verdadero/falso.

## 3. Videos de YouTube candidatos (todos verificados)

Método: IDs vistos en resultados de WebSearch (filtro youtube.com); verificación con oEmbed (HTTP 200 en todos los listados); duración leída de `lengthSeconds` de la página del video. Idoneidad estimada solo por título, canal y duración: falta revisión humana de ritmo/acento (ver sección 5).
Descartados en la verificación: `3DCZBR64kaE` (403) y errores de transcripción míos (400/404, sin relación con el video).

### 3.1 Por lección
**a2-ia-01**
- `R44aOvXeKaU` | What Is Machine Learning? Beginner-Friendly Explanation | LearnFree | 2:02 | 200 | corto y simple; A2.
- `90TEhlBgL5U` | What Is Artificial Intelligence? | Explained for Beginners | Rocio Carreon | 3:02 | 200 | definición básica de IA; A2-B1.
- `qMxuthTIQq4` | What is an LLM? | Large Language Models Explained Simply | MyaPya | 2:28 | 200 | chatbots y LLM; B1 probable.

**a2-ia-02**
- `T_-2M_1pgoE` | Prompt Engineering for Beginners: System Prompts, Examples & AI Safety | LearnFree | 2:00 | 200 | prompts con ejemplos; A2-B1.
- `jC4v5AS4RIM` | Master the Perfect ChatGPT Prompt Formula (in just 8 minutes)! | Jeff Su | 8:30 | 200 | estructura de prompt clara pero rápido; B1, usar un tramo.
- `hAOP4GhZ7oQ` | What Is ChatGPT? | ChatGPT Explained for Beginners in 5 Minutes | Ramesh Fadatare | 5:29 | 200 | contexto general; A2-B1.

**a2-qa-01**
- `Ecu_7juyU0Q` | QA bug reporting basics: How to write clear and effective bug reports? | QA Unlocked | 3:32 | 200 | coincide con la lectura; A2-B1.
- `g0176p-SYP8` | Unit Testing Explained: Simple Guide for Coding Beginners | Science·WHYS | 2:42 | 200 | complementario; A2-B1.
- `u6QfIXgjwGQ` | Software Testing Explained in 100 Seconds | Fireship | 2:16 | 200 | muy denso y rápido; B2, solo extra con subtítulos.

**a2-qa-02**
- `Biynpm4x4Ig` | Unit Testing Explained: What It Is and How It Works | QA Unlocked | 3:10 | 200 | tests, expected result; A2-B1.
- `Ecu_7juyU0Q` y `g0176p-SYP8` (reutilizables).

**a2-backend-01**
- `iuL69sAyuxQ` | What Is a Database? (Simple Explanation for Beginners) | Baserow | 3:03 | 200 | A2.
- `Tk1t3WKK-ZY` | What is a database in under 4 minutes | Linux Academy | 3:46 | 200 | A2-B1.
- `_PTHgeRv_D0` | What Is a Database? (Explained in 6 Minutes) | ByteSized ICT | 6:50 | 200 | más detalle; B1.

**a2-backend-02**
- `-0MmWEYR2a8` | What is an API? (explained in 3 minutes) | Postman | 3:18 | 200 | analogía de API; A2-B1.
- `bxuYDT-BWaI` | APIs Explained (in 4 Minutes) | Aced (formerly Exponent) | 3:57 | 200 | request/response; B1.
- `6wb6Dph9AYM` | Web Server Explained in 2 minutes | Connected Cookie | 2:18 | 200 | servidor/cliente; A2.
- extra: `xRxUyQUkOnE` | What is a Web Server? | How Web Servers Work Explained Simply | E-Software Hub | 1:23 | 200.

**a2-frontend-01**
- `gT0Lh1eYk78` | HTML, CSS, JavaScript Explained [in 4 minutes for beginners] | Danielle Thé | 3:57 | 200 | A2-B1.
- `GicRMTSelys` | Responsive Web Design Explained in 3 Minutes | Roberto Blake | 2:50 | 200 | layout y responsive; A2-B1.
- `gPsCJy4T67M` | What is Responsive Design? (Fundamentals Lesson 23) | Framer | 1:27 | 200 | muy corto; A2-B1.

**a2-frontend-02**
- `Kds2znNc048` | What Is CSS? Beginner-Friendly Explanation [video 1] | Neha Sharma | 3:14 | 200 | A2-B1.
- `1mXrxc_sv1o` | Front-end vs back-end: What's the difference? | Codecademy | 1:15 | 200 | muy corto; A2-B1.
- `PORRrz3Y8Vc` | What's HTML and how does it work? | Web Demystified, Episode 1 | Mozilla Hacks | 7:15 | 200 | HTML claro; B1, usar un tramo.
- extra: `IxaN8D0Oz9U` | Responsive Web Design Explained (Beginner-Friendly Guide) | VirtualAddiction | 5:10 | 200.

### 3.2 Listening (4)
Criterio: menos de 4 min, un hablante, ritmo moderado; tramo de 60-120 s.
1. ia: `90TEhlBgL5U` (3:02), alternativa `R44aOvXeKaU`.
2. qa: `Ecu_7juyU0Q` (3:32), alternativa `g0176p-SYP8`.
3. backend: `6wb6Dph9AYM` (2:18), alternativa `-0MmWEYR2a8`.
4. frontend: `GicRMTSelys` (2:50), alternativa `gPsCJy4T67M`.

Otros verificados (200), no recomendados para A2 técnico: BBC Learning English 6 Minute English (`0R9NLQM4ZKA`, `_zmMl7T8164`, `DxR2waii1Ck`, `KB4Mn5XHdMc`, `NVgpf-SFs0g`; 6:15-6:35 min; nivel B1) y `0EPYNMJv-oQ` (box set IA, ~30 min); listening A2 genérico no técnico: `uittzmxZ4cA` (Talking about Work, 8:05, Elephant English Podcasts), `RCDCNCLszJc` (City Life, 9:51), `0z7SOVsly4E` (What are your hobbies?, 2:58, Test-English). Descartados por longitud o ritmo: `GWGN0znexW8` (20:53), `Qqfbr2itLGM` (23:53), `RW-pqVQi9Ic` (13:06), `gVB9Adyp1g0` (12:07), `Tn6-PIqc4UM` y `RvYYCGs45L4` (Fireship, ritmo B2).

Resumen: 23 videos distintos propuestos para lecciones/listening con oEmbed 200 (más ~13 verificados adicionales como alternativas o descartados por nivel/duración).

## 4. Formatos de ejercicio (todos los niveles)

Esquema común sugerido: `id`, `type`, `prompt`, `options`/`items`, `answer`, `explanation` (breve, ES), `skill` (grammar|vocab|reading|listening).

1. Opción múltiple (`mcq`): una correcta y 3 distractores plausibles.
   Ejemplo: «Yesterday the tester ___ a bug.» a) find b) found c) finds d) finding -> b. (past simple de find es found).
2. Completar huecos (`gap_fill`): texto con `___` y respuestas aceptadas (normalizar mayúsculas y espacios).
   Ejemplo: «You ___ test the app on mobile.» (must) .
3. Ordenar palabras (`word_order`): fichas desordenadas; admite varias soluciones válidas.
   Ejemplo: [first, write, a, short, prompt] -> «First, write a short prompt.»
4. Emparejar término-definición (`match`): 4-5 pares, distractor opcional.
   Ejemplo: server = «a computer that gives data to other computers»; bug = «a mistake in a program»; login = «the page where you enter your name and password».
5. Verdadero/falso (`true_false`): afirmación sobre la lectura con justificación.
   Ejemplo: «The user clicked the button and the page opened.» -> False.
6. Listening (`listening`): `video_id`, `start_sec`, `end_sec`, subtipo mcq/gap/tf; 5 preguntas por ejercicio (EP5-HU05).
   Ejemplo: video `Ecu_7juyU0Q`, tramo 20-80 s (provisional; fijar al ver el video): «What does a good bug report need first?» a) A title b) A photo c) A password d) A name.

Recomendaciones: tramos de 45-120 s con marcas en segundos enteros; permitir repetir el tramo; la transcripción es solo referencia interna de revisión (no publicar transcripciones de terceros).

Evaluación final (banco de 40, se eligen 20 al azar con equilibrio): 10 gramática, 14 vocabulario técnico, 10 lectura, 6 listening; examen de 20 = 5 gramática, 7 vocabulario, 5 lectura, 3 listening.

## 5. Riesgos de calidad y recomendaciones

- Nivel real del video: casi todo el contenido técnico de YouTube es B1-B2 por ritmo y léxico. Marcar la lección como «video con subtítulos recomendado» y evaluar solo un tramo corto trabajado.
- Fireship y similares: muy rápidos, con ironía y jerga; tratarlos como extra B2, no listening A2.
- Acentos: hay locutores de distintos acentos (indio, británico, estadounidense). Es útil como exposición, pero conviene revisar que el tramo elegido sea claro; los subtítulos automáticos pueden fallar con términos técnicos.
- Disponibilidad: un video puede borrarse o desactivar el embebido (EP5-HU02). Añadir un job en CI que compruebe oEmbed periódicamente y mantener una alternativa por lección (ya propuestas).
- Derechos: usar solo el reproductor embebido oficial; no descargar ni re-alojar audio o video; no copiar transcripciones completas; citar título y canal.
- Autoridad y exactitud técnica: varios canales son pequeños; preferir Postman, Codecademy, Mozilla Hacks, Framer y que una persona revise la exactitud técnica. Revisar posible contenido promocional.
- Marcas de tiempo: solo se verificó existencia y duración, no el contenido de cada tramo; un humano debe ver el tramo antes de redactar las preguntas de listening y fijar start/end.
- Léxico: limitar a 10-12 términos por lección, preferir términos transparentes o de EVP y reutilizarlos en la evaluación.
- Traducciones: decidir una variante única de español (móvil/celular, ordenador/computadora).
- Contenido generado con Ollama: revisar el inglés producido (no garantiza A2 estricto); validar con script la longitud de la lectura (120-180 palabras) y el vocabulario, y pasar revisión humana.
