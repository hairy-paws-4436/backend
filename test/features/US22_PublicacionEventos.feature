Feature: US22 Publicación de eventos
  Como ONG
  quiero publicar eventos o campañas
  para promover la participación de la comunidad

  Scenario Outline: Crear un nuevo evento
    Given el usuario "ONG" está en la sección "Eventos"
    When haga clic en "Crear Evento"
    And completa el formulario con <titulo>, <descripcion>, <fecha>, <ubicacion>, <tipo>
    And sube una imagen para el evento
    And haga clic en "Publicar Evento"
    Then el sistema registrará el evento como "Activo"
    And el evento será visible para todos los usuarios

    Examples:
      | titulo                | descripcion                    | fecha        | ubicacion                | tipo        |
      | "Feria de Adopción"   | "Ven y conoce a nuestros rescatados" | "2025-06-15" | "Parque Kennedy, Miraflores" | "Adopción"  |
      | "Jornada de Limpieza" | "Ayúdanos a limpiar el albergue"     | "2025-06-20" | "Albergue Central, San Borja" | "Voluntario" |