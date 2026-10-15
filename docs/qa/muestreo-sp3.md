# Muestreo del usuario — contenido SP3 (bancos A2/B1 + lecciones B1)

Antes de pasar a `revisado: true`. Marca cada punto como OK o anota qué cambiar. Los videos se ven en YouTube en el tramo indicado (`start`–`end` en segundos). La redacción y la revisión Opus no pudieron leer las transcripciones porque YouTube devolvió captcha/429, así que **el listening es lo que más necesita tu oído**.

## Banco A2 — `content/a2/evaluacion-a2.yaml`

- [ ] **Lectura `a2-ev-l1` «A Slow Checkout Page» (q01–q05).** Comprueba que q01 y q05 tienen una sola respuesta y que la glosa de «checkout» se lee natural.
- [ ] **Listening `a2-ev-v2`, [What is a database in under 4 minutes](https://www.youtube.com/watch?v=Tk1t3WKK-ZY&t=15s), 15–105 s (q16–q20).** Confirma o ajusta `start`/`end`. q17 es la pregunta más especulativa y q18 depende de una frase concreta.
- [ ] **Video `a2-ev-v1`, [What is an LLM?](https://www.youtube.com/watch?v=qMxuthTIQq4&t=10s), 10–100 s.** Confirma el tramo y que el ritmo es apto para A2.
- [ ] **q13:** ¿se oye «Large Language Model» entre los segundos 10 y 100?
- [ ] **q15:** ¿el video dice que trabaja con lenguaje o texto?
- [ ] **q23:** «A ___ is a program that talks with you in text». Acepta chatbot, bot y chat bot. ¿Hay otra respuesta válida?
- [ ] **q39:** «If the test will fail, we fix the bug today.» está marcada como falsa. ¿Es natural la frase?
- [ ] **q10:** ¿«use it» se entiende claramente como Design B?

## Banco B1 — `content/b1/evaluacion-b1.yaml`

- [ ] **Lectura `b1-ev-l2` «Orders Lost During a Promotion» (q06–q10).** Cambiaron el título, el texto y dos preguntas.
- [ ] **Listening `b1-ev-v2`, [Message Queues in System Design](https://www.youtube.com/watch?v=DYFocSiPOl8&t=15s), 15–115 s (q16–q20).** ¿Se dicen *asynchronous*, el caso del consumidor caído y *producer/consumer* dentro del tramo? Si no, ajusta `start`/`end`.
- [ ] **Video `b1-ev-v1`, [Why do we split data into train test and validation sets?](https://www.youtube.com/watch?v=dSCFk168vmo&t=5s), 5–125 s (q11–q15).** Confirma el tramo. Las preguntas son generales.
- [ ] **q15:** ordenar el flujo de datos. ¿Se responde con el video o solo con conocimiento previo?
- [ ] **q18:** completar *asynchronous*/*async*. ¿Lo dice el video en el tramo?
- [ ] **q22:** *flaky*. ¿Aceptar también «intermittent»?
- [ ] **q32:** *was testing*. ¿Basta la pista del enunciado?
- [ ] **q37:** *used to*. ¿La pista «dos palabras» es natural?

## Lecciones B1 (pendiente desde 2026-10-13)

- [ ] 2 lecciones a tu elección de `content/b1/` (por ejemplo `b1-qa-01` y `b1-backend-02`) y 1 tramo (por ejemplo `b1-ia-t1`), viendo sus videos.

Cuando des el OK (o pases los cambios), se pone `revisado: true` en los 2 bancos y en las 12 lecciones/tramos B1, en un commit aparte.
