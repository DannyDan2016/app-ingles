# Investigación: metodología de aprendizaje para app-ingles

Fecha: 2026-10-06. Alcance: solo investigación web y conocimiento propio; no se tocó ningún repo.

## Nota de verificación (importante)

Los intentos de abrir fuentes con WebFetch fallaron (PubMed devolvió página de cookies, SAGE y physics.harvard.edu dieron 403, el PDF de Northwestern llegó binario). Por tanto:

- **[B] Verificado en buscador**: título, autores y resumen coinciden en varios resultados de búsqueda (metadatos y abstracts), pero no abrí el texto completo.
- **[M] Memoria / segunda mano**: lo conozco por la literatura, no lo contrasté en esta sesión. Los enlaces DOI de esta categoría son los habituales; compruébalos antes de citarlos en la app.
- Ninguna cifra de este documento está verificada en el texto completo. Las cifras que doy vienen de snippets de buscador y deben tratarse como orientativas.

---

## Resumen ejecutivo (10 viñetas)

1. **No existe un «método Harvard» para idiomas.** Harvard no tiene un método de lenguas con nombre propio respaldado por evidencia. Lo real son: el estudio de active learning de Deslauriers et al. (2019, física, no idiomas), el trabajo de Project Zero (Teaching for Understanding) y el case method (derecho/negocios). «Método Harvard» en idiomas es sobre todo marketing; el equivalente con evidencia es: práctica de recuperación + repetición espaciada + aprendizaje activo + producción con feedback.
2. **Lo que mejor funciona (evidencia fuerte):** recuperarse de memoria (testing effect), espaciar las repeticiones, y producir lenguaje con feedback. Son las tres bases del MVP.
3. **La sensación de aprender engaña**: Deslauriers 2019 muestra que los alumnos sienten aprender más con clases pasivas pero aprenden más con active learning. La app debe explicar por qué «cuesta» y no optimizar por satisfacción inmediata.
4. **CLIL/ESP encaja con tu propuesta** (aprender IA/QA/backend en inglés): la evidencia en CLIL es favorable pero metodológicamente irregular (revisiones sistemáticas muestran efectos positivos o neutros con problemas de diseño). Es una apuesta razonable, no una garantía.
5. **Comprehensible input es necesario pero no suficiente** (Krashen es muy citado y muy criticado; i+1 no es operacionalizable). Combinar input (podcasts, lecturas) con output (hablar/escribir) y feedback.
6. **Gamificación:** hay evidencia moderada de que sube uso y motivación (meta-análisis en idiomas con g ≈ 0,38 según un snippet) y un RCT grande (Aulagnon et al., 2026) con rachas que mejoró uso y algo de rendimiento en matemáticas en niños; no hay evidencia sólida de que ligas/vidas mejoren el aprendizaje de idiomas en adultos. Racha y recordatorios sí; ligas competitivas, vidas y culpa, no.
7. **Para adultos profesionales** conviene autonomía (elegir tema/ruta), competencia visible (can-do statements) y poca infantilización; SDT tiene meta-análisis en L2 que asocia motivación autónoma con mejor logro (correlacional).
8. **Métricas semanales con sentido:** minutos de práctica distribuidos, precisión de recuperación a 7+ días, ítems «dominados» (estabilidad alta), y can-do por nivel CEFR. Evitar XP y rachas como métrica principal.
9. **Simulacros de entrevista sin LLM** son viables con: banco de preguntas, estructura STAR, respuestas modelo en audio, shadowing, grabación propia y autoevaluación con rúbrica. La evidencia específica para ESL es débil; se apoya en práctica deliberada, shadowing (fluidez/prosodia) y feedback con criterios.
10. **Sueño y sesiones cortas:** dormir entre sesiones de aprendizaje reduce la práctica necesaria (Mazza et al. 2016). Microsesiones de 10 a 15 min diarias + repaso espaciado son un diseño coherente con la evidencia.

---

