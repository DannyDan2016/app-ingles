---
tipo: requisitos
proyecto: app-ingles
estado: borrador
actualizado: 2026-10-04
---
# Requisitos — App de inglés técnico

> Documento de requisitos (no es el diseño técnico). La arquitectura se define después en el spec de cada subproyecto (`brainstorming` → `writing-plans`).
> Convención: **[S]** = suposición nuestra, pendiente de confirmar por el usuario. Todo lo que no lleva [S] lo dijo el usuario o está en `decisiones.md`.

---

> **Actualización 2026-10-04 (respuestas del usuario):**
> - P1: usuarios ≤ 10, cada uno en **un solo dispositivo** (PC o celular); progreso y cuentas en **Neon Postgres**.
> - P2: **usuario y contraseña** + enlace de invitación.
> - P3: MVP en nivel **A2**.
> - P4: 80 % + lecciones completadas.
> - P5: podcasts desde YouTube o RSS.
> - P6: `.ics` primero.
> - P7: YouTube embebido aprobado.
>
> Estas respuestas mandan sobre las propuestas marcadas con [S] que las contradigan (p. ej., progreso solo local o acceso por enlace).

## 1. Visión y objetivo

Una web app responsive (desktop y celular) para aprender inglés **desde A1 hasta nivel nativo**, siempre en contexto de **tecnología: desarrollo con IA, QA, backend y frontend**. Se aprende con lecturas, podcasts, videos de YouTube reproducidos dentro de la app, música, ejercicios de listening y speaking, simulacros de entrevista y evaluaciones para pasar de nivel, más recordatorios y un traductor/vocabulario sin IA. El acceso es privado (por enlace o usuario y contraseña), el coste es 0 y el proyecto sirve también como **pieza de portfolio QA**.

**Objetivo medible:** que un usuario pueda completar un nivel de punta a punta (estudiar → practicar → aprobar la evaluación → desbloquear el siguiente) desde el celular y desde el PC, sin salir de la app y con coste 0.

### Usuarios / personas
| Persona | Descripción | Necesidad principal |
|---|---|---|
| **Aprendiz** (el usuario y < 20 conocidos) | Perfil técnico (dev, QA) que quiere inglés para trabajo y entrevistas. | Practicar en ratos cortos desde el celular y avanzar de nivel con evidencia. |
| **Curador** (el usuario + Claude/Ollama) | Prepara y revisa el contenido (lecturas, links, ejercicios, preguntas). | Añadir contenido sin tocar código complejo y sin publicar links rotos. |
| **Mantenedor / QA** (el usuario) | Despliega, prueba y enseña el repo como portfolio. | CI verde, pruebas de seguridad antes de publicar y un framework de QA presentable. |

- [S] La interfaz está en español y el contenido de estudio en inglés.
- [S] «Nativo» se interpreta como C2 del MCER (A1, A2, B1, B2, C1, C2 = 6 niveles).

---

## 2. Restricciones y decisiones vigentes

Fuente: `_cerebro/10-proyectos/app-ingles/decisiones.md` y `_cerebro/30-recursos/reglas-seguridad.md`.

| # | Restricción / decisión | Origen |
|---|---|---|
| R1 | **Coste 0**: nada de planes de pago, API keys de pago ni servicios con cobro. | reglas-seguridad §1 |
| R2 | **Sin LLM ni agente de IA dentro de la app.** Traductor y vocabulario con diccionario offline (sin IA). | decisiones 2026-10-04 «Sin LLM dentro de la app» |
| R3 | **Hosting en Vercel (plan gratis)**: excepción acotada a la regla de terceros, solo para el hosting. | decisiones 2026-10-04 «Hosting en Vercel» |
| R4 | **Requisito duro**: nada en el código ni en el deploy puede dar acceso al PC del usuario. Pruebas de seguridad **antes** de publicar. | decisiones «Hosting en Vercel» + reglas-seguridad §3 |
| R5 | **QA esencial y continuo**: se cubre lo esencial, no toda la plataforma, y se hace QA al cerrar cada subproyecto. | decisiones «QA esencial y continuo» |
| R6 | Estándar de portfolio: **POM, datos en YAML, multiambiente, BDD en español, Docker y CI en GitHub Actions**. | Memoria del usuario |
| R7 | **Ollama local** solo para tareas no-dev (investigación, borradores de diseño y contenido, curaduría de YouTube). PC con 23 GB de RAM, sin GPU dedicada. | decisiones «Ollama local para tareas no-dev» |
| R8 | Nunca se suben `.env`, credenciales ni datos personales a ningún modelo externo ni al repo. | reglas-seguridad §4 |
| R9 | Contenido **curado por nosotros**; usuarios < 20. | Decisión posterior del usuario |

**Excepciones que faltan por registrar en `decisiones.md`** (ver §9): embebido de YouTube (Google recibe datos del visitante), proveedor de push del navegador y, si se elige, una base de datos gratuita externa.

### Fuera de alcance (YAGNI)
- Agente de IA, chat de dudas o cualquier LLM en la app (descartado en R2).
- Traducción de frases o textos completos (el usuario pidió traducir **palabras**).
- Apps nativas de tiendas (iOS/Android); se cubre con web responsive + PWA.
- Registro abierto, pagos, ranking social, chat entre usuarios.
- Panel de administración web: el contenido se edita en archivos versionados en el repo.
- Letras completas de canciones (derechos de autor).
- Escalar a más de 20 usuarios.

---

## 3. Subproyectos (orden de construcción)

