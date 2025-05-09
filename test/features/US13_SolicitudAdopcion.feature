Feature: US13 Solicitud de adopción
  Como adoptante
  quiero poder enviar una solicitud formal de adopción
  para iniciar el proceso de adopción de una mascota

  Scenario Outline: Enviar solicitud de adopción
    Given el usuario "Adoptante" está viendo el perfil de la mascota <mascota>
    When haga clic en el botón "Adopción"
    And completa el formulario con información <motivacion>, <condiciones_vivienda>, <experiencia_previa>
    And haga clic en "Enviar Solicitud"
    Then el sistema registrará la solicitud con estado "Pendiente"
    And enviará una notificación al dueño o ONG
    Then el sistema cambia el estado de la mascota a "Adoptada"
    Examples:
      | mascota | motivacion                      | condiciones_vivienda     | experiencia_previa |
      | "Luna"  | "Busco un compañero fiel"       | "Departamento con terraza" | "Sí"              |
      | "Max"   | "Quiero darle un hogar amoroso" | "Casa con jardín"          | "No"              |

  Scenario: Solicitud de adopción sin información completa
    Given el usuario "Adoptante" está viendo el perfil de la mascota "Luna"
    When haga clic en el botón "Adopción"
    And no completa todos los campos requeridos del formulario
    And haga clic en "Enviar Solicitud"
    Then el sistema mostrará un mensaje de error "Por favor complete todos los campos obligatorios"