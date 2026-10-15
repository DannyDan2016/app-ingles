# Temario B1 y B2 — app-ingles (equivalente al de A2)

Fecha: 2026-10-13. Alcance por nivel: 8 lecciones (`<nivel>-<tema>-01/02`), 4 tramos de escucha (`<nivel>-<tema>-t1`) y glosario por tema. Estructura copiada de `sp2-contenido-a2.md`; esquema de `src/lib/contenido/esquema.ts` y reglas de `reglas.ts`.

Nota de método (honesta):
- Los descriptores CEFR, English Grammar Profile (EGP), English Vocabulary Profile (EVP) y los exámenes de Cambridge (B1 Preliminary, B2 First) se citan de memoria de las fuentes oficiales; no se abrió cada PDF en esta sesión. Antes de publicar conviene contrastar las citas literales con el Companion Volume (2020) y el EVP online.
- Los videos SÍ están verificados: 63 IDs únicos con oEmbed HTTP 200 (ninguno falló) y duración leída de `lengthSeconds` en la página del video. La búsqueda se hizo consultando los resultados de búsqueda de YouTube con un script (no estaba `yt-dlp` instalado ni se instaló nada). NO se ha visto ni escuchado ningún video: la idoneidad de nivel, ritmo, acento y exactitud técnica es una estimación por título, canal y duración; falta revisión humana y fijar `start`/`end` de los tramos viendo el video.
- Reglas del esquema que afectan a los redactores: los términos van en minúsculas, máx. 40 caracteres, solo letras/números/espacio/guion/apóstrofo (por eso `dom`, `orm`, `aria`, `slo`, `api`, no `DOM`); cada término citado en lectura o ejercicios debe existir en el glosario `nivel/tema`; lección = 5-8 ejercicios; tramo = 3-5 preguntas y duración 30-120 s; ids de ejercicio con prefijo del id de la lección; `orden` único por nivel (ia 1-3, qa 4-6, backend 7-9, frontend 10-12; en cada tema `01`→n, `02`→n+1, `t1`→n+2).

Reparto para redactores: un redactor por tema y nivel escribe `lecciones 01 y 02`, `t1` y `glosario-<tema>.yaml` de su nivel. El vocabulario de cada lección (13 términos) mas los términos extra que aparezcan en lecturas deben quedar en el glosario. Evitar repetir términos de A2 (listados en `content/a2/glosario-*.yaml`) como entradas nuevas; se pueden usar en las lecturas como léxico conocido, pero no hace falta volver a definirlos.

---

# NIVEL B1

## B1 §1 Descriptores CEFR aplicados a inglés técnico

Fuentes: CoE = Council of Europe, CEFR Companion Volume (2020), escalas de Reading, Listening, Vocabulary range y Grammatical accuracy; EGP/EVP = English Profile; PET = Cambridge B1 Preliminary; BC = British Council (LearnEnglish, descripción de niveles).

### Descriptores
- Lectura (CoE): entiende textos de contenido factual directo sobre temas de su especialidad y de interés, con un nivel satisfactorio de comprensión. En el contexto técnico: documentación breve, README, mensajes de commit/PR, descripciones de issues, artículos divulgativos.
- Lectura (CoE): encuentra y combina información de varias partes de un texto o de varios textos cortos; reconoce las líneas generales de un argumento aunque no siempre el detalle.
- Escucha (CoE): sigue lo esencial de charlas y vídeos claros sobre temas familiares si el acento es estándar y el ritmo moderado; capta ideas principales y detalles concretos de monólogos de 3-6 minutos.
- Escucha (CoE, Listening as a member of a live audience): sigue una exposición sencilla sobre un tema conocido si está bien estructurada y tiene apoyo visual (pantalla compartida, diagramas): es el caso típico de un tutorial o un stand-up.
- Producción (CoE): explica los puntos principales de una idea o problema con razonable precisión; escribe informes y mensajes sencillos y enlazados (por ejemplo, un bug report, una descripción de PR o una actualización de estado).
- Interacción (CoE): sabe pedir y dar aclaraciones («Could you repeat that?», «What do you mean by...?») y expresar opinión con matices simples.
- Vocabulario (CoE, Vocabulary range): léxico suficiente para describir situaciones, expresar ideas sobre temas familiares con algo de circunloquio. Vocabulario técnico: términos frecuentes del dominio (model, query, test suite, component) más verbos de proceso (reproduce, validate, render).
- Vocabulario (EVP/PET): ~2.500-3.500 palabras acumuladas A1-B1 en la lista de Cambridge/EVP; el léxico técnico se apoya en cognados internacionales (dataset, algorithm, framework, component).
- Gramática (EGP B1): present perfect (simple, para experiencia y resultado presente); past continuous vs past simple con when/while; condicionales cero y primero (y segundo en B1 alto); pasiva en presente y pasado simple; oraciones de relativo defining (who, which, that, where); gerundios e infinitivos tras verbos comunes; infinitivo de propósito; used to; have to / don't have to / need to / might / may; too y enough; estilo indirecto básico (say, tell, ask).
- Gramática (EGP): conectores de causa, contraste y secuencia (so, because, although, however, then, after that, while); preguntas indirectas simples.

