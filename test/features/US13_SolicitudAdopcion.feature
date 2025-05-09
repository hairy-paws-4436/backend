Feature: US13 Solicitud de adopción
  Como adoptante
  quiero poder enviar una solicitud formal de adopción
  para iniciar el proceso de adopción de una mascota

  Scenario: Enviar solicitud de adopción
    Given el usuario "Adoptante" está viendo el perfil de la mascota <mascota>
    When haga clic en el botón "Adopción"
    And completa el formulario
    And haga clic en "Enviar Solicitud"
    Then el sistema registrará la solicitud con estado "Pendiente"
    And enviará una notificación al dueño o ONG

  Scenario: Solicitud de adopción sin información completa
    Given el usuario "Adoptante" está viendo el perfil de la mascota "Luna"
    When haga clic en el botón "Adopción"
    And no completa todos los campos requeridos del formulario
    And haga clic en "Enviar Solicitud"
    Then el sistema mostrará un mensaje de error "Por favor complete todos los campos obligatorios"