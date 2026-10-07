# language: es
@aprendizaje @regresion @local-only
Característica: Escuchar

  Escenario: Completar un tramo de escucha con sus tres pasadas
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Escuchar"
    Entonces la lista de Escuchar incluye el tramo "demo-t1"
    Cuando abro el tramo "demo-t1"
    Y completo las tres pasadas
    Y respondo las 3 preguntas del tramo
    Entonces veo el tramo completado
    Y la página no tiene violaciones de accesibilidad graves