## 1. ¿Qué es el «método Harvard»?

**Conclusión: el término no corresponde a un método concreto de enseñanza de idiomas con evidencia.** Búsqueda: no aparece ningún método de lenguas de Harvard validado; solo resultados sobre Project Zero y active learning. Lo que existe:

| Referencia real | Qué es | Relevancia para idiomas | Estado |
|---|---|---|---|
| Deslauriers, McCarty, Miller, Callaghan & Kestin (2019). *Measuring actual learning versus feeling of learning in response to being actively engaged in the classroom.* PNAS 116(39), 19251-19257. https://www.pnas.org/doi/10.1073/pnas.1821936116 | Estudio en física introductoria (Harvard). Los alumnos con active learning aprendieron más pero percibieron aprender menos. | Indirecta: apoya diseñar para esfuerzo, no para fluidez aparente. No es de idiomas. | [B] (abstract en varios resultados) |
| Project Zero (HGSE, desde 1967; Gardner, Perkins, Ritchhart). https://pz.harvard.edu | Grupo de investigación; Teaching for Understanding, Cultures of Thinking, Visible Thinking. | Marco pedagógico general (hacer visible el pensamiento). Inteligencias múltiples de Gardner: sin respaldo empírico sólido como base de estilos de aprendizaje. | [B] |
| Case method (Harvard Law/Business School) | Aprendizaje basado en casos reales. | Análogo útil: casos técnicos reales como contexto (CLIL/ESP). No es un método de lenguas. | [M] |
| Harvard Extension / Language Center, cursos de idiomas | Cursos convencionales con métodos comunicativos. | Sin método propio. | [M] |

**Equivalente con evidencia que proponemos llamar internamente «método basado en ciencia del aprendizaje»:** recuperación activa + espaciado + intercalado + producción con feedback + contenido técnico con contexto (CLIL/ESP) + práctica distribuida y corta. Recomendación de producto: no usar la marca «Harvard» en la app (riesgo de afirmación engañosa); decir «basado en investigación sobre recuperación, espaciado y aprendizaje activo» y citar los estudios.

---

## 2. Principios con evidencia y su traducción a la app

**Retrieval practice / testing effect.** Roediger & Karpicke (2006), *Psychological Science* 17(3), 249-255 [M]. Meta-análisis: Adesope, Trevisan & Sundararajan (2017), *Rethinking the Use of Tests: A Meta-Analysis of Practice Testing*, Review of Educational Research 87(3) https://journals.sagepub.com/doi/10.3102/0034654316689306 [B, vía resumen: 118 artículos, 272 tamaños de efecto, N=15.472; la práctica con pruebas supera a reestudiar; efecto robusto a todos los intervalos]. Evidencia: **fuerte**. App: toda tarjeta se presenta «primero intenta recordar» antes de mostrar respuesta; quizzes de bajo riesgo en vez de releer.

**Repetición espaciada.** Cepeda, Pashler, Vul, Wixted & Rohrer (2006), *Psychological Bulletin* 132, 354-380 https://pubmed.ncbi.nlm.nih.gov/16719566/ [B: 839 evaluaciones, 317 experimentos, 184 artículos; el intervalo óptimo crece con el intervalo de retención]. Algoritmos: SM-2 (Wozniak, SuperMemo) [M]; FSRS (Ye et al., KDD 2022 «A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling») [B de segunda mano vía blogs; la mejora de ~12,6 % que citan es de resumen no verificado]. Evidencia del espaciado: **fuerte**; que FSRS supere a SM-2 en resultados de aprendizaje real: **moderada** (métricas de predicción de recuerdo, no ensayos con alumnos). App: cola diaria de repaso; empezar con un SM-2 simplificado o Leitner por cajas (cero coste, fácil de testear) y dejar FSRS (existe implementación open source) como mejora. Guardar por ítem: estabilidad/intervalo, dificultad, último resultado.

