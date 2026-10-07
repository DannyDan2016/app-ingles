# language: es
@aprendizaje @regresion
Característica: Lecciones

  # Lo único que se comprueba contra el preview (sin contenido demo): abrir la primera lección real del camino A2.
  @smoke
  Escenario: Abrir la primera lección del camino A2 desde Hoy
    Dado que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Entonces veo el paso "Lectura" de la lección

  # Depende de la lección demo-01 (CONTENT_DEMO=1, orden 0): solo en el stack local.
  @smoke @responsive @local-only
  Escenario: Completar la lección demo-01 de punta a punta
    Dado que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Y continúo hasta el video
    Y salto el video
    Y resuelvo los 5 ejercicios fallando uno a propósito
    Entonces veo el resumen "Lección completada"
    Y en el camino A2 la lección "A Small Commit" está "Hecho"
    Y Hoy muestra el estado del repaso y no desborda
    Y la página no tiene violaciones de accesibilidad graves

  # Salir de la lección envía el tiempo acumulado a POST /api/actividad desde el navegador.
  # FALLA hoy en el stack Docker (403): ver informe D1, bug del control de origen.
  @local-only
  Escenario: El medidor registra el tiempo de práctica al salir de la lección
    Dado que registro las peticiones de red
    Y que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Y permanezco unos segundos en la pantalla
    Y abro la sección "Camino"
    Entonces el tiempo de práctica se registró en el servidor

  @a11y @local-only
  Escenario: Completar la lección demo-01 solo con el teclado
    Dado que uso solo el teclado
    Y que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Y continúo hasta el video
    Y salto el video
    Y resuelvo los 5 ejercicios fallando uno a propósito
    Entonces veo el resumen "Lección completada"
    Y la página no tiene violaciones de accesibilidad graves

  # RNF-PRI-01: nada de YouTube hasta que la persona pulsa «Reproducir video».
  @local-only
  Escenario: El video no contacta con YouTube hasta pulsar reproducir
    Dado que registro las peticiones de red
    Y que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Y continúo hasta el video
    Entonces no hay ningún iframe ni petición a YouTube
    Y la miniatura se pide a i.ytimg.com
    Cuando pulso «Reproducir video»
    Entonces existe un iframe de youtube-nocookie