### Gramática objetivo B1 (lista)
1. Present perfect simple (have/has + participio; ever, never, already, yet, just, for, since).
2. Past continuous vs past simple (while, when).
3. Zero y first conditional (if + presente, will/imperativo), con unless.
4. Passive voice presente y pasado simple (is run, was fixed), agente opcional con by.
5. Relative clauses defining (who, which, that, where).
6. Gerundios e infinitivos (verb + -ing / to + verb; infinitivo de propósito).
7. used to y would (hábitos y cambios en el pasado).
8. Second conditional (if + pasado, would) y «If I were you...».
9. Banco de apoyo (sin lección propia): have to / don't have to / need to; might/may; too/enough; reported speech básico; preguntas indirectas.

### Longitud de lectura y rango de vocabulario
- Lectura recomendada: 180-250 palabras por lección (PET Reading usa textos de ~100-250 palabras; A2 era 120-180). Párrafos de 3-5 frases, conectores del nivel y un 2-4 % de palabras nuevas (regla práctica de Nation: 95-98 % de cobertura conocida).
- Vocabulario por lección: 13 términos nuevos (rango 10-15), 26 por tema, ~104 nuevos en el nivel, distintos de A2. Priorizar sustantivos y verbos de proceso; 2-3 adjetivos; frases fijas cortas («root cause», «test suite»).
- Tramo de escucha: 30-120 s (regla de `reglas.ts`), un hablante, 4-6 palabras clave, 3-5 preguntas.
- Ejercicios (lección): 5-8, con mezcla de mcq/completar/ordenar/emparejar/verdadero_falso.

## B1 §2 Temario por tema

Formato: Título | Objetivo «Puedo...» | Gramática | Situación de trabajo | Vocabulario (forma base, ya en formato de término del esquema).

### Tema ia (orden 1-3)

