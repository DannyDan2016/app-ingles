# language: es
@aprendizaje @regresion @local-only
Característica: Glosario en la lectura

  Escenario: Consultar y guardar una palabra desde la lectura
    Dado que tengo una cuenta con nivel "A2"
    Cuando empiezo la siguiente lección desde Hoy
    Y toco la palabra "commit" de la lectura
    Entonces veo un diálogo con "confirmación (commit)"
    Cuando pulso Escape
    Entonces el diálogo se cierra y el foco vuelve a la palabra "commit"
    Cuando toco la palabra "commit" de la lectura
    Y pulso «Guardar en mi repaso»
    Entonces el diálogo indica "Guardada"
    Cuando pulso «Guardar en mi repaso»
    Entonces el diálogo indica "Ya estaba en tu repaso"