Se mantienen los 5 propuestos, con un ajuste: la **curaduría y validación de contenido** se trata como épica transversal desde el SP2, porque sin ella se publican links rotos o inventados por Ollama.

| Orden | Subproyecto | Incluye | Depende de |
|---|---|---|---|
| SP1 | **Base** | Acceso privado, niveles, progreso, layout responsive, CI/CD a Vercel, cabeceras de seguridad, framework de QA base. | — |
| SP2 | **Contenido y ejercicios** | Lecturas, videos embebidos, podcasts, música, listening, ejercicios con feedback, vocabulario y traductor, validación de contenido. | SP1 (layout, progreso, modelo de nivel) |
| SP3 | **Evaluaciones y paso de nivel** | Prueba por nivel, umbral de aprobado, desbloqueo, historial. | SP1 (progreso), SP2 (contenido por nivel) |
| SP4 | **Speaking y entrevistas** | Grabar y escuchar, shadowing, simulacros de entrevista técnica. | SP1, SP2 (lecturas/audios de referencia) |
| SP5 | **Recordatorios** | Recordatorios en calendario (.ics), PWA instalable, notificaciones push opcionales. | SP1 (deploy HTTPS, PWA base) |

SP4 y SP5 son independientes entre sí y pueden ir en paralelo cuando terminen SP1–SP3.

---

## 4. Épicas e historias de usuario

Prioridad MoSCoW: **M** = Must, **S** = Should, **C** = Could, **W** = Won't (esta vez). Tamaño: S/M/L.

### EP1 — Acceso privado (SP1)

#### EP1-HU01 · Entrar con enlace privado · M · M
Como **aprendiz** quiero **entrar a la app con el enlace que me compartieron** para **no tener que registrarme**.

```gherkin
Característica: Acceso por enlace privado
  Escenario: Acceso con enlace válido
    Dado que tengo un enlace de invitación válido
    Cuando lo abro en el navegador
    Entonces entro a la página de inicio
    Y la sesión se mantiene al volver a abrir la app en el mismo dispositivo

  Escenario: Acceso con enlace inválido o caducado
    Dado que tengo un enlace con un código incorrecto o revocado
    Cuando lo abro en el navegador
    Entonces veo la pantalla "Acceso no autorizado"
    Y no se muestra ningún contenido de la app

  Escenario: Acceso directo a una página interna sin sesión
    Dado que no tengo sesión
    Cuando abro directamente la URL de una lección
    Entonces me redirige a la pantalla de acceso
```

#### EP1-HU02 · Revocar el acceso · S · S
Como **mantenedor** quiero **invalidar un enlace compartido** para **cortar el acceso si se filtra**.

```gherkin
Característica: Revocación de acceso
  Escenario: Enlace revocado deja de funcionar
    Dado que revoqué el enlace de invitación y publiqué el cambio
    Cuando alguien abre la app con el enlace antiguo
    Entonces ve "Acceso no autorizado"
```

#### EP1-HU03 · Usuario y contraseña · C · M
Como **aprendiz** quiero **entrar con usuario y contraseña** para **recuperar mi progreso en otro dispositivo**.
> Depende de la pregunta abierta P1 (dónde se guarda el progreso). Si el progreso es solo local, esta historia pasa a W.

```gherkin
Característica: Inicio de sesión con credenciales
  Escenario: Credenciales correctas
    Dado que tengo una cuenta creada por el mantenedor
    Cuando inicio sesión con mi usuario y contraseña
    Entonces veo mi progreso guardado

  Escenario: Demasiados intentos fallidos
    Dado que he fallado la contraseña 5 veces en 15 minutos
    Cuando lo intento otra vez
    Entonces veo "Demasiados intentos, espera 15 minutos"
```

### EP2 — Niveles y progreso (SP1)

#### EP2-HU01 · Ver el mapa de niveles · M · S
Como **aprendiz** quiero **ver los niveles A1–C2 con su estado** para **saber dónde estoy y qué me falta**.

```gherkin
Característica: Mapa de niveles
  Escenario: Estado de cada nivel
    Dado que aprobé A1 y estoy cursando A2
    Cuando abro el mapa de niveles
    Entonces A1 aparece como "Aprobado", A2 como "En curso" y B1 a C2 como "Bloqueado"
    Y veo el porcentaje de lecciones completadas de A2
```

#### EP2-HU02 · Elegir nivel inicial · M · S
Como **aprendiz** quiero **elegir mi nivel de partida** para **no repetir lo que ya sé**.

```gherkin
Característica: Nivel inicial
  Escenario: Elegir nivel en el primer acceso
    Dado que es mi primer acceso
    Cuando elijo "B1" como nivel inicial
    Entonces B1 queda "En curso" y A1-A2 quedan como "Omitido"

  Escenario: El nivel inicial solo se elige una vez
    Dado que ya elegí mi nivel inicial
    Cuando vuelvo a la pantalla de inicio
    Entonces no se me vuelve a preguntar el nivel
```

#### EP2-HU03 · Guardar y exportar progreso · M · M
Como **aprendiz** quiero **que mi progreso se guarde y poder exportarlo/importarlo** para **no perderlo y pasarlo a otro dispositivo**.
> [S] Propuesta sin terceros: progreso en el dispositivo + exportar/importar un archivo. Pendiente de P1.