**Interleaving (intercalado).** Rohrer & Taylor (2007) y revisiones; casi toda la evidencia es de matemáticas/categorías, poca en vocabulario L2 [M]. Evidencia en idiomas: **débil-moderada**. App: mezclar tipos de ítems y temas en una sesión de repaso en vez de bloques de un solo tema.

**Elaboración, ejemplos concretos y dual coding.** Paivio (codificación dual) [M]; elaboración en memoria [M]. Evidencia: **moderada**. App: cada término técnico con frase de ejemplo real (log, PR, test), un diagrama o captura cuando aplique, y audio. Evitar listas de palabras sueltas.

**Desirable difficulties.** Bjork & Bjork (2011) [M]; ver sueño abajo. Evidencia: **moderada-fuerte** para espaciado/recuperación; el resto, heterogénea. App: no mostrar pistas por defecto; ofrecer «pista» como opción visible. Explicar al usuario que lo difícil es señal de aprendizaje (por Deslauriers 2019).

**Feedback inmediato vs diferido.** Hattie & Timperley (2007) [M]. Para vocabulario/ejercicios cerrados, feedback inmediato con la respuesta correcta funciona; para producción, feedback con criterios. Evidencia: **moderada** (resultados mixtos según tarea). Corrective feedback en L2: Li (2010) *Language Learning* 60, 309-365 y Lyster & Saito (2010) *SSLA* 32 [B: efecto medio; los prompts superan a los recasts en aula; meta-análisis de 15 estudios, N=827 en Lyster & Saito]. App: tras cada ejercicio, mostrar respuesta + explicación breve; en producción, mostrar modelo y rúbrica, no solo «correcto/incorrecto».

**Carga cognitiva.** Sweller (1988 en adelante) [M]. Evidencia: **moderada-fuerte**. App: una idea por pantalla, texto + audio coordinados, andamiaje que se retira con el nivel.

**Comprehensible input / i+1.** Krashen (1982, 1985) [M]. Críticas: constructos i e i+1 difíciles de operacionalizar; output, interacción e instrucción explícita pesan más de lo que Krashen decía [B, de revisiones recientes, p. ej. Frontiers in Psychology 2025 https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12577063/]. Extensive reading: Nakanishi (2015), *TESOL Quarterly* [B vía snippet: d=0,98 velocidad, 0,63 comprensión, 0,18 vocabulario]. Evidencia: **moderada** (input es necesario, no suficiente). App: lecturas y podcasts graduados por nivel (aprox. 95-98 % de palabras conocidas, regla práctica de Nation [M]); resúmenes con glosario.

**CLIL y ESP.** Graham et al. (2018), revisión sistemática de content-based instruction (25 artículos: efectos positivos o neutros, problemas metodológicos) [B]. Meta-análisis sobre CLIL/EMI en secundaria con d≈0,73 corto plazo (otro snippet) [B, no verificado en la fuente]. ESP: la literatura es sobre todo descriptiva (necesidades, corpus, géneros), con pocos meta-análisis de efecto [B]. Evidencia: **moderada** para CLIL en jóvenes, **débil/descriptiva** para adultos profesionales (ESP). Muy aplicable: tu producto es CLIL/ESP puro. App: unidades donde el contenido (p. ej. «cómo funciona un pipeline CI») se enseña en inglés al nivel del alumno, con vocabulario técnico extraído de corpus (documentación, issues, PRs).

**Output hypothesis.** Swain (1985, 1995) [M]. Producir lenguaje obliga a procesarlo sintácticamente y a notar vacíos. Evidencia: **moderada**. App: ejercicios de producción (escribir un commit message, describir un bug, grabar un standup) con comparación contra un modelo.

**Shadowing.** Revisión sistemática de 44 estudios sobre pronunciación [B: mejora comprensibilidad, fluidez y prosodia; segmentos, inconcluso]. Evidencia: **moderada**. App: botón «shadowing» sobre audios modelo con velocidad ajustable y grabación propia.

