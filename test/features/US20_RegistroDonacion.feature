Feature: US20 Registro de donación
  Como usuario
  quiero poder registrar mi intención de donación a una ONG
  para ayudar a las organizaciones que cuidan mascotas

  Scenario Outline: Registrar donación monetaria
    Given el usuario "Donante" está en el perfil de la ONG <ong>
    When selecciona la opción "Realizar Donación"
    And selecciona tipo de donación "Monetaria"
    And ingresa el monto <monto> y <Transaction ID>
    And sube comprobante de transferencia
    And ingresa <notas>
    And haga clic en "Confirmar Donación"
    Then el sistema registrará la donación con estado "Pendiente"
    And enviará una notificación a la ONG

    Examples:
      | ong       | monto | monto | notas                        |
      | "Patitas" | "100" |   1231   |"Para alimento de cachorros" |
      | "Huellas" | "50"  |   4141   |"Donación mensual"           |

  Scenario Outline: Registrar donación de productos
    Given el usuario "Donante" está en el perfil de la ONG <ong>
    When selecciona la opción "Realizar Donación"
    And selecciona tipo de donación "Productos"
    And agrega los productos <productos>
    And ingresa <notas>
    And haga clic en "Confirmar Donación"
    Then el sistema registrará la donación con estado "Pendiente"
    And enviará una notificación a la ONG

    Examples:
      | ong       | productos                      | notas                    |
      | "Patitas" | "Alimento para perros:5 kg"    | "Donación de alimento"   |
      | "Huellas" | "Camas:2, Juguetes:5, Ropa:3"  | "Donación mensual"       |