```gherkin
Característica: Persistencia del progreso
  Escenario: El progreso sobrevive al cerrar el navegador
    Dado que completé la lección "APIs REST" de A2
    Cuando cierro y vuelvo a abrir la app
    Entonces la lección sigue marcada como completada

  Escenario: Importar un archivo inválido
    Dado que tengo un archivo que no es una exportación de la app
    Cuando intento importarlo
    Entonces veo "Archivo no válido" y mi progreso actual no cambia
```

#### EP2-HU04 · Prueba de ubicación · C · M
Como **aprendiz** quiero **hacer una prueba corta para que la app me sugiera el nivel** para **no adivinarlo**.

```gherkin
Característica: Prueba de ubicación
  Escenario: Sugerencia de nivel
    Dado que respondo la prueba de ubicación de 20 preguntas
    Cuando termino
    Entonces la app me sugiere un nivel y puedo aceptarlo o elegir otro
```

### EP3 — Layout responsive (SP1)

#### EP3-HU01 · Usar la app en celular y desktop · M · M
Como **aprendiz** quiero **usar la app cómodamente en el celular y en el PC** para **estudiar donde esté**.

```gherkin
Característica: Diseño responsive
  Escenario: Celular
    Dado que abro la app en una pantalla de 360x800
    Cuando navego a una lección
    Entonces no aparece scroll horizontal
    Y la navegación principal está en un menú accesible con el pulgar

  Escenario: Desktop
    Dado que abro la app en una pantalla de 1366x768
    Cuando navego a una lección
    Entonces el texto no supera 80 caracteres por línea
```

### EP4 — Despliegue seguro (SP1)

#### EP4-HU01 · Despliegue automático tras CI verde · M · M
Como **mantenedor** quiero **que la app se publique en Vercel solo si pasa el CI** para **no publicar algo roto o inseguro**.

```gherkin
Característica: Pipeline de publicación
  Escenario: CI verde publica
    Dado que fusiono una rama a main con todos los checks en verde
    Cuando termina el pipeline
    Entonces la versión queda publicada en la URL de producción

  Escenario: Un check de seguridad falla
    Dado que el escaneo de secretos detecta una credencial en el código
    Cuando corre el pipeline
    Entonces el pipeline falla y no se publica nada
```

#### EP4-HU02 · Puerta de seguridad antes de publicar · M · M
Como **mantenedor** quiero **pasar una batería de pruebas de seguridad antes de la primera publicación y de cada release** para **garantizar que nada da acceso a mi PC**.

```gherkin
Característica: Pruebas de seguridad previas a publicar
  Escenario: Batería completa en verde
    Dado un despliegue de preview
    Cuando ejecuto la batería de seguridad
    Entonces el escaneo dinámico no reporta alertas altas ni medias
    Y no hay dependencias con vulnerabilidades altas o críticas
    Y ninguna configuración apunta a localhost, a la IP del PC ni a runners propios

  Escenario: Cabecera de seguridad ausente
    Dado que una respuesta no incluye Content-Security-Policy
    Cuando corre la prueba de cabeceras
    Entonces la prueba falla indicando la ruta afectada
```

### EP5 — Contenido de estudio (SP2)

#### EP5-HU01 · Lecturas en contexto técnico · M · M
Como **aprendiz** quiero **leer textos de mi nivel sobre IA, QA, backend o frontend** para **aprender vocabulario en contexto real**.

```gherkin
Característica: Lecturas por nivel
  Escenario: Ver lecturas de mi nivel
    Dado que estoy en B1
    Cuando abro "Lecturas"
    Entonces veo solo lecturas de B1 etiquetadas con su tema (IA, QA, backend o frontend)

  Escenario: Completar una lectura
    Dado que abro una lectura
    Cuando respondo sus preguntas de comprensión
    Entonces la lectura queda "Completada" en mi progreso
```

#### EP5-HU02 · Ver videos de YouTube dentro de la app · M · M
Como **aprendiz** quiero **ver los videos dentro de la app** para **no salir a YouTube y distraerme**.

```gherkin
Característica: Video embebido
  Escenario: Reproducción sin redirección
    Dado que abro una lección con video
    Cuando pulso reproducir
    Entonces el video se reproduce dentro de la página de la lección
    Y la URL de la app no cambia

  Escenario: Video no disponible
    Dado que un video fue eliminado o tiene el embebido deshabilitado
    Cuando abro la lección
    Entonces veo "Video no disponible" y el resto de la lección funciona
```

#### EP5-HU03 · Escuchar podcasts · S · M
Como **aprendiz** quiero **escuchar episodios de podcast de tecnología en la app** para **entrenar el oído con conversaciones reales**.
> [S] Se reproducen episodios por su URL de audio pública (feed RSS) en un reproductor propio, o como video de YouTube si el podcast está allí. Ver P5.

```gherkin
Característica: Reproducción de podcast
  Escenario: Escuchar un episodio
    Dado que abro un episodio de podcast de B2
    Cuando pulso reproducir
    Entonces el audio suena en la app y puedo cambiar la velocidad a 0.75x, 1x y 1.25x
```

#### EP5-HU04 · Aprender con música · C · M
Como **aprendiz** quiero **escuchar una canción y completar huecos de un fragmento corto** para **aprender expresiones de forma amena**.

```gherkin
Característica: Ejercicio con canción
  Escenario: Completar huecos de un fragmento
    Dado que abro una canción embebida desde YouTube
    Cuando completo los huecos del fragmento
    Entonces veo cuáles acerté

  Escenario: No se publican letras completas
    Dado el archivo de contenido de una canción
    Cuando se valida en CI
    Entonces falla si el fragmento de letra supera el límite de líneas definido
```

