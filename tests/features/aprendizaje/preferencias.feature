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

  Escenario: Un nivel sin contenido muestra un estado vacío claro
    Dado que tengo una cuenta con nivel "B1"
    Entonces veo el aviso "El contenido de B1 llega pronto" con enlace al camino A2
    Cuando abro la página "/camino/B1"
    Entonces veo el aviso "El contenido de B1 llega pronto" con enlace al camino A2
    Cuando abro la sección "Escuchar"
    Entonces veo el aviso "El contenido de B1 llega pronto" con enlace al camino A2
