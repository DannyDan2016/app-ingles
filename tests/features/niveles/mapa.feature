# language: es
@niveles @regresion
Característica: Mapa de niveles

  @a11y
  Escenario: Empezar en A2
    Dado que tengo una cuenta nueva
    Cuando elijo "A2" como nivel inicial
    Entonces A1 aparece como "Omitido", A2 como "En curso" y B1 como "Bloqueado"
    Y la página no tiene violaciones de accesibilidad graves

  @responsive
  Esquema del escenario: Sin scroll horizontal en <dispositivo>
    Dado que tengo una cuenta con nivel elegido
    Cuando veo mis niveles en una pantalla de <ancho>x<alto>
    Entonces no aparece scroll horizontal

    Ejemplos:
      | dispositivo | ancho | alto |
      | celular     | 360   | 800  |
      | tablet      | 768   | 1024 |
      | desktop     | 1366  | 768  |
