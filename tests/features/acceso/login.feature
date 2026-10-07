# language: es
@acceso @seguridad @regresion
Característica: Acceso con usuario y contraseña

  Escenario: Página interna sin sesión
    Dado que no tengo sesión
    Cuando abro directamente una página privada
    Entonces me redirige a la pantalla de acceso

  @smoke-local
  Escenario: Login correcto
    Dado que tengo una cuenta con nivel elegido
    Y que cierro mi sesión
    Cuando entro con mi usuario y mi contraseña
    Entonces veo mi pantalla de inicio

  @a11y
  Escenario: Pantalla de acceso accesible
    Cuando abro la pantalla de acceso
    Entonces la página no tiene violaciones de accesibilidad graves

  @local-only
  Escenario: Bloqueo tras 5 intentos fallidos
    Dado que tengo una cuenta creada
    Cuando fallo la contraseña 5 veces
    Y lo intento otra vez con la contraseña correcta
    Entonces veo el mensaje "Demasiados intentos"
