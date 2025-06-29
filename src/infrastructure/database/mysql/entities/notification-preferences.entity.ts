import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { NotificationType } from '../../../../core/domain/notification/value-objects/notification-type.enum';
import { UserEntity } from './user.entity';

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY_DIGEST = 'daily_digest',
  WEEKLY_DIGEST = 'weekly_digest',
  DISABLED = 'disabled',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity('notification_preferences')
export class NotificationPreferencesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  @Index('idx_notification_prefs_user_id', { unique: true })
  userId: string;

  // Configuraciones generales
  @Column({
    name: 'global_notifications_enabled',
    type: 'boolean',
    default: true,
    comment: 'Activar/desactivar todas las notificaciones'
  })
  globalNotificationsEnabled: boolean;

  @Column({
    name: 'quiet_hours_enabled',
    type: 'boolean',
    default: false,
    comment: 'Activar horario silencioso'
  })
  quietHoursEnabled: boolean;

  @Column({
    name: 'quiet_hours_start',
    type: 'time',
    nullable: true,
    comment: 'Hora de inicio del silencio (formato HH:MM)'
  })
  quietHoursStart: string;

  @Column({
    name: 'quiet_hours_end',
    type: 'time',
    nullable: true,
    comment: 'Hora de fin del silencio (formato HH:MM)'
  })
  quietHoursEnd: string;

  // Canales preferidos
  @Column({
    type: 'simple-array',
    comment: 'Canales de notificación preferidos'
  })
  preferredChannels: NotificationChannel[];

  // Configuración por tipo de notificación

  // Adopciones
  @Column({
    name: 'adoption_requests_enabled',
    type: 'boolean',
    default: true,
    comment: 'Notificaciones de solicitudes de adopción'
  })
  adoptionRequestsEnabled: boolean;

  @Column({
    name: 'adoption_requests_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  adoptionRequestsFrequency: NotificationFrequency;

  @Column({
    name: 'adoption_status_enabled',
    type: 'boolean',
    default: true,
    comment: 'Cambios de estado en adopciones'
  })
  adoptionStatusEnabled: boolean;

  @Column({
    name: 'adoption_status_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  adoptionStatusFrequency: NotificationFrequency;

  // Nuevas mascotas y recomendaciones
  @Column({
    name: 'new_matches_enabled',
    type: 'boolean',
    default: true,
    comment: 'Nuevas recomendaciones de mascotas'
  })
  newMatchesEnabled: boolean;

  @Column({
    name: 'new_matches_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.DAILY_DIGEST,
  })
  newMatchesFrequency: NotificationFrequency;

  @Column({
    name: 'new_animals_enabled',
    type: 'boolean',
    default: true,
    comment: 'Nuevos animales disponibles'
  })
  newAnimalsEnabled: boolean;

  @Column({
    name: 'new_animals_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.WEEKLY_DIGEST,
  })
  newAnimalsFrequency: NotificationFrequency;

  // Donaciones
  @Column({
    name: 'donation_confirmations_enabled',
    type: 'boolean',
    default: true,
    comment: 'Confirmaciones de donaciones'
  })
  donationConfirmationsEnabled: boolean;

  @Column({
    name: 'donation_confirmations_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  donationConfirmationsFrequency: NotificationFrequency;

  // Eventos
  @Column({
    name: 'event_reminders_enabled',
    type: 'boolean',
    default: true,
    comment: 'Recordatorios de eventos'
  })
  eventRemindersEnabled: boolean;

  @Column({
    name: 'event_reminders_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  eventRemindersFrequency: NotificationFrequency;

  @Column({
    name: 'new_events_enabled',
    type: 'boolean',
    default: false,
    comment: 'Nuevos eventos disponibles'
  })
  newEventsEnabled: boolean;

  @Column({
    name: 'new_events_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.WEEKLY_DIGEST,
  })
  newEventsFrequency: NotificationFrequency;

  // Seguimiento post-adopción
  @Column({
    name: 'followup_reminders_enabled',
    type: 'boolean',
    default: true,
    comment: 'Recordatorios de seguimiento post-adopción'
  })
  followupRemindersEnabled: boolean;

  @Column({
    name: 'followup_reminders_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  followupRemindersFrequency: NotificationFrequency;

  // Verificaciones y administrativo
  @Column({
    name: 'account_updates_enabled',
    type: 'boolean',
    default: true,
    comment: 'Actualizaciones de cuenta y verificaciones'
  })
  accountUpdatesEnabled: boolean;

  @Column({
    name: 'account_updates_frequency',
    type: 'enum',
    enum: NotificationFrequency,
    default: NotificationFrequency.IMMEDIATE,
  })
  accountUpdatesFrequency: NotificationFrequency;

  // Configuración avanzada para adoptantes
  @Column({
    name: 'preferred_animal_types',
    type: 'simple-array',
    nullable: true,
    comment: 'Tipos de animales para filtrar notificaciones'
  })
  preferredAnimalTypesForNotifications: string[];

  @Column({
    name: 'max_distance_notifications_km',
    type: 'int',
    nullable: true,
    comment: 'Distancia máxima para notificaciones de nuevos animales'
  })
  maxDistanceNotificationsKm: number;

  @Column({
    name: 'only_high_compatibility',
    type: 'boolean',
    default: false,
    comment: 'Solo notificar mascotas con alta compatibilidad (>70%)'
  })
  onlyHighCompatibility: boolean;

  // Marketing y promocional
  @Column({
    name: 'promotional_enabled',
    type: 'boolean',
    default: false,
    comment: 'Notificaciones promocionales y marketing'
  })
  promotionalEnabled: boolean;

  @Column({
    name: 'newsletter_enabled',
    type: 'boolean',
    default: true,
    comment: 'Newsletter mensual'
  })
  newsletterEnabled: boolean;

  // Metadatos
  @Column({
    name: 'last_digest_sent',
    type: 'timestamp',
    nullable: true,
    comment: 'Última vez que se envió un digest'
  })
  lastDigestSent: Date;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 50,
    default: 'America/Lima',
    comment: 'Zona horaria del usuario'
  })
  timezone: string;

  @Column({
    name: 'language',
    type: 'varchar',
    length: 5,
    default: 'es',
    comment: 'Idioma preferido para notificaciones'
  })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}