#### EP5-HU05 · Ejercicios de listening · M · M
Como **aprendiz** quiero **escuchar un audio o video y responder preguntas** para **medir cuánto entiendo**.

```gherkin
Característica: Listening
  Escenario: Responder tras escuchar
    Dado que abro un ejercicio de listening de A2
    Cuando respondo las 5 preguntas
    Entonces veo mi puntuación y la respuesta correcta de cada pregunta fallada
```

#### EP5-HU06 · Ejercicios de práctica con feedback · M · M
Como **aprendiz** quiero **hacer ejercicios (opción múltiple, completar, ordenar) con corrección inmediata** para **fijar lo aprendido**.

```gherkin
Característica: Ejercicios de práctica
  Escenario: Respuesta correcta
    Dado un ejercicio de opción múltiple
    Cuando elijo la opción correcta
    Entonces veo "Correcto" y la explicación breve

  Escenario: Respuesta incorrecta
    Dado un ejercicio de completar
    Cuando escribo una respuesta incorrecta
    Entonces veo "Incorrecto", la respuesta esperada y puedo reintentar
```

### EP6 — Vocabulario y traductor sin IA (SP2)

#### EP6-HU01 · Traducir una palabra al tocarla · M · M
Como **aprendiz** quiero **tocar una palabra desconocida y ver su traducción** para **no salir del texto**.

```gherkin
Característica: Traductor de palabras offline
  Escenario: Palabra encontrada
    Dado que estoy leyendo una lectura
    Cuando toco la palabra "deployment"
    Entonces veo su traducción al español y su categoría gramatical en menos de 300 ms

  Escenario: Palabra no encontrada
    Dado que toco una palabra que no está en el diccionario
    Cuando se busca
    Entonces veo "Sin traducción disponible" y la opción de guardarla igualmente
```

#### EP6-HU02 · Guardar palabras en mi vocabulario · M · S
Como **aprendiz** quiero **guardar palabras en mi lista** para **repasarlas después**.

```gherkin
Característica: Lista de vocabulario
  Escenario: Guardar palabra
    Dado que veo la traducción de "flaky"
    Cuando pulso "Guardar"
    Entonces "flaky" aparece en mi vocabulario con la frase donde la encontré

  Escenario: Palabra duplicada
    Dado que "flaky" ya está en mi vocabulario
    Cuando la guardo otra vez
    Entonces no se duplica y veo "Ya está en tu vocabulario"
```

#### EP6-HU03 · Repasar vocabulario · S · M
Como **aprendiz** quiero **repasar mis palabras con tarjetas** para **memorizarlas a largo plazo**.

```gherkin
Característica: Repaso con tarjetas
  Escenario: Repaso del día
    Dado que tengo 10 palabras pendientes de repaso hoy
    Cuando hago el repaso y marco 7 como "La sé"
    Entonces esas 7 se programan para un repaso más espaciado y las 3 restantes para mañana
```

#### EP6-HU04 · Escuchar la pronunciación · C · S
Como **aprendiz** quiero **oír cómo se pronuncia una palabra** para **decirla bien**.
> Usa la síntesis de voz del navegador. Ver riesgo RG6 (algunas voces son en línea).

```gherkin
Característica: Pronunciación
  Escenario: Reproducir pronunciación
    Dado que veo la traducción de "queue"
    Cuando pulso el icono de altavoz
    Entonces escucho la palabra en inglés
```

### EP7 — Evaluaciones y paso de nivel (SP3)

#### EP7-HU01 · Presentar la evaluación de nivel · M · L
Como **aprendiz** quiero **hacer una evaluación del nivel actual** para **demostrar que lo domino**.
> [S] Umbral de aprobado: 80 %. Cubre lectura, listening, vocabulario y gramática. Ver P4.

```gherkin
Característica: Evaluación de nivel
  Escenario: Aprobar
    Dado que completé el 100 % de las lecciones obligatorias de A2
    Cuando presento la evaluación de A2 y obtengo 85 %
    Entonces A2 queda "Aprobado" y B1 pasa a "En curso"

  Escenario: Suspender
    Dado que presento la evaluación de A2
    Cuando obtengo 60 %
    Entonces A2 sigue "En curso" y B1 sigue "Bloqueado"
    Y veo qué bloques debo reforzar

  Escenario: Evaluación sin lecciones completas
    Dado que tengo lecciones obligatorias pendientes en A2
    Cuando intento abrir la evaluación
    Entonces veo cuántas lecciones me faltan y no puedo empezarla
```

#### EP7-HU02 · Ver resultado detallado · M · S
Como **aprendiz** quiero **ver mis fallos explicados** para **saber qué estudiar**.

```gherkin
Característica: Resultado de evaluación
  Escenario: Detalle por bloque
    Dado que terminé una evaluación
    Cuando abro el resultado
    Entonces veo la nota por bloque (lectura, listening, vocabulario, gramática) y cada pregunta fallada con la respuesta correcta
```

#### EP7-HU03 · Reintentar con preguntas distintas · S · M
Como **aprendiz** quiero **que al reintentar cambien las preguntas** para **que la nota refleje lo que sé y no la memoria**.

```gherkin
Característica: Reintento de evaluación
  Escenario: Banco de preguntas
    Dado que suspendí la evaluación de B1
    Cuando la presento de nuevo
    Entonces al menos el 50 % de las preguntas son distintas a las del intento anterior
```

### EP8 — Speaking (SP4)

#### EP8-HU01 · Grabarme y escucharme · M · M
Como **aprendiz** quiero **grabar mi voz leyendo una frase y compararla con el audio modelo** para **mejorar mi pronunciación sin enviar mi voz a nadie**.

