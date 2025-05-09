Feature: US21 Confirmación de donación
  Como ONG
  quiero poder confirmar la recepción de donaciones
  para mantener transparencia con los donantes

  Scenario Outline: Confirmar recepción de donación
    Given el usuario "ONG" ha recibido una donación con ID <donacion_id>
    And está en la sección "Notificaciones"
    When selecciona la donación <donacion_id>
    And haga clic en "Confirmar Recepción"
    And agrega una nota de agradecimiento <nota>
    And haga clic en "Confirmar"
    Then el sistema actualizará el estado de la donación a "Confirmada"
    And enviará una notificación al donante

    Examples:
      | donacion_id | nota                                              |
      | "D001"      | "¡Gracias por tu ayuda para nuestros rescatados!" |
      | "D002"      | "Tu donación ayudará a mejorar nuestro albergue"  |