# language: es
@aprendizaje @regresion @local-only
Característica: Repaso espaciado

  # Las tarjetas nuevas vencen mañana (caja 1): hoy no hay repasos. No hay rutas de test para forzar vencimientos;
  # las cajas y los vencimientos los cubren los tests de integración.
  Escenario: Tras completar la lección las palabras quedan en la Caja 1
    Dado que tengo una cuenta con nivel "A2"
    Y que completé la lección demo-01
    Cuando abro la sección "Hoy"
    Y abro la página "/repaso"
    Entonces no tengo repasos pendientes hoy
    Cuando abro la sección "Perfil"
    Entonces mi vocabulario tiene palabras en la Caja 1
