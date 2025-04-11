# Hairy Paws Backend - API RESTful

Este es el backend para la aplicación Hairy Paws de GuardPets, una plataforma para la adopción de mascotas que conecta adoptantes, dueños de mascotas y ONGs.

## Características

- 🔐 Autenticación segura con JWT y autenticación de dos factores (2FA)
- 🐶 Gestión completa de mascotas disponibles para adopción
- 🤝 Sistema de solicitudes de adopción y visitas
- 🏥 Gestión de ONGs y eventos
- 💝 Sistema de donaciones (monetarias y de artículos)
- 📱 Notificaciones en tiempo real
- 👮‍♂️ Sistema de verificación de usuarios y ONGs
- 📊 Documentación completa con Swagger
- 🔒 Implementación de Clean Architecture para un código más mantenible y escalable

## Tecnologías Utilizadas

- **NestJS**: Framework backend para Node.js
- **TypeScript**: Lenguaje de programación
- **MySQL**: Base de datos relacional
- **TypeORM**: ORM para la gestión de la base de datos
- **JWT**: Para autenticación y autorización
- **OTP/2FA**: Para autenticación de dos factores
- **AWS S3**: Para almacenamiento de imágenes
- **Swagger**: Para documentación de la API

## Arquitectura

El proyecto sigue los principios de Clean Architecture con las siguientes capas:

- **Core/Domain**: Contiene las entidades de negocio y reglas de dominio
- **Application**: Contiene los casos de uso de la aplicación
- **Infrastructure**: Implementaciones concretas (base de datos, servicios externos)
- **Presentation**: Controladores y DTOs de la API

## Requisitos previos

- Node.js (v16 o superior)
- MySQL (v8 o superior)
- AWS cuenta para S3 (para almacenamiento de imágenes)

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/guardpets/hairy-paws-backend.git
cd hairy-paws-backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Luego, edita el archivo `.env` con tus propias configuraciones.

4. Ejecutar migraciones de la base de datos:
```bash
npm run migration:run
```

## Ejecución

### Desarrollo
```bash
npm run start:dev
```

### Producción
```bash
npm run build
npm run start:prod
```

## Documentación de la API

Una vez que el servidor esté corriendo, puedes acceder a la documentación Swagger en:

```
http://localhost:3000/api/docs
```

## Estructura de Base de Datos

El sistema utiliza las siguientes tablas principales:

- `users`: Usuarios del sistema (adoptantes, dueños, administradores)
- `animals`: Mascotas disponibles para adopción
- `animal_images`: Imágenes de las mascotas
- `adoptions`: Solicitudes de adopción y visitas
- `ongs`: Organizaciones no gubernamentales
- `events`: Eventos y actividades de las ONGs
- `donations`: Donaciones a las ONGs
- `donation_items`: Items específicos donados
- `notifications`: Sistema de notificaciones

## Seguridad

Este backend implementa varias capas de seguridad:

- Autenticación JWT
- Autenticación de dos factores (2FA)
- Validación de entrada con class-validator
- Protección contra ataques CSRF y XSS con Helmet
- Hasheo seguro de contraseñas con bcrypt
- Control de acceso basado en roles (RBAC)
- Sanitización de entrada/salida

## Roles y Permisos

El sistema tiene 4 roles principales:

- **ADMIN**: Administradores del sistema
- **OWNER**: Dueños de mascotas que pueden publicarlas para adopción
- **ADOPTER**: Usuarios que buscan adoptar mascotas
- **ONG**: Organizaciones que pueden recibir donaciones y publicar eventos

Cada rol tiene permisos específicos en el sistema.

## Endpoints Principales

### Autenticación
- `POST /api/auth/register`: Registro de usuarios
- `POST /api/auth/login`: Inicio de sesión
- `POST /api/auth/2fa/enable`: Habilitar autenticación de dos factores
- `POST /api/auth/2fa/verify`: Verificar código de dos factores

### Mascotas
- `GET /api/animals`: Ver mascotas disponibles para adopción
- `GET /api/animals/:id`: Ver detalles de una mascota
- `POST /api/animals`: Publicar una mascota para adopción (solo dueños)
- `PUT /api/animals/:id`: Actualizar información de una mascota (solo dueño)
- `DELETE /api/animals/:id`: Eliminar una mascota (solo dueño o admin)

### Adopciones
- `POST /api/adoptions`: Solicitar adopción o visita
- `GET /api/adoptions`: Ver solicitudes de adopción (filtradas por rol)
- `PUT /api/adoptions/:id/approve`: Aprobar solicitud (solo dueño)
- `PUT /api/adoptions/:id/reject`: Rechazar solicitud (solo dueño)

### ONGs y Eventos
- `GET /api/ongs`: Ver listado de ONGs
- `GET /api/ongs/:id`: Ver detalles de una ONG
- `GET /api/events`: Ver eventos activos
- `POST /api/events`: Crear un evento (solo ONGs)

### Donaciones
- `POST /api/donations`: Crear una donación
- `PUT /api/donations/:id/confirm`: Confirmar recepción de donación (solo ONG)

### Notificaciones
- `GET /api/notifications`: Ver notificaciones
- `POST /api/notifications/:id/read`: Marcar notificación como leída

### Administración
- `GET /api/admin/users`: Ver todos los usuarios (solo admin)
- `POST /api/admin/users/:id/verify`: Verificar un usuario (solo admin)
- `POST /api/admin/ongs/:id/verify`: Verificar una ONG (solo admin)

## Contribución

Si deseas contribuir a este proyecto, por favor:

1. Haz un fork del repositorio
2. Crea una rama con tu nueva característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Envía tus cambios (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo licencia MIT. Ver el archivo LICENSE para más detalles.

## Contacto

GuardPets - info@guardpets.com

---

Desarrollado con ❤️ por GuardPets