# language: es
@aprendizaje @regresion @local-only
Característica: Entrevistas

  Escenario: Filtrar preguntas y ver cómo responder
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Entrevistas"
    Y filtro las preguntas por rol "QA" y nivel "B2"
    Entonces veo la pregunta "How do you decide what to automate first?"
    Cuando abro la pregunta "How do you decide what to automate first?"
    Entonces veo la respuesta modelo, las estructuras y el vocabulario

  Escenario: Practicar shadowing frase a frase
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Entrevistas"
    Y abro la pestaña "Shadowing" y el set "Demo shadowing"
    Entonces veo "Frase 1 de 6"
    Cuando pulso "Siguiente"
    Entonces veo "Frase 2 de 6"
