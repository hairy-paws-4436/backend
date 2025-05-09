Feature: US07 Edición de perfil de mascota
  Como dueño/ONG
  quiero poder editar la información de mi mascota
  para mantenerla actualizada

  Scenario: Actualizar información básica de mascota
    Given el usuario "Dueño" está autenticado en la plataforma
    And tiene una mascota registrada "Toby"
    When navega a la sección "Mis Mascotas"
    And selecciona la mascota "Toby"
    And hace clic en "Editar Perfil"
    And actualiza la descripción a "Muy juguetón y le encanta correr"
    And actualiza el peso a "12.5 kg"
    And hace clic en "Guardar Cambios"
    Then el sistema actualiza la información de la mascota
    And muestra un mensaje "Información actualizada correctamente"