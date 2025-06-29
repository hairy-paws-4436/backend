import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationChannel,
  NotificationFrequency,
} from 'src/infrastructure/database/mysql/entities/notification-preferences.entity';


export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({
    description: 'Activar/desactivar todas las notificaciones',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  globalNotificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Activar horario silencioso',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Hora de inicio del silencio (formato HH:MM)',
    example: '22:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Quiet hours start must be in HH:MM format',
  })
  @IsOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional({
    description: 'Hora de fin del silencio (formato HH:MM)',
    example: '07:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Quiet hours end must be in HH:MM format',
  })
  @IsOptional()
  quietHoursEnd?: string;

  @ApiPropertyOptional({
    description: 'Canales de notificación preferidos',
    enum: NotificationChannel,
    isArray: true,
    example: ['in_app', 'email'],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  preferredChannels?: NotificationChannel[];

  // Configuración de adopciones
  @ApiPropertyOptional({
    description: 'Notificaciones de solicitudes de adopción',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  adoptionRequestsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Frecuencia de notificaciones de adopción',
    enum: NotificationFrequency,
    example: NotificationFrequency.IMMEDIATE,
  })
  @IsEnum(NotificationFrequency)
  @IsOptional()
  adoptionRequestsFrequency?: NotificationFrequency;

  @ApiPropertyOptional({
    description: 'Cambios de estado en adopciones',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  adoptionStatusEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Frecuencia de cambios de estado',
    enum: NotificationFrequency,
    example: NotificationFrequency.IMMEDIATE,
  })
  @IsEnum(NotificationFrequency)
  @IsOptional()
  adoptionStatusFrequency?: NotificationFrequency;

  // Nuevas mascotas y recomendaciones
  @ApiPropertyOptional({
    description: 'Nuevas recomendaciones de mascotas',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  newMatchesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Frecuencia de recomendaciones',
    enum: NotificationFrequency,
    example: NotificationFrequency.DAILY_DIGEST,
  })
  @IsEnum(NotificationFrequency)
  @IsOptional()
  newMatchesFrequency?: NotificationFrequency;

  @ApiPropertyOptional({
    description: 'Nuevos animales disponibles',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  newAnimalsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Frecuencia de nuevos animales',
    enum: NotificationFrequency,
    example: NotificationFrequency.WEEKLY_DIGEST,
  })
  @IsEnum(NotificationFrequency)
  @IsOptional()
  newAnimalsFrequency?: NotificationFrequency;

  // Eventos
  @ApiPropertyOptional({
    description: 'Recordatorios de eventos',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  eventRemindersEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Nuevos eventos disponibles',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  newEventsEnabled?: boolean;

  // Donaciones
  @ApiPropertyOptional({
    description: 'Confirmaciones de donaciones',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  donationConfirmationsEnabled?: boolean;

  // Seguimiento post-adopción
  @ApiPropertyOptional({
    description: 'Recordatorios de seguimiento post-adopción',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  followupRemindersEnabled?: boolean;

  // Configuración avanzada
  @ApiPropertyOptional({
    description: 'Tipos de animales para filtrar notificaciones',
    example: ['dog', 'cat'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredAnimalTypesForNotifications?: string[];

  @ApiPropertyOptional({
    description: 'Distancia máxima para notificaciones de nuevos animales (km)',
    example: 50,
    minimum: 5,
    maximum: 500,
  })
  @IsInt()
  @Min(5)
  @Max(500)
  @Type(() => Number)
  @IsOptional()
  maxDistanceNotificationsKm?: number;

  @ApiPropertyOptional({
    description: 'Solo notificar mascotas con alta compatibilidad (>70%)',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  onlyHighCompatibility?: boolean;

  // Marketing
  @ApiPropertyOptional({
    description: 'Notificaciones promocionales y marketing',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  promotionalEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Newsletter mensual',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  newsletterEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Zona horaria del usuario',
    example: 'America/Lima',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferido para notificaciones',
    example: 'es',
    enum: ['es', 'en'],
  })
  @IsString()
  @IsOptional()
  language?: string;
}