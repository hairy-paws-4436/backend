Feature: US01 Registro de usuario
  Como visitante
  quiero poder registrarme en la plataforma
  para acceder a las funcionalidades según mi rol (adoptante, dueño, ONG)

  Scenario Outline: Registro exitoso de usuario
    Given el visitante se encuentra en la página de registro
    When completa el formulario con <email>, <password>, <firstName>, <lastName>, <phoneNumber> y <address>
    And selecciona el rol <role>
    And acepta los términos y condiciones
    And hace clic en "Registrarse"
    Then el sistema crea la cuenta correctamente
    And muestra un mensaje de éxito "Tu cuenta ha sido creada exitosamente"
    And envía un correo de bienvenida al <email>

    Examples:
      | email                 | password     | firstName | lastName | phoneNumber | address       | role       |
      | "adoptante@gmail.com" | "Pass123!"   | "Juan"    | "Pérez"  | "987654321" | "Av. Lima 123" | "Adoptante" |
      | "dueno@gmail.com"    | "Pass123!"   | "María"   | "García" | "912345678" | "Jr. Arequipa 456" | "Dueño"    |
      | "ong@gmail.com"       | "Pass123!"   | "ONG"     | "Patitas" | "956781234" | "Av. Brasil 789" | "ONG"      |

  Scenario: Registro con email ya existente
    Given el visitante se encuentra en la página de registro
    When completa el formulario con email "existente@gmail.com" que ya está registrado
    And completa el resto de campos correctamente
    And hace clic en "Registrarse"
    Then el sistema muestra un mensaje de error "El correo electrónico ya está registrado"
    And no crea la cuenta