#### b1-ia-01 — Has the Model Learned Enough?
- Objetivo: Puedo contar en una reunión qué ha hecho y qué ha mejorado un modelo de IA hasta ahora.
- Gramática: present perfect simple (have trained, has improved, hasn't learned yet; already, yet, just, for/since).
- Situación: stand-up del lunes. Una ingeniera de ML informa al equipo: «We've trained the model on a new dataset; accuracy has improved, but it hasn't learned to handle short messages yet.»
- Vocabulario (13): model, train, dataset, accuracy, predict, improve, generate, bias, pattern, label, output, algorithm, feedback.

#### b1-ia-02 — If You Give Context, the Answer Improves
- Objetivo: Puedo explicar qué pasa si cambio las instrucciones que doy a una IA y cómo reducir respuestas malas.
- Gramática: zero y first conditional (If you give an example, the model follows the format; If the prompt is vague, the AI will guess; unless).
- Situación: un desarrollador prepara un prompt para que la IA resuma issues de GitHub. Su compañera revisa y le explica qué ocurrirá si añade contexto, restricciones y formato.
- Vocabulario (13): context, constraint, format, hallucination, verify, summarize, reliable, vague, refine, template, token, assumption, source.

#### b1-ia-t1 — tramo de escucha (orden 3)
- Tema del tramo: cómo funciona un modelo de lenguaje (qué es un LLM, entrenamiento con texto, predicción de la siguiente palabra).
- Pregunta guía sugerida: «How does a large language model produce its answer?»
- Palabras clave sugeridas (de la lección ia): model, train, predict, generate, pattern.

### Tema qa (orden 4-6)

#### b1-qa-01 — While I Was Testing, the Build Failed
- Objetivo: Puedo narrar cómo encontré y reproduje un defecto, indicando qué pasaba mientras ocurría otra cosa.
- Gramática: past continuous vs past simple (While I was running the regression tests, the page crashed; When the build failed, we were deploying).
- Situación: una tester escribe el relato de un fallo intermitente en el informe y lo explica en la daily: qué hacía cuando falló, cómo lo reprodujo y qué solución provisional encontró.
- Vocabulario (13): regression, reproduce, crash, defect, severity, intermittent, build, investigate, workaround, root cause, assign, reopen, blocker.

#### b1-qa-02 — The Tests Are Run Every Night
- Objetivo: Puedo describir cómo y cuándo se ejecutan las pruebas automáticas y qué se arregló, sin decir quién lo hizo.
- Gramática: pasiva en presente y pasado simple (Tests are run every night; The failing test was fixed yesterday; The script is triggered by every pull request).
- Situación: una QA automatizadora presenta a un nuevo compañero cómo funciona el pipeline de pruebas del equipo y qué cambió la semana pasada.
- Vocabulario (13): automation, test suite, assertion, coverage, flaky, pipeline, trigger, script, unit test, integration test, mock, skip, maintain.

#### b1-qa-t1 — tramo de escucha (orden 6)
- Tema del tramo: diferencias entre smoke, sanity y regression testing.
- Pregunta guía sugerida: «When do we run a regression test?»
- Palabras clave sugeridas: regression, build, defect, test suite, automation.

### Tema backend (orden 7-9)

#### b1-backend-01 — A Service That Stores Orders
- Objetivo: Puedo definir y describir componentes de un backend usando frases con «that», «which» y «who».
- Gramática: relative clauses defining (A query is a request that asks the database for data; A user who is not logged in cannot see orders; the table where we keep records).
- Situación: un backend junior explica en un onboarding la arquitectura de la tienda: la base de datos, un índice que acelera consultas y la caché que guarda respuestas.
- Vocabulario (13): query, schema, record, index, transaction, authentication, session, cache, validate, payload, relational, row, join.

#### b1-backend-02 — We Use a Queue to Avoid Losing Messages
- Objetivo: Puedo explicar para qué sirve una solución técnica y recomendar o evitar una práctica de backend.
- Gramática: infinitivo de propósito y gerundios (We use a queue to avoid losing messages; Using a cache helps reduce load; I suggest adding a retry; Avoid blocking the request).
- Situación: tras una caída por tráfico alto, el equipo discute en un canal de chat cómo escalar el servicio y qué monitorizar.
- Vocabulario (13): queue, scale, latency, throughput, bottleneck, load balancer, retry, rate limit, container, microservice, monitor, alert, dependency.

#### b1-backend-t1 — tramo de escucha (orden 9)
- Tema del tramo: qué es una API REST (recursos, métodos, respuesta con estado).
- Pregunta guía sugerida: «What does a REST API do when a client sends a request?»
- Palabras clave sugeridas: query, payload, session, authentication, validate.

### Tema frontend (orden 10-12)

#### b1-frontend-01 — We Used to Build Pages with Tables
- Objetivo: Puedo contar cómo ha cambiado una práctica de frontend con el tiempo y comparar el «antes» con el «ahora».
- Gramática: used to (+ would para hábitos pasados) vs present simple (We used to write all the HTML by hand; now we build components).
- Situación: un desarrollador senior cuenta en una charla de equipo cómo era hacer webs hace diez años y por qué hoy usan componentes, estado y eventos.
- Vocabulario (13): component, framework, state, render, event, dom, accessibility, viewport, breakpoint, stylesheet, element, attribute, library.

#### b1-frontend-02 — If We Had More Time, We Would Add Dark Mode
- Objetivo: Puedo hablar de mejoras hipotéticas y dar consejo a un compañero («If I were you...»).
- Gramática: second conditional (If we had more time, we would add dark mode; If I were you, I would lazy load the images) y should/shouldn't para consejo.
- Situación: planificación de sprint. El equipo no puede hacerlo todo; deciden qué mejoras de rendimiento y de experiencia entran y cuáles quedan para después.
- Vocabulario (13): validation, animation, performance, bundle, lazy loading, props, callback, fetch, asynchronous, debug, deprecated, refactor, dark mode.

#### b1-frontend-t1 — tramo de escucha (orden 12)
- Tema del tramo: qué es el DOM y cómo lo usa JavaScript para cambiar una página.
- Pregunta guía sugerida: «How does JavaScript change what you see on a web page?»
- Palabras clave sugeridas: dom, element, event, render, attribute.

## B1 §3 Videos de YouTube candidatos (todos con oEmbed 200)

Duración leída de `lengthSeconds`. Formato: `ID` | título | canal | duración | oEmbed | por qué encaja. «Nivel» es estimación por título/canal/duración, sin haber visto el video.

### Lecciones
**b1-ia-01**
- `dSCFk168vmo` | Why do we split data into train test and validation sets? | Mısra Turp | 2:19 | 200 | corto, vocabulario dataset/train; B1.
- `qYNweeDHiyU` | AI, Machine Learning, Deep Learning and Generative AI Explained | IBM Technology | 10:00 | 200 | marco general (model, data, predict); B1-B2, usar un tramo.

**b1-ia-02**
- `sW5xoicq5TY` | Zero-shot, One-shot and Few-shot Prompting Explained | Analytics Vidhya | 3:45 | 200 | ejemplos en el prompt; B1.
- `R8y0Jn_NI94` | Context, Roles & Constraints in Prompt Engineering | Data Vidhyalaya | 5:25 | 200 | context/constraint/format; B1 (canal pequeño: revisar exactitud y acento).

**b1-qa-01**
- `AWX6WvYktwk` | Regression testing – What, Why, When, and How to Run It? | QA Madness | 3:25 | 200 | regression, defecto; B1.
- `Qt6xTQln3WU` | Smoke Testing Vs Regression Testing | Testing Talks with Faisal Khatri | 4:44 | 200 | complementario; B1 (acento indio, comprobar claridad).

**b1-qa-02**
- `pf6Zhm-PDfQ` | Unit and Integration testing COMPARED | Jelvix \| TECH IN 5 MINUTES | 5:17 | 200 | unit test, integration test; B1.
- `uCxL7NGEohI` | Unit vs Integration testing — what's the difference? | Christopher Okhravi | 4:12 | 200 | claro y estructurado; B1-B2.
- extra: `ddDJxFnv-qs` | CI/CD Explained in 5 Minutes | TechWorld with Nana | 4:52 | 200 | pipeline y trigger; B1.

**b1-backend-01**
- `R0XlH8FUEc8` | Relational vs. NoSQL: databases explained simply | Google Cloud | 2:26 | 200 | schema, relational, record; B1, canal oficial.
- `BIlFTFrEFOI` | SQL indexing best practices \| How to make your database FASTER! | CockroachDB | 4:08 | 200 | index, query; B1-B2 (posible contenido promocional del producto).
- extra: `GAe5oB742dw` | ACID Properties in Databases With Examples | ByteByteGo | 4:57 | 200 | transaction.

**b1-backend-02**
- `bmUmBTVZmrY` | Load Balancing Explained in 3 minutes | Connected Cookie | 3:15 | 200 | load balancer, scale; B1.
- `DYFocSiPOl8` | Message Queues in System Design | Hayk Simonyan | 4:30 | 200 | queue, retry; B1-B2.
- extra: `lL_j7ilk7rc` | Microservices Explained in 5 Minutes | 5 Minutes Tech | 5:16 | 200.

**b1-frontend-01**
- `fKqgdT-KLrM` | The Story of Web Components | ui.dev | 6:41 | 200 | historia y componentes (encaja con «used to»); B1-B2, dividir en tramos.
- `20SHvU2PKsM` | Introduction to Web Accessibility and W3C Standards | W3C Web Accessibility Initiative (WAI) | 4:07 | 200 | accessibility, canal oficial; B1.
- extra: `rd5VilifoOg` | Every Frontend Framework Explained in 6 Minutes! | Swag Professor Explainer | 6:45 | 200 | framework (revisar exactitud).

**b1-frontend-02**
- `H0XScE08hy8` | Debugging JavaScript - Chrome DevTools 101 | Chrome for Developers | 7:27 | 200 | debug; B1-B2, usar un tramo.
- `RmLh08I4n6I` | Lazy Load your Images | Computeshorts | 4:38 | 200 | lazy loading, performance; B1.

### Tramos de escucha (1 principal + 1 alternativo)
Criterio: <10 min de video, un hablante, ritmo moderado; tramo final de 60-120 s a fijar al verlo.
| Tramo | Principal | Alternativo |
|---|---|---|
| b1-ia-t1 | `5sLYAQS9sWQ` How Large Language Models Work, IBM Technology, 5:33, 200; explicación estructurada de LLM, B1-B2 | `67_aMPDk2zw` LLM Explained \| What is LLM, codebasics, 4:17, 200; más simple, acento indio, B1 |
| b1-qa-t1 | `Sd1xryTlyVI` Smoke vs Sanity vs Regression Testing, Test Systems, 3:57, 200; B1 | `roIode67TQE` Smoke Testing vs Regression Testing, Edu Multiverse, 4:18, 200; B1 (acento indio) |
| b1-backend-t1 | `-mN3VyJuCjM` What Is REST API?, ByteByteGo, 5:21, 200; B1-B2, apoyo visual | `WRsKs-K6iII` What is a Rest API? (in 2 Minutes), Warp, 2:11, 200; muy corto, canal de empresa (revisar promoción) |
| b1-frontend-t1 | `NO5kUNxGIu0` The JavaScript DOM explained in 5 minutes!, Bro Code, 5:01, 200; B1 | `ipkjfvl40s0` What is DOM \| Document Object Model, Automation Step by Step, 6:58, 200; B1 |

## B1 §4 Notas para FreeDict (B1)
Contexto (de `diccionario-offline.md`): FreeDict eng-spa trae lemas con traducción, IPA y categoría, pero sin ejemplos; en software es flojo (`bug` = «chinche»; faltan `backend`, `frontend`, `runtime`, `throughput`).
- Glosario propio (prevalece sobre FreeDict, porque en el diccionario general falta, es inexacto o el primer sentido es el equivocado): `throughput`, `latency`, `bottleneck`, `load balancer`, `rate limit`, `retry`, `payload`, `query`, `schema`, `index` (en sentido de base de datos), `cache`, `session`, `transaction`, `flaky`, `regression`, `reproduce` (sentido de QA), `root cause`, `workaround`, `build`, `test suite`, `unit test`, `integration test`, `mock`, `assertion`, `pipeline`, `trigger`, `hallucination` (sentido de IA), `token` (sentido de LLM), `prompt`-familia, `dataset`, `label` (sentido de ML), `bias` (sesgo estadístico), `component`, `render`, `state`, `props`, `dom`, `breakpoint`, `viewport`, `lazy loading`, `bundle`, `callback`, `refactor`, `deprecated`, `dark mode`.
- Diccionario general (FreeDict basta, con traducción y IPA): `model`, `train`, `predict`, `improve`, `generate`, `pattern`, `output`, `feedback`, `accuracy`, `algorithm`, `context`, `constraint`, `format`, `verify`, `summarize`, `reliable`, `vague`, `refine`, `template`, `assumption`, `source`, `crash`, `defect`, `severity`, `intermittent`, `investigate`, `assign`, `reopen`, `blocker`, `automation`, `coverage`, `script`, `skip`, `maintain`, `validate`, `record`, `row`, `join`, `relational`, `authentication`, `scale`, `monitor`, `alert`, `dependency`, `container`, `microservice` (comprobar), `framework`, `event`, `element`, `attribute`, `library`, `accessibility`, `stylesheet`, `validation`, `animation`, `performance`, `fetch`, `asynchronous`, `debug`.
- Regla práctica: si una palabra tiene un sentido técnico distinto del cotidiano (`build`, `token`, `bias`, `label`, `record`, `row`, `join`, `index`, `session`, `state`, `render`, `bundle`, `trigger`, `mock`, `fetch`, `container`), el glosario propio gana y se muestra primero; FreeDict aporta IPA y los demás sentidos.
- Para que el diccionario encuentre formas flexionadas que aparecerán en las lecturas B1 (`trained`, `improved`, `tests`, `queues`, `components`) hace falta el lematizador por reglas ya identificado como deuda en `diccionario-offline.md`; las formas irregulares de B1 (`been`, `found`, `run`, `built`, `written`) deben ir en la tabla de irregulares.
- Estimación: de ~104 términos nuevos B1, unos 45-55 necesitan entrada propia en el glosario y el resto se cubre con FreeDict.

---

# NIVEL B2

## B2 §1 Descriptores CEFR aplicados a inglés técnico

Fuentes: CoE CEFR Companion Volume (2020), EGP/EVP, Cambridge B2 First (FCE), BC.

### Descriptores
- Lectura (CoE): lee con un grado amplio de autonomía, adaptando estilo y velocidad al tipo de texto; vocabulario activo amplio pero con dificultades ocasionales con expresiones poco frecuentes. En contexto técnico: documentación de API, RFC, postmortems, artículos de ingeniería, descripciones de PR largas.
- Lectura (CoE): comprende artículos e informes sobre problemas contemporáneos en los que los autores adoptan una postura o un punto de vista concreto; distingue hechos de opiniones.
- Escucha (CoE): comprende el discurso estándar, incluso charlas técnicas dentro de su especialidad; sigue una línea de argumentación compleja si el tema es razonablemente familiar; capta el tono y la actitud del hablante (ironía ligera, cautela).
- Escucha (CoE, Understanding audio media): comprende la mayoría de podcasts, charlas de conferencia y videos técnicos con acentos variados, aunque puede perder detalles a ritmo rápido o con jerga muy actual.
- Producción (CoE): redacta textos claros y detallados (informes, postmortems, RFC, descripciones de PR), sintetizando y evaluando información; argumenta a favor o en contra de una opción.
- Interacción (CoE): participa en discusiones técnicas con fluidez razonable, defiende puntos de vista con explicaciones y argumentos, y cuestiona con cortesía.
- Vocabulario (CoE, Vocabulary range): buen repertorio en su campo y en temas generales; variación de formulación para evitar repeticiones frecuentes. Léxico técnico: colocaciones (circuit breaker, error budget), verbos de proceso y términos abstractos (trade-off, governance, oversight).
- Vocabulario (EVP/FCE): ~4.500-6.000 palabras acumuladas A1-B2 según EVP/lista de FCE; el léxico técnico B2 incluye muchos compuestos y acrónimos.
- Gramática (EGP B2): condicionales tercero y mixtos; modales de deducción en pasado (must have, might have, can't have) y críticas (should have); pasiva avanzada (reporting passive: is said to, is expected to) y causativo (have/get something done); reported speech con reporting verbs (suggest, admit, deny, insist, warn, advise); non-defining relative clauses; participle clauses (Having run the suite, ...); future perfect y continuous; wish / if only; estructuras de énfasis (cleft sentences, inversión: Not only..., Never...); concesión (although, even though, whereas, despite, in spite of); hedging (tends to, appears to, is likely to).

### Gramática objetivo B2 (lista)
1. Modales de deducción en pasado (must have / might have / can't have + participio) y should have.
2. Concesión y contraste (although, even though, despite, whereas, nevertheless) + reporting passive y hedging.
3. Tercer condicional y condicionales mixtos (If we had added an index, the query would be faster now), wish / if only.
4. Reported speech con reporting verbs y participle clauses (She admitted missing the edge case; Having run the suite, we decided to release).
5. Future perfect y future continuous (By Q3 we will have migrated...) y causativo (We had the vendor patch it).
6. Estructuras de énfasis: cleft sentences (What matters is...) e inversión (Not only is it fast, it is also accessible).
7. Non-defining relative clauses y nominalización en texto formal (PR, RFC, changelog).
8. Banco de apoyo (sin lección propia): wish/if only, passive con modales, relative clauses con preposición («the service on which we depend»), cuantificadores formales.

### Longitud de lectura y rango de vocabulario
- Lectura recomendada: 250-350 palabras por lección (FCE Reading usa textos de ~500-700 palabras; la app mantiene lecciones de lectura breve). Frases largas con subordinación, párrafos de 4-6 frases, tono más formal y un 3-5 % de palabras nuevas.
- Vocabulario por lección: 13 términos nuevos (rango 10-15), distintos de A2 y de B1; incluye compuestos y colocaciones (el límite del esquema es 40 caracteres).
- Tramo de escucha: 30-120 s, extraído de un video de 4-25 min; se acepta charla de conferencia y varios acentos.
- Ejercicios: 5-8, incluir al menos uno de transformación/ordenar con la estructura objetivo.

## B2 §2 Temario por tema

### Tema ia (orden 1-3)

#### b2-ia-01 — The Model Might Have Been Biased
- Objetivo: Puedo analizar en un postmortem por qué un modelo falló, expresando grados de certeza sobre causas pasadas.
- Gramática: modales de deducción en pasado (The model must have overfitted; The benchmark can't have been the problem; We should have checked the drift).
- Situación: reunión de revisión tras detectar que un asistente con RAG daba respuestas incorrectas en producción. El equipo repasa evaluación, datos y guardarraíles y hace hipótesis sobre las causas.
- Vocabulario (13): overfitting, inference, benchmark, embedding, guardrail, fine-tuning, retrieval, evaluation, robust, drift, prompt injection, agent, context window.

#### b2-ia-02 — Although the Model Is Powerful, It Should Be Supervised
- Objetivo: Puedo redactar una recomendación equilibrada sobre adoptar IA en el equipo, reconociendo ventajas y límites.
- Gramática: concesión (although, even though, despite, whereas) + reporting passive y hedging (AI is expected to..., tends to, is likely to).
- Situación: una tech lead escribe un breve memo para la dirección sobre adoptar asistentes de IA en el desarrollo, equilibrando productividad, riesgos, cumplimiento y supervisión humana.
- Vocabulario (13): hype, trade-off, governance, transparency, accountable, compliance, mitigate, deterministic, scalable, adoption, limitation, ethical, oversight.

#### b2-ia-t1 — tramo de escucha (orden 3)
- Tema del tramo: por qué alucinan los LLM y cómo se reduce el riesgo.
- Pregunta guía sugerida: «Why do large language models sometimes produce wrong answers confidently?»
- Palabras clave sugeridas: inference, retrieval, evaluation, robust, guardrail.

### Tema qa (orden 4-6)

#### b2-qa-01 — We Should Have Caught It Earlier
- Objetivo: Puedo participar en un postmortem, explicar qué habría pasado de otro modo y proponer mejoras sin culpar.
- Gramática: tercer condicional y should have (If we had tested the edge case, the incident wouldn't have happened; We shouldn't have skipped the exploratory session).
- Situación: tras un incidente en producción provocado por una condición de carrera, el equipo escribe y discute un postmortem sin culpables.
- Vocabulario (13): postmortem, incident, hotfix, rollback, edge case, race condition, exploratory testing, acceptance criteria, stakeholder, sign-off, traceability, risk, blameless.

#### b2-qa-02 — Having Run the Suite, We Decided to Release
- Objetivo: Puedo resumir en estilo indirecto lo que se acordó en una reunión de estrategia de pruebas y por qué.
- Gramática: reported speech con reporting verbs (suggested, admitted, insisted, warned) y participle clauses (Having run the suite, ...).
- Situación: el QA lead redacta el acta de la reunión de estrategia de pruebas: quién dijo qué, qué se acordó (pirámide de pruebas, quality gate, contract tests) y cuál es el riesgo asumido.
- Vocabulario (13): test strategy, shift left, test pyramid, end-to-end test, contract test, test data, fixture, parallelize, coverage gap, mutation testing, quality gate, smoke test, non-functional.

#### b2-qa-t1 — tramo de escucha (orden 6)
- Tema del tramo: mutation testing — por qué una alta cobertura no garantiza buenas pruebas (charla de conferencia).
- Pregunta guía sugerida: «Why can high code coverage still hide weak tests?»
- Palabras clave sugeridas: mutation testing, coverage gap, test strategy, fixture, quality gate.

### Tema backend (orden 7-9)

#### b2-backend-01 — If We Had Added an Index, the Query Would Be Faster
- Objetivo: Puedo explicar decisiones pasadas y arrepentimientos técnicos y su efecto actual en bases de datos y APIs.
- Gramática: condicionales mixtos (If we had designed it idempotent, we wouldn't have duplicates now) y wish / if only (I wish we had used a read replica).
- Situación: revisión de rendimiento tras una migración; el equipo analiza consultas lentas, bloqueos y consistencia de datos entre réplicas.
- Vocabulario (13): idempotent, consistency, replication, sharding, deadlock, normalization, migration, orm, concurrency, query plan, connection pool, read replica, isolation level.

#### b2-backend-02 — By Q3 We Will Have Moved to Canary Releases
- Objetivo: Puedo presentar un plan de fiabilidad con hitos futuros y delegar acciones.
- Gramática: future perfect y future continuous (By Q3 we will have migrated; This time next month we'll be running canary releases) y causativo (We had the vendor increase the quota).
- Situación: reunión de planificación de fiabilidad en la que el equipo define objetivos de servicio, observabilidad y estrategias de despliegue para el próximo trimestre.
- Vocabulario (13): observability, tracing, slo, failover, circuit breaker, backpressure, orchestration, blue-green deployment, canary release, infrastructure as code, graceful degradation, api gateway, error budget.

#### b2-backend-t1 — tramo de escucha (orden 9)
- Tema del tramo: circuit breaker en microservicios (qué evita y cómo reacciona).
- Pregunta guía sugerida: «What does a circuit breaker do when a downstream service keeps failing?»
- Palabras clave sugeridas: circuit breaker, failover, graceful degradation, observability, backpressure.

### Tema frontend (orden 10-12)

#### b2-frontend-01 — Not Only Is It Fast, It Is Also Accessible
- Objetivo: Puedo defender en un design review decisiones de rendimiento y accesibilidad con argumentos enfatizados.
- Gramática: estructuras de énfasis — cleft sentences (What matters most is the first render) e inversión (Not only does it load faster, but it also works with a screen reader; Never use div for a button).
- Situación: design review de una nueva página renderizada en servidor. Se discute la hidratación, los desplazamientos de maquetación y las mejoras de accesibilidad.
- Vocabulario (13): hydration, server-side rendering, memoization, tree shaking, code splitting, layout shift, semantic html, aria, screen reader, contrast ratio, focus, progressive enhancement, render-blocking.

#### b2-frontend-02 — The Component, Which Was Written in 2019, Needs a Refactor
- Objetivo: Puedo redactar la descripción de un pull request o un RFC con información añadida y tono formal.
- Gramática: non-defining relative clauses y nominalización (The Button component, which was written in 2019, is used by 40 pages; The removal of the old API is a breaking change).
- Situación: un desarrollador escribe la descripción de un PR que migra un componente del design system, avisa de un breaking change y pide revisión; el revisor responde con comentarios matizados.
- Vocabulario (13): pull request, code review, merge conflict, breaking change, backward compatible, monorepo, design system, tech debt, linter, type safety, polyfill, state management, changelog.

#### b2-frontend-t1 — tramo de escucha (orden 12)
- Tema del tramo: accesibilidad web más allá del contraste de color (charla de conferencia).
- Pregunta guía sugerida: «Why is color contrast not enough to make a website accessible?»
- Palabras clave sugeridas: screen reader, focus, contrast ratio, semantic html, aria.

## B2 §3 Videos de YouTube candidatos (todos con oEmbed 200)

### Lecciones
**b2-ia-01**
- `T-D1OfcDW1M` | What is Retrieval-Augmented Generation (RAG)? | IBM Technology | 6:35 | 200 | retrieval, embedding, inference; B2, canal estable.
- `1jReCwBgM84` | LLM Evaluation Basics: Datasets & Metrics | Generative AI at MIT | 5:18 | 200 | evaluation, benchmark; B2.
- extra: `trfUBIDeI1Y` | LLM as a Judge: Scaling AI Evaluation Strategies | IBM Technology | 6:08 | 200.

**b2-ia-02**
- `yh-3WU1FKrk` | What is Responsible AI? A Guide to AI Governance | IBM Technology | 6:05 | 200 | governance, transparency, oversight; B2.
- `F8NKVhkZZWI` | What are AI Agents? | IBM Technology | 12:28 | 200 | agent, trade-offs; B2, usar un tramo.
- extra: `jrHRe9lSqqA` | What Is a Prompt Injection Attack? | IBM Technology | 10:57 | 200 | prompt injection, mitigate.

**b2-qa-01**
- `zin11gmX7CM` | English for Software Engineers: Inside a Blameless Postmortem \| Ep. 3 | EnglishNotNull | 12:29 | 200 | vocabulario y frases de postmortem en inglés; B2.
- `Fv0nwb1Qn6A` | Blameless Postmortem Culture In Software Engineering | Clément Mihailescu | 9:23 | 200 | incident, blameless; B2.
- extra: `9JYVOUKNQ3A` | How to run a Post-Mortem meeting, step-by-step | Bran van der Meer | 8:03 | 200.

**b2-qa-02**
- `GaNa_JCZlME` | Shift Left Testing Explained for QA - STOP Testing Late! | Testing Tech Talks | 4:06 | 200 | shift left; B2 (acento indio probable).
- `RXOgwQQCGAQ` | The Test Pyramid Explained – Unit, Integration & UI Tests | Rafal Podraza – Tech Academy | 5:15 | 200 | test pyramid; B2.
- extra: `rHgOA_D_DRs` What is Contract Testing | Automation Step by Step | 3:40 | 200; `Tb_ezE1Oz7w` Test Talk - What is shift left? | QA Consultants | 4:37 | 200.

**b2-backend-01**
- `jLEp1XI_L6Q` | Database Replication & Sharding Explained | Hayk Simonyan | 6:52 | 200 | replication, sharding; B2.
- `XAccGbtl3Z8` | Idempotency - What it is and How to Implement it | Alex Hyett | 8:04 | 200 | idempotent; B2, locutor claro.
- extra: `9Zw3ay3_tCQ` | Database Deadlocks Easily Explained | Software Developer Diaries | 13:17 | 200 | deadlock, concurrency.

**b2-backend-02**
- `H5z70EBtEow` | Deployment Strategies Explained: Blue-Green vs. Canary vs. Rolling | CodeLucky | 4:20 | 200 | blue-green, canary; B2.
- `htajMQi0C1g` | Observability Explained: How Metrics, Logs & Traces Help Teams Diagnose Modern System Failures | Harness | 4:12 | 200 | observability, tracing; B2 (canal de empresa: revisar promoción).
- extra: `aJpzr8648XE` | Metrics, Logs and Traces: What To Observe and Why | Tech Upskill | 8:08 | 200.

**b2-frontend-01**
- `P6KFg10AuLA` | CSR vs SSR, and what hydration actually does | Beyond Localhost | 5:01 | 200 | hydration, server-side rendering; B2.
- `4AjCRUuvwbI` | Web Accessibility: What Is Semantic HTML? | Stefany Newman - Accessibility Instructor | 7:47 | 200 | semantic html, screen reader; B2.
- extra: `kZG3izJu7qE` Hydration Explained | Awesome | 4:35 | 200; `pTswmgVWSH8` What are Core Web Vitals? | Sematext | 7:14 | 200 | layout shift.

**b2-frontend-02**
- `Y9sp8gONv9M` | Code Review Tips (How I Review Code as a Staff Software Engineer) | Cody Engel | 12:08 | 200 | code review, tono de comentarios; B2.
- `5MK3SkNST-0` | Design Systems Explained: The Beginners Guide for New Web Designers & Developers | Brad Hussey | 8:41 | 200 | design system; B2 (alto nivel de B1-B2).
- extra: `LheeJPkdCu8` How to Review a Pull Request Like a Senior Developer | Matt Stauffer | 15:20 | 200; `9iU_IE6vnJ8` Monorepos - How the Pros Scale Huge Software Projects | Fireship | 9:07 | 200 (ritmo rápido: solo con subtítulos).

### Tramos de escucha (1 principal + 1 alternativo)
| Tramo | Principal | Alternativo |
|---|---|---|
| b2-ia-t1 | `cfqtFvWOfg0` Why Large Language Models Hallucinate, IBM Technology, 9:37, 200; B2 | `005JLRt3gXI` Why do AI models hallucinate?, Claude (Anthropic), 5:13, 200; B2, canal oficial |
| b2-qa-t1 | `yNMBOj7JUPs` Kill All Mutants! (Introduction to Mutation Testing), Dave Aronson, JSConf Hawaii 2020, 22:17, 200; charla de conferencia, B2-C1, elegir un tramo de 60-120 s | `Mhe-quHWe60` 3 Steps to Fix Flaky Tests, Semaphore, 8:15, 200; B2 (canal de empresa, revisar promoción) |
| b2-backend-t1 | `5_Bt_OEg0no` The Circuit Breaker Pattern \| Resilient Microservices, Nick Chapsas, 7:12, 200; B2, un hablante | `dJI2saoM5_k` Circuit Breaker Pattern in Microservices, ByteMonk, 9:54, 200; B2 |
| b2-frontend-t1 | `J4zg-XqUe0Q` Web Accessibility is More than Colour Contrast, Kayleen Hamelin, StarCon KW, 13:33, 200; charla de conferencia, B2 | `cOmehxAU_4s` How I do an accessibility check -- A11ycasts #11, Chrome for Developers, 12:17, 200; B2, canal oficial |

## B2 §4 Notas para FreeDict (B2)
- Glosario propio (FreeDict no los trae, los traduce mal o el sentido por defecto no es el técnico): `overfitting`, `inference`, `benchmark`, `embedding`, `guardrail`, `fine-tuning`, `retrieval` (sentido RAG), `drift`, `prompt injection`, `agent` (sentido IA), `context window`, `postmortem`, `hotfix`, `rollback`, `edge case`, `race condition`, `exploratory testing`, `acceptance criteria`, `sign-off`, `traceability`, `test strategy`, `shift left`, `test pyramid`, `end-to-end test`, `contract test`, `fixture`, `parallelize`, `coverage gap`, `mutation testing`, `quality gate`, `smoke test`, `idempotent`, `replication`, `sharding`, `deadlock`, `normalization` (sentido de BD), `migration`, `orm`, `concurrency`, `query plan`, `connection pool`, `read replica`, `isolation level`, `observability`, `tracing`, `slo`, `failover`, `circuit breaker`, `backpressure`, `orchestration`, `blue-green deployment`, `canary release`, `infrastructure as code`, `graceful degradation`, `api gateway`, `error budget`, `hydration`, `server-side rendering`, `memoization`, `tree shaking`, `code splitting`, `layout shift`, `semantic html`, `aria`, `contrast ratio`, `progressive enhancement`, `render-blocking`, `pull request`, `merge conflict`, `breaking change`, `backward compatible`, `monorepo`, `design system`, `tech debt`, `linter`, `type safety`, `polyfill`, `state management`, `changelog`.
- Diccionario general (FreeDict cubre bien): `robust`, `evaluation`, `hype`, `trade-off`, `governance`, `transparency`, `accountable`, `compliance`, `mitigate`, `deterministic`, `scalable`, `adoption`, `limitation`, `ethical`, `oversight`, `incident`, `stakeholder`, `risk`, `blameless` (comprobar), `consistency`, `focus`, `screen reader` (comprobar), `code review`.
- Los compuestos y acrónimos (más de la mitad del léxico B2) casi no existen en FreeDict (que lista palabras sueltas): el glosario propio debe ser la fuente principal. Para multi-palabra, definir en el glosario con `categoria: phrase` o `noun` y buscar por la frase completa y por sus partes.
- Compuestos con guion (`fine-tuning`, `blue-green deployment`, `render-blocking`, `trade-off`, `sign-off`) cumplen el regex del esquema; el buscador del diccionario debe normalizar guiones y espacios.
- Formas flexionadas y participios que aparecen en la gramática B2 (`must have been`, `had added`, `having run`, `suggested`, `admitted`) refuerzan la necesidad del lematizador y la tabla de irregulares.
- Estimación: de ~104 términos nuevos B2, 80-85 necesitan entrada propia (más que en B1).

---

# Resumen de verificación de videos
- IDs únicos verificados con oEmbed: 63. Respuestas 200: 63. Fallidos: 0.
- Duración leída de la página (`lengthSeconds`) para los 63.
- No verificado: contenido real de cada tramo, ritmo, acento, precisión técnica y presencia de promoción. Antes de redactar las preguntas de escucha, una persona debe ver el tramo y fijar `start`/`end` (30-120 s, enteros).
- Riesgo de disponibilidad: mantener la comprobación periódica de oEmbed en CI (propuesta de A2) y conservar el alternativo por tramo.
- Derechos: solo reproductor embebido; no descargar ni copiar transcripciones.
- Videos de canales de empresa/marketing marcados (CockroachDB, Harness, Warp, Semaphore) pueden tener sesgo promocional: se dejan como alternativos o con aviso.
- Fireship u otros muy rápidos no se usan como principal; `9iU_IE6vnJ8` queda solo como extra B2.
