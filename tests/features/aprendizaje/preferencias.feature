# language: es
@aprendizaje @regresion
Característica: Preferencias y niveles sin contenido

  @a11y
  Escenario: El tema oscuro y la meta diaria se conservan
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la sección "Perfil"
    Y elijo el tema "Oscuro" y lo guardo
    Entonces la aplicación usa el tema oscuro
    Cuando recargo la página
    Entonces la aplicación usa el tema oscuro
    Y la página no tiene violaciones de accesibilidad graves
    Cuando elijo una meta diaria de 15 minutos y la guardo
    Entonces Hoy muestra "de 15 min"

  Escenario: Un nivel posterior sigue bloqueado hasta aprobar la evaluación
    Dado que tengo una cuenta con nivel "A2"
    Cuando abro la página "/camino/B1"
    Entonces el nivel "B1" aparece "Bloqueado"