**Extensive listening.** Evidencia más escasa que extensive reading [M]. Evidencia: **débil-moderada**. App: feed de podcasts por nivel con transcripción y marcado de palabras nuevas.

**Sueño y consolidación.** Mazza et al. (2016), *Psychological Science* 27(10), «Relearn Faster and Retain Longer: Along With Practice, Sleep Makes Perfect» https://www.psychologicalscience.org/journals/psychological-science/0956797616659930/ [B vía snippet: aprender-dormir-reaprender redujo a la mitad la práctica necesaria y mejoró la retención]. Evidencia: **moderada** (vocabulario, muestra pequeña, estudio de laboratorio). App: preferir 1 sesión diaria corta y repaso al día siguiente; sugerir repaso por la mañana de lo visto la noche anterior.

**Microlearning y sesiones cortas.** Se sostiene sobre espaciado, no por sí mismo. [M]. Evidencia: **moderada**. App: sesiones de 10-15 min con un final claro («has terminado hoy»).

**Motivación (SDT).** Ryan & Deci (2000); Noels, Pelletier, Clément & Vallerand (2000), *Language Learning* 50, 57-85 https://selfdeterminationtheory.org/wp-content/uploads/2019/06/2000_NoelsPelletierVallerand_wiley.pdf [B]. Meta-análisis multinivel SDT y aprendizaje de idiomas (Alamer et al.) [B: motivación autónoma correlaciona positivamente con logro L2; correlacional, no causal]. Evidencia: **moderada**. App: autonomía (elegir ruta técnica: QA/backend/frontend/IA y tema), competencia (can-do visibles, feedback informativo no punitivo), relación (opcional: compartir progreso con un compañero; con ≤20 usuarios es viable).

---

## 3. Gamificación

**Qué sabemos.**
- Eficacia de Duolingo: el estudio de Vesselinov & Grego (2012), financiado por Duolingo (con análisis independiente), midió ~91 puntos WebCAPE en 8 semanas, más eficaz en principiantes [B vía TechCrunch/snippets; conflicto de interés]. Loewen et al. (2019), *ReCALL* 31(3), 293-311, N=9, correlación moderada entre tiempo y ganancias [B]. Evidencia sobre aprendizaje real de Duolingo: **débil-moderada** (muestras pequeñas, patrocinio).
- Meta-análisis de gamificación (Bai et al. y otros): efectos medios en logro, g ≈ 0,50 en general y ≈ 0,38 en idiomas [B vía snippet; no verificado]. Interpretar con cautela: heterogeneidad y sesgo de publicación frecuentes.
- Rachas: RCT de Aulagnon, Cristia, Cueto & Malamud (2026), IPR WP-26-05 «Streaks to Success?»: 60.000 alumnos de 4.º-6.º en Perú, destacar rachas aumentó uso y mejoró matemáticas frente a control (1.500 con prueba final), sin diferencias claras frente a otros brazos [B]. Es la mejor evidencia causal, pero es en niños y matemáticas.

**Resumen por mecánica (para adultos profesionales):**

| Mecánica | Efecto en aprendizaje | Efecto en enganche | Recomendación |
|---|---|---|---|
| Racha | Indirecto (más práctica distribuida); RCT en niños | Alto | Sí, con «congelación»/días de descanso sin castigo y sin culpa |
| XP | Sin evidencia propia | Medio | Solo como retroalimentación secundaria; XP por recuperación correcta, no por tiempo |
| Ligas / leaderboards | Evidencia de aprendizaje no clara; riesgo de ansiedad | Medio-alto | No en MVP; con ≤20 usuarios, mejor opcional o por equipos |
| Vidas | Penaliza el error, contrario a desirable difficulties | Bajo-medio | Evitar |
| Recordatorios | Mejoran uso (RCT arriba) | Alto | Sí, personalizados y con límite; configurables |
| Logros/insignias | Sin evidencia de aprendizaje | Bajo-medio | Ligados a hitos pedagógicos (can-do, nivel) |