```gherkin
Característica: Grabación local
  Escenario: Grabar y comparar
    Dado que concedo permiso de micrófono
    Cuando grabo la frase y pulso "Escuchar"
    Entonces escucho mi grabación y el audio modelo uno tras otro
    Y la grabación no se envía a ningún servidor

  Escenario: Permiso de micrófono denegado
    Dado que deniego el permiso de micrófono
    Cuando intento grabar
    Entonces veo cómo activar el permiso y puedo seguir con el resto del ejercicio
```

#### EP8-HU02 · Shadowing · S · S
Como **aprendiz** quiero **repetir frases justo después del audio** para **ganar fluidez y ritmo**.

```gherkin
Característica: Shadowing
  Escenario: Secuencia de frases
    Dado un ejercicio de shadowing de 5 frases
    Cuando lo inicio
    Entonces cada frase suena y luego se abre una ventana de grabación de la misma duración más 2 segundos
```

#### EP8-HU03 · Transcripción automática con consentimiento · C · M
Como **aprendiz** quiero **ver lo que la app entendió de mi voz** para **detectar palabras mal pronunciadas**.
> Solo con consentimiento explícito: en Chrome el reconocimiento envía el audio a Google (riesgo RG5). Requiere registrar la excepción.

```gherkin
Característica: Reconocimiento de voz opcional
  Escenario: Sin consentimiento no se usa
    Dado que no he aceptado el aviso de reconocimiento de voz
    Cuando hago un ejercicio de speaking
    Entonces la app solo graba en local y no muestra transcripción

  Escenario: Navegador sin soporte
    Dado que uso un navegador sin reconocimiento de voz
    Cuando abro el ejercicio
    Entonces la opción de transcripción no aparece y el ejercicio funciona igual
```

### EP9 — Entrevistas técnicas (SP4)

#### EP9-HU01 · Simulacro de entrevista · M · M
Como **aprendiz** quiero **responder preguntas de entrevista técnica en inglés con tiempo límite** para **prepararme para entrevistas reales**.

```gherkin
Característica: Simulacro de entrevista
  Escenario: Responder una pregunta
    Dado que elijo el rol "QA" y el nivel B2
    Cuando empieza el simulacro
    Entonces veo y escucho la pregunta, tengo 2 minutos para grabar mi respuesta
    Y al terminar veo una respuesta modelo y una lista de comprobación para autoevaluarme
```

#### EP9-HU02 · Banco de preguntas por rol · M · S
Como **aprendiz** quiero **filtrar preguntas por rol (IA, QA, backend, frontend) y nivel** para **practicar lo que me interesa**.

```gherkin
Característica: Filtro de preguntas
  Escenario: Filtrar por rol
    Dado el banco de preguntas de entrevista
    Cuando filtro por "Backend" y "C1"
    Entonces solo veo preguntas con ambas etiquetas

  Escenario: Filtro sin resultados
    Dado que no hay preguntas para "Frontend" en "A1"
    Cuando aplico ese filtro
    Entonces veo "Aún no hay preguntas para este filtro"
```

### EP10 — Recordatorios (SP5)

#### EP10-HU01 · Añadir recordatorios a mi calendario · M · S
Como **aprendiz** quiero **descargar un recordatorio recurrente para mi calendario** para **que mi celular me avise aunque la app esté cerrada**.
> [S] Propuesta sin terceros y compatible con iPhone: archivo `.ics` con alarma, que gestiona la app de calendario del dispositivo.

```gherkin
Característica: Recordatorio en calendario
  Escenario: Generar recordatorio
    Dado que elijo lunes a viernes a las 19:00 y 20 minutos
    Cuando pulso "Añadir a mi calendario"
    Entonces se descarga un archivo .ics con un evento recurrente y una alarma de 0 minutos

  Escenario: Sin días seleccionados
    Dado que no selecciono ningún día
    Cuando pulso "Añadir a mi calendario"
    Entonces veo "Elige al menos un día" y no se descarga nada
```

#### EP10-HU02 · Instalar la app (PWA) · S · M
Como **aprendiz** quiero **instalar la app en la pantalla de inicio** para **abrirla como una app más**.

```gherkin
Característica: PWA instalable
  Escenario: Instalación
    Dado que abro la app en un navegador compatible
    Cuando elijo "Instalar" o "Añadir a pantalla de inicio"
    Entonces la app abre a pantalla completa con su icono y nombre
```

#### EP10-HU03 · Notificación push diaria · C · L
Como **aprendiz** quiero **recibir una notificación diaria si no he estudiado** para **mantener la racha**.
> Depende de P6 (excepción del servicio push del navegador) y de los límites de tareas programadas del plan gratis de Vercel. En iPhone exige PWA instalada (iOS 16.4+).

```gherkin
Característica: Notificación diaria
  Escenario: Usuario suscrito
    Dado que activé las notificaciones y hoy no estudié
    Cuando llega la hora configurada
    Entonces recibo "Te esperan 10 minutos de inglés"

  Escenario: iPhone sin PWA instalada
    Dado que uso Safari en iPhone sin instalar la app
    Cuando abro los ajustes de notificaciones
    Entonces veo instrucciones para instalarla primero
```

### EP11 — Curaduría y validación de contenido (transversal, desde SP2)

#### EP11-HU01 · Contenido en archivos versionados · M · M
Como **curador** quiero **definir lecciones, ejercicios y evaluaciones en archivos YAML con un esquema** para **añadir contenido sin tocar código y que CI detecte errores**.

