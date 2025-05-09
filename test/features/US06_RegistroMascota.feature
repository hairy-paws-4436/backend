Feature: US06 Registro de mascota
  Como dueño/ONG
  quiero crear un perfil detallado para mi mascota en adopción
  para que pueda ser visible en la plataforma y encontrar un hogar adecuado.

  Scenario Outline: Registrar una nueva mascota
    Given el <usuario> desea registrar una mascota para adopción
    And se encuentra en el apartado de "Mis Mascotas"
    When haga clic en el botón "Agregar mascota"
    And ingresa la información básica <nombre>, <tipo>, <raza>, <edad>, <género>, <descripción>
    And sube <numero_fotos> fotos de la mascota
    And haga clic en "Publicar"
    Then el sistema registrará la mascota correctamente
    And mostrará un mensaje de confirmación "Mascota registrada exitosamente"

    Examples:
      | usuario | nombre | tipo | raza     | edad | género | descripción              |
      | "ONG"   | "Luna" | "Perro" | "Mestizo" | "2"  | "Hembra" | "Amigable y juguetona" |
      | "Dueño" | "Max"  | "Gato" | "Siamés"  | "3"  | "Macho" | "Tranquilo y cariñoso" |

  Scenario: Fallar en el registro de mascota
    Given el "Dueño" desea registrar una mascota para adopción
    And se encuentra en el apartado de "Mis Mascotas"
    When haga clic en el botón "Agregar mascota"
    And intenta ingresar la información del animal pero no completa todos los campos obligatorios
    And haga clic en "Publicar"
    Then el sistema le mostrará un <mensaje de error>

    Examples:
      | mensaje de error                    |
      | "Faltan completar campos obligatorios" |