**Patrones oscuros a evitar:** pérdida de racha con culpa, notificaciones manipuladoras («Duo está triste»), vidas que bloquean aprender, comparación social forzada, microtransacciones, contadores que premian tiempo en pantalla. [M, criterio de diseño ético + literatura de dark patterns, no verificado en fuente específica].

**Apps para adultos [M, no investigado a fondo]:** Busuu (estudio de eficacia propio, con Universidad de Columbia/Universidad Estatal de Nueva York según su white paper, patrocinado; lo vi listado en búsqueda sin abrirlo), Babbel (contenido de diálogos reales, clase corta y repaso espaciado), Speak (conversación con IA; no aplicable por tu regla de coste), ELSA (pronunciación con reconocimiento de voz; tampoco aplicable sin servicio), Brilliant (aprendizaje activo y problemas interactivos, sin idiomas). Lo común: tono sobrio, feedback específico, lecciones de dominio profesional, menos gamificación infantil. Verifica estas descripciones antes de comunicarlas.

---

## 4. Métricas de «avance semanal» con sentido pedagógico

Propuesta (todas calculables con los datos de la propia app, sin LLM):

1. **Minutos de práctica activa y días practicados** (distribución, no solo total): apoya el espaciado. Meta sugerida: 4-5 días/semana.
2. **Precisión de recuperación diferida:** % de aciertos en ítems con intervalo ≥ 7 días (la métrica más cercana a retención real).
3. **Ítems consolidados:** número de ítems cuya estabilidad/intervalo supera un umbral (p. ej. ≥ 21 días) y cambio semanal.
4. **Vocabulario dominado por nivel CEFR** (A1...C2) y por área técnica (QA, backend, frontend, IA). Referencia de tamaño de vocabulario: Nation (2006) [M]; usar solo como orientación.
5. **Can-do statements** del CEFR y su Companion Volume (Consejo de Europa, 2020) [M] adaptados a trabajo técnico (p. ej. «Puedo explicar un bug en un standup»); autoevaluados y confirmados con una tarea.
6. **Producción:** nº de grabaciones/escritos con autoevaluación por rúbrica y cambio en la puntuación.
7. **Errores recurrentes** (los 3 ítems que más fallo).

Evitar como métrica principal: XP, nº de lecciones completadas, racha. Mostrarlas como contexto, no como objetivo.

Evidencia: el uso de estas métricas es práctica de diseño, no hay estudio que valide este conjunto exacto. Evidencia: **débil** (pero consistente con la teoría del espaciado y la recuperación).

---

## 5. Simulacros de entrevista técnica en inglés sin LLM

La búsqueda devolvió sobre todo guías y rúbricas de servicios de carreras universitarios (Princeton, USC, Memphis, Oregon State) [B]; no encontré estudios controlados que midan el efecto de estos formatos en ESL. Evidencia: **débil**, pero el diseño es una combinación de principios con evidencia (práctica deliberada, shadowing, rúbricas criteriales).

Formato recomendado:
1. **Banco de preguntas por rol y nivel** (conductuales, técnicas, de sistema, de «cuéntame un bug»): etiquetadas por competencia y dificultad CEFR (B1 a C1).
2. **Estructura STAR** (Situación, Tarea, Acción, Resultado), 60-90 s; plantilla con frases conectoras por nivel («First, ...», «As a result, ...»).
3. **Respuestas modelo** en texto y audio (grabadas por un humano o TTS local; ojo con la licencia), con frases destacadas y variantes B1/B2/C1.
4. **Shadowing de la respuesta modelo** (para fluidez y prosodia, por la revisión de 44 estudios).
5. **Grabación propia + autoevaluación** con rúbrica fija: contenido (40 %, p. ej. STAR y ejemplo concreto), claridad y pronunciación inteligible, fluidez/ritmo, vocabulario técnico, estructura. Comparar con el modelo y marcar 2 puntos a mejorar.
6. **Repetir la misma pregunta tras 3-7 días** (espaciado) y comparar la rúbrica.
7. **Revisión por pares opcional** (con ≤20 usuarios, intercambiar grabaciones): aporta feedback humano y el componente de relación de SDT; requiere consentimiento y privacidad.
8. **Timer y modo «simulacro»** (preguntas aleatorias, sin pistas) vs modo «estudio».

