# language: es
@acceso @regresion
Característica: Registro con invitación
  Para usar la app de forma privada
  Como persona invitada
  Quiero crear mi cuenta con el enlace que me compartieron

  @smoke-local
  Escenario: Registro con invitación válida
    Dado que el admin generó una invitación
    Cuando abro el enlace y creo mi cuenta con una contraseña válida
    Entonces veo la pantalla para elegir mi nivel

  Escenario: Invitación revocada
    Dado que el admin generó una invitación y la revocó
    Cuando abro el enlace
    Entonces veo el mensaje "Acceso no autorizado"
    Y no veo el formulario de registro

  @a11y
  Escenario: Formulario de registro accesible
    Dado que el admin generó una invitación
    Cuando abro el enlace
    Entonces la página no tiene violaciones de accesibilidad graves
