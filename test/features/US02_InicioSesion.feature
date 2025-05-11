Feature: US02 Inicio de sesión
  Como usuario registrado
  quiero iniciar sesión en la plataforma
  para acceder a mis funcionalidades

  Scenario Outline: Inicio de sesión exitoso
    Given el usuario está en la página de inicio de sesión
    When ingresa el correo <email>
    And ingresa la contraseña <password>
    And hace clic en "Iniciar Sesión"
    Then el sistema valida las credenciales correctamente
    And redirige al usuario según su rol <role>

    Examples:
      | email                 | password     |
      | "adoptante@gmail.com" | "Pass123!"   |
      | "dueno@gmail.com"    | "Pass123!"   |
      | "ong@gmail.com"       | "Pass123!"   |

  Scenario: Inicio de sesión con credenciales incorrectas
    Given el usuario está en la página de inicio de sesión
    When ingresa el correo "usuario@gmail.com"
    And ingresa una contraseña incorrecta "ContraseñaIncorrecta123!"
    And hace clic en "Iniciar Sesión"
    Then el sistema muestra un mensaje de error "Correo electrónico o contraseña incorrectos"
    And el usuario permanece en la página de inicio de sesión

  Scenario: Inicio de sesión con autenticación de dos factores
    Given el usuario está en la página de inicio de sesión
    And tiene habilitada la autenticación de dos factores
    When ingresa credenciales correctas
    And hace clic en "Iniciar Sesión"
    Then el sistema solicita el código de verificación
    When el usuario ingresa el código correcto
    Then el sistema completa el inicio de sesión