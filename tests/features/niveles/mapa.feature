# language: es
@niveles @regresion
Característica: Mapa de niveles

  @a11y
  Escenario: Empezar en A2
    Dado que tengo una cuenta nueva
    Cuando elijo "A2" como nivel inicial
    Entonces A1 aparece como "Omitido", A2 como "En curso" y B1 como "Bloqueado"
    Y la página no tiene violaciones de accesibilidad graves

  # El viewport lo fija el proyecto de Playwright (360x800, 768x1024 y 1366x768): una ejecución por tamaño.
  @responsive
  Escenario: Flujo de invitación a mapa sin scroll horizontal
    Dado que el admin generó una invitación
    Cuando abro el enlace
    Entonces no aparece scroll horizontal
    Cuando creo mi cuenta con una contraseña válida
    Entonces no aparece scroll horizontal
    Cuando elijo "A2" como nivel inicial
    Entonces no aparece scroll horizontal
    Y la página no tiene violaciones de accesibilidad graves
    Cuando cierro mi sesión
    Entonces no aparece scroll horizontal
