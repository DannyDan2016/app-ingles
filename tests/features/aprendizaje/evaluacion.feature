# language: es
@aprendizaje @regresion @local-only
Característica: Evaluación de nivel

  Escenario: Aprobar la evaluación desbloquea el siguiente nivel
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y la página no contiene las soluciones
    Y veo el progreso de los 4 bloques
    Y respondo la primera pregunta con "Verdadero" y compruebo que se conserva al recargar
    Y respondo todas las preguntas con "Verdadero"
    Y envío la evaluación
    Entonces veo el resultado "Aprobado"
    Cuando abro la sección "Camino"
    Entonces el nivel "B1" aparece "En curso"
    Cuando abro la página "/camino/B1"
    Entonces veo el encabezado "Nivel B1"

  Escenario: Suspender lleva al refuerzo
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y respondo todas las preguntas con "Falso"
    Y envío la evaluación
    Entonces veo el resultado "No aprobado"
    Y veo el enlace "Hacer el refuerzo"
    Cuando sigo el enlace "Hacer el refuerzo"
    Entonces veo el primer ejercicio del refuerzo
    Cuando doy el refuerzo por completado
    Entonces el camino de "A2" indica cuándo reintentar
