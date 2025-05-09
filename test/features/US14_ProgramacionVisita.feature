Feature: US14 Programación de visita
  Como adoptante/dueño/ONG
  quiero poder programar una visita
  para conocer a la mascota/adoptante

  Scenario Outline: Solicitar una visita como adoptante
    Given el usuario "Adoptante" está viendo el perfil de la mascota <mascota>
    When hace clic en "Visita"
    And selecciona una fecha <fecha> y hora <hora> disponibles
    And ingresa un mensaje <motivo> para la visita
    And hace clic en "Solicitar Visita"
    Then el sistema registra la solicitud de visita con estado "Pendiente"
    And envía una notificación al dueño o ONG

    Examples:
      | mascota | fecha        | hora    | motivo                                |
      | "Rocky" | "2025-05-20" | "15:00" | "Me interesa conocerlo personalmente" |
      | "Nala"  | "2025-05-22" | "10:30" | "Quisiera evaluar su interacción con niños" |

  Scenario: Aprobar solicitud de visita
    Given el usuario "Dueño" tiene una solicitud de visita pendiente
    And está en la sección "Notificaciones"
    When selecciona una solicitud
    And hace clic en "Aprobar Visita"
    And hace clic en "Confirmar"
    Then el sistema actualiza el estado de la visita a "Aprobada"
    And envía una notificación al adoptante

  Scenario: Rechazar solicitud de visita
    Given el usuario "ONG" tiene una solicitud de visita pendiente
    And está en la sección "Notificaciones"
    When selecciona una solicitud
    And hace clic en "Rechazar Visita"
    And ingresa un motivo "No estamos disponibles en esa fecha"
    And hace clic en "Confirmar"
    Then el sistema actualiza el estado de la visita a "Rechazada"
    And envía una notificación al adoptante con el motivo