Feature: US09 Marcado de mascota como adoptada
  Como dueño/ONG
  quiero poder marcar una mascota como adoptada
  para completar el proceso de adopción

  Scenario: Marcar mascota como adoptada después de aprobar solicitud
    Given el usuario "ONG" ha aprobado una solicitud de adopción para "Luna"
    And el proceso de adopción se ha completado
    When navega a la sección "Mis Mascotas"
    And selecciona la mascota "Luna"
    And hace clic en "Marcar como Adoptada"
    And selecciona al adoptante de la lista de solicitudes aprobadas
    And opcionalmente agrega una nota "Adopción exitosa el 15/05/2025"
    And hace clic en "Confirmar Adopción"
    Then el sistema cambia el estado de la mascota a "Adoptada"