```gherkin
Característica: Validación de esquema de contenido
  Escenario: Contenido válido
    Dado un archivo de lección con nivel, tema, tipo y preguntas
    Cuando corre la validación en CI
    Entonces pasa y la lección aparece en su nivel

  Escenario: Campo obligatorio ausente
    Dado un archivo de lección sin el campo "nivel"
    Cuando corre la validación en CI
    Entonces falla indicando el archivo y el campo
```

#### EP11-HU02 · Validar links de YouTube · M · S
Como **curador** quiero **que un script compruebe que cada video existe y permite embebido** para **no publicar links inventados o rotos (p. ej. propuestos por Ollama)**.

```gherkin
Característica: Validación de links de video
  Escenario: Link inexistente
    Dado un archivo de contenido con un ID de YouTube que no existe
    Cuando corre el validador
    Entonces falla indicando el archivo y el ID

  Escenario: Revisión periódica
    Dado que el contenido ya está publicado
    Cuando corre la revisión semanal programada
    Entonces se reportan los videos que dejaron de estar disponibles
```

#### EP11-HU03 · Revisión humana del contenido generado · M · S
Como **curador** quiero **que todo contenido redactado por Ollama pase una revisión antes de publicarse** para **no enseñar inglés incorrecto**.

```gherkin
Característica: Revisión de contenido
  Escenario: Contenido sin revisar
    Dado un archivo con "revisado: false"
    Cuando corre la validación en CI sobre main
    Entonces falla y el contenido no se publica
```

---

## 5. MVP

**Corte propuesto:** SP1 completo + núcleo de SP2 y SP3 para **un solo nivel completo** (el nivel actual del usuario, ver P3).

| Incluye | Historias |
|---|---|
| Acceso privado y seguridad | EP1-HU01, EP4-HU01, EP4-HU02 |
| Niveles y progreso | EP2-HU01, EP2-HU02, EP2-HU03 |
| Responsive | EP3-HU01 |
| Contenido mínimo del nivel | EP5-HU01, EP5-HU02, EP5-HU05, EP5-HU06 |
| Traductor y vocabulario | EP6-HU01, EP6-HU02 |
| Evaluación | EP7-HU01, EP7-HU02 |
| Calidad del contenido | EP11-HU01, EP11-HU02, EP11-HU03 |

**Volumen de contenido del MVP [S]:** 8 lecciones (2 por tema: IA, QA, backend, frontend), cada una con 1 lectura, 1 video y 1 ejercicio; 4 ejercicios de listening; 1 evaluación de 20 preguntas con banco de 40.

**Por qué este corte:** entrega el ciclo completo que da valor (estudiar → practicar → evaluar → desbloquear) en celular y PC, valida la decisión de despliegue y la puerta de seguridad (requisito duro R4) desde el primer día, y deja el framework de QA listo para el portfolio. Speaking, entrevistas, música, podcasts y recordatorios suman valor, pero no hacen falta para demostrar el ciclo y tienen riesgos abiertos (privacidad de voz, derechos de autor, push en iPhone) que conviene decidir antes.

---

## 6. Requisitos no funcionales

