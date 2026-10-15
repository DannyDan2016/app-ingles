# language: es
@aprendizaje @regresion @local-only
Característica: Evaluación de nivel

  Escenario: Aprobar la evaluación desbloquea el siguiente nivel
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y la página no contiene las soluciones
    Y respondo todas las preguntas con "Verdadero"
    Y envío la evaluación
    Entonces veo el resultado "Aprobado"
    Cuando abro la sección "Camino"
    Entonces el nivel "B1" aparece "En curso"
    Cuando abro la página "/camino/B1"
    Entonces veo el aviso "El contenido de B1 llega pronto" con enlace al camino A2

  Escenario: Suspender lleva al refuerzo
    Dado que tengo una cuenta con nivel "A2" y todas sus lecciones completadas
    Cuando abro la evaluación de "A2"
    Y empiezo la evaluación
    Y respondo todas las preguntas con "Falso"
    Y envío la evaluación
    Entonces veo el resultado "No aprobado"
    Y veo el enlace "Hacer el refuerzo"
    Cuando sigo el enlace "Hacer el refuerzo"
    Y completo los ejercicios del refuerzo
    Entonces veo el refuerzo completado con la fecha para reintentar
