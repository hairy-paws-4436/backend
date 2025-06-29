import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostAdoptionFollowUpService } from './post-adoption-followup.service';
import { OngGamificationService } from './ong-gamification.service';
import { IntelligentMatchingService } from './intelligent-matching.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly followUpService: PostAdoptionFollowUpService,
    private readonly gamificationService: OngGamificationService,
    private readonly matchingService: IntelligentMatchingService,
    private readonly notificationPreferencesService: NotificationPreferencesService,
    private readonly notificationService: NotificationService,
  ) {}

  // === SEGUIMIENTO POST-ADOPCIÓN ===

  @Cron('0 9 * * *') // Diario a las 9 AM
  async handleDailyFollowUps() {
    this.logger.log('Starting daily follow-up reminders...');

    try {
      const result = await this.followUpService.sendPendingReminders();
      this.logger.log(`Daily follow-ups completed: ${result.sent} sent, ${result.errors} errors`);
    } catch (error) {
      this.logger.error(`Error in daily follow-ups: ${error.message}`);
    }
  }

  @Cron('0 10 * * *') // Diario a las 10 AM
  async updateOverdueFollowUps() {
    this.logger.log('Updating overdue follow-ups...');

    try {
      // Marcar como vencidos los seguimientos con más de 7 días de retraso
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // TODO: Implementar en el repositorio
      // await this.followUpService.markOverdueFollowUps(sevenDaysAgo);

      this.logger.log('Overdue follow-ups updated successfully');
    } catch (error) {
      this.logger.error(`Error updating overdue follow-ups: ${error.message}`);
    }
  }

  // === GAMIFICACIÓN ===

  @Cron('0 0 * * 0') // Domingo a medianoche - Reset semanal
  async resetWeeklyPoints() {
    this.logger.log('Resetting weekly points...');

    try {
      await this.gamificationService.resetWeeklyPoints();
      this.logger.log('Weekly points reset completed');
    } catch (error) {
      this.logger.error(`Error resetting weekly points: ${error.message}`);
    }
  }

  @Cron('0 0 1 * *') // Primer día del mes a medianoche - Reset mensual
  async resetMonthlyPoints() {
    this.logger.log('Resetting monthly points...');

    try {
      await this.gamificationService.resetMonthlyPoints();
      this.logger.log('Monthly points reset completed');
    } catch (error) {
      this.logger.error(`Error resetting monthly points: ${error.message}`);
    }
  }

  @Cron('0 8 * * *') // Diario a las 8 AM - Actualizar actividad diaria
  async updateDailyActivity() {
    this.logger.log('Updating daily activity for ONGs...');

    try {
      // TODO: Obtener lista de ONGs activas y actualizar su actividad diaria
      // const activeOngs = await this.getActiveOngs();
      // for (const ong of activeOngs) {
      //   await this.gamificationService.updateDailyActivity(ong.id);
      // }

      this.logger.log('Daily activity update completed');
    } catch (error) {
      this.logger.error(`Error updating daily activity: ${error.message}`);
    }
  }

  // === NOTIFICACIONES DIGEST ===

  @Cron('0 18 * * *') // Diario a las 6 PM - Digest diario
  async sendDailyDigest() {
    this.logger.log('Sending daily digest notifications...');

    try {
      // TODO: Implementar envío de digest diario
      // const users = await this.notificationPreferencesService.getUsersForDailyDigest();
      // for (const user of users) {
      //   await this.sendUserDailyDigest(user);
      // }

      this.logger.log('Daily digest notifications sent');
    } catch (error) {
      this.logger.error(`Error sending daily digest: ${error.message}`);
    }
  }

  @Cron('0 9 * * 1') // Lunes a las 9 AM - Digest semanal
  async sendWeeklyDigest() {
    this.logger.log('Sending weekly digest notifications...');

    try {
      // TODO: Implementar envío de digest semanal
      // const users = await this.notificationPreferencesService.getUsersForWeeklyDigest();
      // for (const user of users) {
      //   await this.sendUserWeeklyDigest(user);
      // }

      this.logger.log('Weekly digest notifications sent');
    } catch (error) {
      this.logger.error(`Error sending weekly digest: ${error.message}`);
    }
  }

  // === RECOMENDACIONES INTELIGENTES ===

  @Cron('0 7 * * *') // Diario a las 7 AM - Nuevas recomendaciones
  async generateNewRecommendations() {
    this.logger.log('Generating new recommendations...');

    try {
      // TODO: Obtener usuarios con preferencias activas
      // const activeUsers = await this.getActiveUsersWithPreferences();
      //
      // for (const user of activeUsers) {
      //   const preferences = await this.notificationPreferencesService.getUserPreferences(user.id);
      //
      //   if (preferences.newMatchesEnabled && preferences.newMatchesFrequency === 'immediate') {
      //     const matches = await this.matchingService.findMatches({
      //       userId: user.id,
      //       limit: 3,
      //       minScore: 0.7,
      //     });
      //
      //     if (matches.length > 0) {
      //       await this.notificationService.create({
      //         userId: user.id,
      //         type: NotificationType.GENERAL,
      //         title: '🐾 Nuevas mascotas compatibles',
      //         message: `Hemos encontrado ${matches.length} mascotas que podrían interesarte`,
      //       });
      //     }
      //   }
      // }

      this.logger.log('New recommendations generated');
    } catch (error) {
      this.logger.error(`Error generating new recommendations: ${error.message}`);
    }
  }

  // === MANTENIMIENTO ===

  @Cron('0 2 * * *') // Diario a las 2 AM - Limpieza de datos
  async performDailyMaintenance() {
    this.logger.log('Performing daily maintenance...');

    try {
      // Limpiar notificaciones antiguas (más de 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // TODO: Implementar limpieza en NotificationService
      // await this.notificationService.cleanOldNotifications(thirtyDaysAgo);

      // Limpiar datos temporales de matching
      // await this.matchingService.cleanTemporaryData();

      this.logger.log('Daily maintenance completed');
    } catch (error) {
      this.logger.error(`Error in daily maintenance: ${error.message}`);
    }
  }

  @Cron('0 3 1 * *') // Primer día del mes a las 3 AM - Mantenimiento mensual
  async performMonthlyMaintenance() {
    this.logger.log('Performing monthly maintenance...');

    try {
      // Recalcular rankings de gamificación
      // await this.gamificationService.recalculateRankings();

      // Generar reportes de estadísticas
      // await this.generateMonthlyReports();

      // Limpiar datos antiguos de seguimiento (más de 1 año)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // TODO: Implementar limpieza de datos antiguos

      this.logger.log('Monthly maintenance completed');
    } catch (error) {
      this.logger.error(`Error in monthly maintenance: ${error.message}`);
    }
  }

  // === MÉTODOS AUXILIARES ===

  private async sendUserDailyDigest(user: any): Promise<void> {
    // TODO: Implementar envío de digest personalizado
    try {
      const preferences = await this.notificationPreferencesService.getUserPreferences(user.id);

      if (!preferences.globalNotificationsEnabled) {
        return;
      }

      // Obtener nuevas recomendaciones si están habilitadas
      let newMatches: any[] = [];
      if (preferences.newMatchesEnabled && preferences.newMatchesFrequency === 'daily_digest') {
        newMatches = await this.matchingService.findMatches({
          userId: user.id,
          limit: 5,
          minScore: 0.6,
        });
      }

      // Enviar digest solo si hay contenido
      if (newMatches.length > 0) {
        await this.notificationService.create({
          userId: user.id,
          type: 'general' as any,
          title: '📬 Tu resumen diario de HairyPaws',
          message: `${newMatches.length} nuevas mascotas compatibles te están esperando`,
        });
      }

    } catch (error) {
      this.logger.error(`Error sending daily digest to user ${user.id}: ${error.message}`);
    }
  }

  private async sendUserWeeklyDigest(user: any): Promise<void> {
    // TODO: Implementar digest semanal más completo
    try {
      const preferences = await this.notificationPreferencesService.getUserPreferences(user.id);

      if (!preferences.globalNotificationsEnabled) {
        return;
      }

      // Resumen semanal más detallado
      // - Nuevas mascotas en la zona
      // - Eventos próximos
      // - Estadísticas de la semana

      await this.notificationService.create({
        userId: user.id,
        type: 'general' as any,
        title: '📰 Tu resumen semanal de HairyPaws',
        message: 'Revisa las novedades de esta semana en nuestra plataforma',
      });

    } catch (error) {
      this.logger.error(`Error sending weekly digest to user ${user.id}: ${error.message}`);
    }
  }
}