| ID | Tipo | Requisito medible | Cómo se verifica |
|---|---|---|---|
| RNF-SEG-01 | Seguridad | 0 secretos en el repo y en el historial de git. | Escáner de secretos en CI (bloqueante). |
| RNF-SEG-02 | Seguridad | 0 dependencias con vulnerabilidades altas o críticas. | Auditoría de dependencias en CI (bloqueante). |
| RNF-SEG-03 | Seguridad | Escaneo dinámico (baseline) contra preview con 0 alertas altas y 0 medias sin justificar. | Escáner dinámico en Docker, en local o CI, antes de cada release. |
| RNF-SEG-04 | Seguridad | Todas las rutas salvo la de acceso devuelven redirección o 401 sin sesión válida (incluidos archivos de contenido y del diccionario). | Prueba de API/E2E por ruta. |
| RNF-SEG-05 | Seguridad | Cabeceras en todas las respuestas: CSP (frames solo de `youtube-nocookie.com`), HSTS, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy` (micrófono solo `self`), `X-Content-Type-Options`. | Prueba automatizada de cabeceras. |
| RNF-SEG-06 | Seguridad | Cookie de sesión `HttpOnly`, `Secure`, `SameSite=Lax`; códigos/secretos de acceso de ≥ 128 bits de entropía y solo en variables de entorno de Vercel. | Prueba de API + revisión. |
| RNF-SEG-07 | Seguridad (R4) | Ninguna configuración, variable ni código apunta a `localhost`, IP privada o dominio del PC; sin túneles; CI solo con runners alojados por GitHub (sin self-hosted); token de Vercel con alcance mínimo como secreto de GitHub. | Checklist + búsqueda automatizada en CI. |
| RNF-REN-01 | Rendimiento | Lighthouse móvil: Rendimiento ≥ 85; LCP ≤ 2,5 s y CLS ≤ 0,1 en las páginas de inicio y lección. | Lighthouse en CI sobre preview. |
| RNF-REN-02 | Rendimiento | JS inicial ≤ 200 KB comprimido; el diccionario se carga bajo demanda y su búsqueda responde en ≤ 300 ms (p95) en un celular de gama media. | Presupuesto de bundle en CI + medición manual. |
| RNF-ACC-01 | Accesibilidad | WCAG 2.2 AA; 0 violaciones «serious» o «critical» de axe en las páginas del MVP. | axe dentro de las pruebas E2E. |
| RNF-ACC-02 | Accesibilidad | Todo el flujo del MVP se completa solo con teclado; objetivos táctiles ≥ 24×24 px (meta 44×44); contraste ≥ 4,5:1. | E2E con teclado + revisión manual. |
| RNF-RES-01 | Responsive | Sin scroll horizontal de 360 a 1920 px; probado en 360×800, 768×1024 y 1366×768. | E2E multi-viewport. |
| RNF-RES-02 | Compatibilidad | Últimas 2 versiones de Chrome, Edge, Firefox y Safari (iOS y macOS). | E2E en Chromium, Firefox y WebKit + prueba manual en iPhone y Android reales. |
| RNF-PRI-01 | Privacidad | Sin analítica, sin cookies de terceros propias; videos con `youtube-nocookie.com` y carga diferida (el iframe no se carga hasta pulsar reproducir). | Inspección de peticiones en E2E. |
| RNF-PRI-02 | Privacidad | El audio de voz no sale del dispositivo salvo consentimiento explícito (EP8-HU03). | E2E: 0 peticiones de red durante la grabación. |
| RNF-PRI-03 | Privacidad | Solo se pide un alias; ningún dato personal adicional. | Revisión de formularios. |
| RNF-COS-01 | Coste | 0 € al mes; dentro de los límites del plan gratis de Vercel. | Revisión mensual del panel de uso. |

---

## 7. Estrategia de QA esencial

**Principio:** se automatiza por riesgo, no por cobertura. Cada subproyecto se cierra con su suite en verde + regresión del anterior (R5). El framework sigue el estándar de portfolio (R6): POM, datos de prueba en YAML, multiambiente (`local`, `preview`, `prod` solo con humo), BDD en español, ejecución en Docker y CI en GitHub Actions.
[S] Herramientas candidatas (se deciden en el spec): Playwright + capa BDD en español, axe-core, un escáner dinámico tipo OWASP ZAP en Docker, escáner de secretos y auditoría de dependencias.

| Riesgo | Qué se automatiza | Nivel |
|---|---|---|
| Acceso no autorizado / exposición del PC (máx.) | Rutas protegidas, enlace inválido/revocado, cookie, cabeceras, secretos, dependencias, escaneo dinámico, checklist R4. | API + E2E + CI de seguridad |
| Paso de nivel incorrecto (alto) | Cálculo de nota, umbral, desbloqueo, banco de preguntas en reintento. | Unit (lógica) + E2E (aprobar y suspender) |
| Progreso perdido (alto) | Persistencia, exportar/importar, archivo inválido. | Unit + E2E |
| Contenido roto o inventado (alto) | Esquema YAML, IDs de YouTube existentes y embebibles, `revisado: true`, límite de letra de canciones. | Scripts en CI + revisión semanal programada |
| Video que redirige fuera (medio) | El iframe se carga en la página y la URL no cambia. | E2E |
| Traductor (medio) | Búsqueda encontrada / no encontrada, guardar sin duplicar. | Unit + E2E |
| Responsive y accesibilidad (medio) | 3 viewports, axe en páginas del MVP, navegación con teclado. | E2E |
| Rendimiento (medio) | Lighthouse y presupuesto de bundle. | CI |

**Queda manual (con checklist en el repo):**
- Pruebas en iPhone y Android reales: audio, micrófono, instalación PWA, `.ics` y notificaciones.
- Calidad pedagógica e inglés correcto del contenido (revisión EP11-HU03).
- Calidad de speaking y entrevistas (subjetiva).
- Revisión de derechos de autor de música y podcasts.
- Exploratoria por sesión al cerrar cada subproyecto (30–60 min, con notas).

**Muestra curada para el portfolio:** 10–15 escenarios Gherkin representativos (acceso, evaluación, traductor, video, seguridad), no todos los posibles.

---

## 8. Reparto por agente / skill

| Tarea | Agente / skill | Modelo | Nota |
|---|---|---|---|
| Requisitos (este documento) | `gestor-requisitos` | opus | — |
| Spec por subproyecto | Superpowers `brainstorming` → `writing-plans` | opus | Un spec por SP. |
| Implementación de la app | `subagent-driven-development` + `test-driven-development` | sonnet | — |
| Investigar versiones y buenas prácticas del framework QA | `qa-best-practices-researcher` | sonnet | — |
| Montar framework E2E/BDD (POM, YAML, multiambiente, Docker, CI) | `qa-implementer` | sonnet | — |
| Auditar el repo QA antes de enseñarlo | `qa-repo-reviewer` | opus | Solo lectura. |
| Verificar cada entrega con evidencia | `verificador` / `verification-before-completion` | sonnet (correr tests: haiku) | Otra terminal si hace falta. |
| Revisión de seguridad del código | `/security-review` | opus | Por PR relevante. |
| Batería de seguridad previa a publicar (escaneo dinámico, cabeceras, checklist R4, config Vercel/GitHub) | **HUECO** → crear con `crear-especialista` el agente `auditor-seguridad-web` | sonnet | Solo lectura + ejecución de escáneres en Docker. |
| Configurar Vercel + GitHub Actions (deploy) | **HUECO** → skill `deploy-vercel-seguro` (o incluirla en `auditor-seguridad-web`) | sonnet | Incluye token de alcance mínimo y sin runners propios. |
| Diseño UI responsive y accesible (componentes, sistema visual) | **HUECO** → skill `disenador-ui-accesible`; borradores (wireframes en texto, paletas, microcopys) **candidata Ollama** | sonnet (revisión) | — |
| Instalar y configurar Ollama (modelo, prompts, cómo validar su salida) | **HUECO** → skill `ollama-local` con `crear-especialista` | sonnet | Pendiente ya registrado en el vault. |
| Borradores de lecturas, ejercicios, preguntas de evaluación y entrevistas en YAML | **candidata Ollama** + **HUECO** skill `generar-contenido-ollama` (prompts + esquema) | Ollama → revisión sonnet | Siempre revisado antes de publicar (EP11-HU03). |
| Curaduría de YouTube | **candidata Ollama** solo para proponer temas, términos de búsqueda y canales; la búsqueda la hace el usuario y la verificación el script de EP11-HU02 | Ollama + script | Ollama no navega ni verifica URLs. |
| Validador de links y esquema (script) | `subagent-driven-development` | sonnet | Se ejecuta en CI. |
| Elegir diccionario offline EN→ES (licencia, tamaño, formato) | **HUECO** menor → subagente de investigación general | sonnet | Hace falta leer licencias reales; Ollama no sirve aquí. |
| Revisión de derechos de autor (música, podcasts) | Manual del usuario; borrador de checklist **candidata Ollama** | — | — |
| Resúmenes de sesión y borradores de notas del vault | **candidata Ollama** | Ollama | La escritura final, la sesión principal. |
| Respaldo si se acaban los tokens | `preparar-para-gemini` (manual) | — | Sin `.env` ni datos personales. |

---

## 9. Riesgos y preguntas abiertas (por impacto)

### Preguntas para el usuario
| # | Pregunta | Por qué importa | Propuesta |
|---|---|---|---|
| P1 | **¿El progreso debe sincronizarse entre celular y PC?** | Sincronizar exige una base de datos. Las gratuitas compatibles con Vercel (Neon, Upstash, Turso…) son **terceros** y necesitan una excepción en `decisiones.md`. | MVP solo en el dispositivo + exportar/importar (EP2-HU03), sin terceros. Decidir la sincronización después. |
| P2 | **¿Enlace compartido o usuario y contraseña?** | Sin base de datos, el enlace es lo más simple y seguro. Usuario/contraseña tiene sentido si P1 = sí. | Enlace privado con código largo y revocable (EP1-HU01/02). |
| P3 | **¿Cuál es tu nivel actual?** | Define qué nivel se llena primero en el MVP. | — |
| P4 | **¿Umbral de aprobado y requisitos para presentar la evaluación?** | Lógica central de SP3. | 80 % y 100 % de lecciones obligatorias completadas. |
| P5 | **¿Qué podcasts?** Embeber Spotify/Apple añade otro tercero. | Privacidad y alcance. | Audio directo del RSS público o podcasts que estén en YouTube. |
| P6 | **¿Aceptas el servicio push del navegador (Google/Apple/Mozilla) para notificaciones?** | Las push web pasan obligatoriamente por el servicio del fabricante. | MVP de SP5 con `.ics` (sin terceros); push solo como C. |
| P7 | **¿Registramos YouTube embebido como excepción?** | Al reproducir, Google recibe la IP del visitante. Lo pediste explícitamente, pero hay que registrarlo. | Sí, con `youtube-nocookie` y carga diferida. |

### Riesgos
| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| RG1 | Configuración que expone el PC (túneles, runners propios, tokens de Vercel con demasiados permisos, `.env` subido). | Crítico (R4) | RNF-SEG-01/07, `auditor-seguridad-web`, puerta EP4-HU02. |
| RG2 | **Ollama inventa URLs y comete errores de inglés.** Un LLM local no navega ni verifica que una URL exista; con 23 GB de RAM y sin GPU, un modelo de 7–8B cuantizado va lento (orden de pocos tokens/s, a confirmar al instalarlo). | Alto | Ollama nunca entrega URLs finales; validador EP11-HU02; revisión obligatoria EP11-HU03; lotes pequeños de contenido. |
| RG3 | Volumen de contenido A1–C2 (6 niveles × 4 temas) muy grande para curar a mano. | Alto | MVP con un nivel; mínimo por nivel definido; ritmo de curaduría semanal. |
| RG4 | **Música con derechos de autor**: las letras completas no se pueden copiar. | Alto (legal) | Solo video embebido oficial + fragmentos cortos (límite validado en CI); preferir canciones con licencia libre. |
| RG5 | **Reconocimiento de voz en Chrome envía el audio a Google**; Firefox no lo soporta. | Medio | Speaking base 100 % local (EP8-HU01); transcripción solo opcional con consentimiento (EP8-HU03). |
| RG6 | **Push en iPhone exige PWA instalada** (iOS 16.4+), y las tareas programadas del plan gratis de Vercel tienen límites. | Medio | `.ics` como recordatorio principal; push como C. |
| RG7 | Videos que desaparecen o deshabilitan el embebido. | Medio | Revisión semanal programada (EP11-HU02) + mensaje «Video no disponible». |
| RG8 | Diccionario offline: licencia y tamaño de descarga en el celular. | Medio | Investigación previa; carga bajo demanda (RNF-REN-02). |
| RG9 | Dependencia de Vercel y GitHub (cambios del plan gratis, límites de uso). | Bajo-medio | Contenido estático y app portable; revisar los términos al publicar. |
| RG10 | La síntesis de voz del navegador usa voces en línea en algunos navegadores. | Bajo | Elegir voces locales cuando estén disponibles; la pronunciación es C. |