Riesgo: la autoevaluación de hablantes de nivel bajo es poco fiable [M]; por eso la rúbrica debe tener descriptores observables, no solo escalas de 1 a 5.

---

## Tabla final: Principio → funcionalidad → prioridad MVP (A2) → evidencia

| Principio | Funcionalidad concreta | Prioridad MVP (A2) | Evidencia |
|---|---|---|---|
| Retrieval practice | Tarjetas y quizzes «recuerda antes de ver», con intento obligatorio | Alta | Fuerte |
| Repetición espaciada | Cola diaria de repaso (Leitner/SM-2 simple; FSRS después) | Alta | Fuerte (espaciado) / Moderada (FSRS) |
| Feedback inmediato + explicación | Respuesta correcta y explicación breve tras cada ejercicio | Alta | Moderada |
| CLIL / ESP | Lecciones de contenido técnico (QA/backend/frontend/IA) en inglés graduado | Alta | Moderada (adultos: débil/descriptiva) |
| Comprehensible input | Lecturas y podcasts graduados con transcripción y glosario | Alta | Moderada |
| Microlearning | Sesiones de 10-15 min con fin claro | Alta | Moderada |
| Ejemplos concretos y dual coding | Frase de ejemplo real, audio y diagrama por término | Alta | Moderada |
| Carga cognitiva | Una idea por pantalla, andamiaje que se retira por nivel | Alta | Moderada-fuerte |
| SDT: autonomía y competencia | Elegir ruta/tema; can-do visibles; feedback no punitivo | Alta | Moderada |
| Racha + recordatorios | Racha con días de gracia; recordatorio opcional y configurable | Media | Moderada (RCT en niños) |
| Métricas de avance | Panel semanal: minutos, precisión diferida, ítems consolidados, can-do | Alta | Débil (diseño) |
| Output hypothesis | Ejercicios de producción escrita guiada con modelo comparativo | Media | Moderada |
| Shadowing | Audios modelo con velocidad ajustable y grabación propia | Media | Moderada |
| Simulacro de entrevista | Banco STAR + modelo + grabación + rúbrica de autoevaluación | Media (B1+), baja en A2 | Débil |
| Desirable difficulties | Pistas opcionales, dificultad adaptativa simple, mensaje sobre esfuerzo | Media | Moderada |
| Interleaving | Mezcla de tipos de ítems en repasos | Baja-media | Débil-moderada |
| Sueño y consolidación | Sugerir repaso al día siguiente; cierre de sesión con mensaje de descanso | Baja | Moderada |
| Extensive listening | Feed de podcasts por nivel con seguimiento de minutos | Media | Débil-moderada |
| XP / logros | XP por recuperación correcta; insignias por hitos pedagógicos | Baja | Débil |
| Ligas / vidas | No implementar en el MVP (ligas opcionales por equipo más adelante) | Evitar | Débil (aprendizaje) y riesgo de daño |
| Revisión por pares | Intercambio de grabaciones entre usuarios | Baja | Débil |

## Pendientes de verificación (para quien continúe)

- Abrir y confirmar los textos completos: Adesope 2017, Cepeda 2006, Deslauriers 2019, Aulagnon et al. 2026 (cifras de efecto), Mazza 2016, la revisión de shadowing y los meta-análisis de gamificación/CLIL citados por snippet.
- Confirmar con fuente primaria las afirmaciones sobre Busuu, Babbel, ELSA, Speak y Brilliant.
- Buscar evidencia específica de ESP/IT y de simulacros de entrevista en ESL (no encontré estudios controlados).
