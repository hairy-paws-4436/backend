import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateNotificationPreferencesDto } from '../../presentation/dtos/requests/update-notification-preferences.dto';
import {
  NotificationChannel, NotificationFrequency,
  NotificationPreferencesEntity,
} from 'src/infrastructure/database/mysql/entities/notification-preferences.entity';

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    @InjectRepository(NotificationPreferencesEntity)
    private readonly preferencesRepository: Repository<NotificationPreferencesEntity>,
  ) {}

  async getUserPreferences(userId: string): Promise<NotificationPreferencesEntity> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!preferences) {
      // Crear preferencias por defecto
      preferences = await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesEntity> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId);
    }

    // Actualizar preferencias
    Object.assign(preferences, updateDto);

    return await this.preferencesRepository.save(preferences);
  }

  async shouldSendNotification(
    userId: string,
    notificationType: string,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);

      // Verificar si las notificaciones globales están activadas
      if (!preferences.globalNotificationsEnabled) {
        return false;
      }

      // Verificar canal preferido
      if (!preferences.preferredChannels.includes(channel)) {
        return false;
      }

      // Verificar horario silencioso
      if (preferences.quietHoursEnabled && this.isQuietHours(preferences)) {
        return false;
      }

      // Verificar configuración específica por tipo
      return this.isNotificationTypeEnabled(preferences, notificationType);
    } catch (error) {
      this.logger.error(`Error checking notification preferences: ${error.message}`);
      return true; // Por defecto permitir notificación en caso de error
    }
  }

  async getPreferenceTemplates() {
    return {
      minimal: {
        name: 'Mínimas',
        description: 'Solo notificaciones esenciales',
        config: {
          adoptionRequestsEnabled: true,
          adoptionRequestsFrequency: NotificationFrequency.IMMEDIATE,
          adoptionStatusEnabled: true,
          adoptionStatusFrequency: NotificationFrequency.IMMEDIATE,
          newMatchesEnabled: false,
          newAnimalsEnabled: false,
          eventRemindersEnabled: false,
          newEventsEnabled: false,
          donationConfirmationsEnabled: true,
          followupRemindersEnabled: true,
          promotionalEnabled: false,
          newsletterEnabled: false,
        },
      },
      balanced: {
        name: 'Equilibradas',
        description: 'Buena combinación de utilidad y tranquilidad',
        config: {
          adoptionRequestsEnabled: true,
          adoptionRequestsFrequency: NotificationFrequency.IMMEDIATE,
          adoptionStatusEnabled: true,
          adoptionStatusFrequency: NotificationFrequency.IMMEDIATE,
          newMatchesEnabled: true,
          newMatchesFrequency: NotificationFrequency.DAILY_DIGEST,
          newAnimalsEnabled: true,
          newAnimalsFrequency: NotificationFrequency.WEEKLY_DIGEST,
          eventRemindersEnabled: true,
          newEventsEnabled: false,
          donationConfirmationsEnabled: true,
          followupRemindersEnabled: true,
          promotionalEnabled: false,
          newsletterEnabled: true,
        },
      },
      everything: {
        name: 'Todas',
        description: 'Mantente al día con todo lo que pasa',
        config: {
          adoptionRequestsEnabled: true,
          adoptionRequestsFrequency: NotificationFrequency.IMMEDIATE,
          adoptionStatusEnabled: true,
          adoptionStatusFrequency: NotificationFrequency.IMMEDIATE,
          newMatchesEnabled: true,
          newMatchesFrequency: NotificationFrequency.IMMEDIATE,
          newAnimalsEnabled: true,
          newAnimalsFrequency: NotificationFrequency.DAILY_DIGEST,
          eventRemindersEnabled: true,
          newEventsEnabled: true,
          newEventsFrequency: NotificationFrequency.WEEKLY_DIGEST,
          donationConfirmationsEnabled: true,
          followupRemindersEnabled: true,
          promotionalEnabled: true,
          newsletterEnabled: true,
        },
      },
    };
  }

  async applyTemplate(
    userId: string,
    templateName: string,
  ): Promise<NotificationPreferencesEntity> {
    const templates = await this.getPreferenceTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    return await this.updatePreferences(userId, template.config);
  }

  async getDigestPreferences(userId: string): Promise<{
    shouldSendDaily: boolean;
    shouldSendWeekly: boolean;
    preferredChannels: NotificationChannel[];
    timezone: string;
  }> {
    const preferences = await this.getUserPreferences(userId);

    const shouldSendDaily =
      preferences.newMatchesFrequency === NotificationFrequency.DAILY_DIGEST ||
      preferences.newAnimalsFrequency === NotificationFrequency.DAILY_DIGEST;

    const shouldSendWeekly =
      preferences.newMatchesFrequency === NotificationFrequency.WEEKLY_DIGEST ||
      preferences.newAnimalsFrequency === NotificationFrequency.WEEKLY_DIGEST ||
      preferences.newEventsFrequency === NotificationFrequency.WEEKLY_DIGEST;

    return {
      shouldSendDaily,
      shouldSendWeekly,
      preferredChannels: preferences.preferredChannels,
      timezone: preferences.timezone,
    };
  }

  private async createDefaultPreferences(userId: string): Promise<NotificationPreferencesEntity> {
    const defaultPreferences = this.preferencesRepository.create({
      userId,
      globalNotificationsEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      preferredChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],

      // Adopciones - inmediatas por defecto
      adoptionRequestsEnabled: true,
      adoptionRequestsFrequency: NotificationFrequency.IMMEDIATE,
      adoptionStatusEnabled: true,
      adoptionStatusFrequency: NotificationFrequency.IMMEDIATE,

      // Recomendaciones - digest diario
      newMatchesEnabled: true,
      newMatchesFrequency: NotificationFrequency.DAILY_DIGEST,
      newAnimalsEnabled: true,
      newAnimalsFrequency: NotificationFrequency.WEEKLY_DIGEST,

      // Donaciones - inmediatas
      donationConfirmationsEnabled: true,
      donationConfirmationsFrequency: NotificationFrequency.IMMEDIATE,

      // Eventos - básico
      eventRemindersEnabled: true,
      eventRemindersFrequency: NotificationFrequency.IMMEDIATE,
      newEventsEnabled: false,
      newEventsFrequency: NotificationFrequency.WEEKLY_DIGEST,

      // Seguimiento - habilitado
      followupRemindersEnabled: true,
      followupRemindersFrequency: NotificationFrequency.IMMEDIATE,

      // Administrativo - habilitado
      accountUpdatesEnabled: true,
      accountUpdatesFrequency: NotificationFrequency.IMMEDIATE,

      // Marketing - básico
      promotionalEnabled: false,
      newsletterEnabled: true,

      // Configuración avanzada
      maxDistanceNotificationsKm: 50,
      onlyHighCompatibility: false,
      timezone: 'America/Lima',
      language: 'es',
    });

    return await this.preferencesRepository.save(defaultPreferences);
  }

  private isQuietHours(preferences: NotificationPreferencesEntity): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Manejar horarios que cruzan medianoche
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  private isNotificationTypeEnabled(
    preferences: NotificationPreferencesEntity,
    notificationType: string,
  ): boolean {
    const typeMapping = {
      'adoption_request': preferences.adoptionRequestsEnabled,
      'adoption_approved': preferences.adoptionStatusEnabled,
      'adoption_rejected': preferences.adoptionStatusEnabled,
      'visit_request': preferences.adoptionRequestsEnabled,
      'visit_approved': preferences.adoptionStatusEnabled,
      'visit_rejected': preferences.adoptionStatusEnabled,
      'donation_received': preferences.donationConfirmationsEnabled,
      'donation_confirmed': preferences.donationConfirmationsEnabled,
      'event_reminder': preferences.eventRemindersEnabled,
      'new_event': preferences.newEventsEnabled,
      'account_verified': preferences.accountUpdatesEnabled,
      'new_match': preferences.newMatchesEnabled,
      'new_animal': preferences.newAnimalsEnabled,
      'followup_reminder': preferences.followupRemindersEnabled,
      'general': true, // General siempre habilitado si las notificaciones globales están activas
    };

    return typeMapping[notificationType] ?? true;
  }
}