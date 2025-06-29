import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import {
  AchievementCategory,
  BadgeType,
  OngAchievementEntity,
  OngGamificationEntity,
} from '../../infrastructure/database/mysql/entities/ong-gamification.entity';

export interface PointsConfig {
  ANIMAL_PUBLISHED: number;
  ADOPTION_COMPLETED: number;
  EVENT_CREATED: number;
  EVENT_WITH_PARTICIPANTS: number;
  DONATION_RECEIVED: number;
  PROFILE_COMPLETED: number;
  FAST_RESPONSE: number;
  COMMUNITY_VOTE: number;
  TESTIMONIAL_RECEIVED: number;
  SOCIAL_MEDIA_MENTION: number;
  MONTHLY_GOAL_ACHIEVED: number;
  STREAK_BONUS: number;
}

@Injectable()
export class OngGamificationService {
  private readonly logger = new Logger(OngGamificationService.name);

  private readonly pointsConfig: PointsConfig = {
    ANIMAL_PUBLISHED: 50,
    ADOPTION_COMPLETED: 200,
    EVENT_CREATED: 100,
    EVENT_WITH_PARTICIPANTS: 150,
    DONATION_RECEIVED: 10, // Por cada 10 soles
    PROFILE_COMPLETED: 300,
    FAST_RESPONSE: 25,
    COMMUNITY_VOTE: 5,
    TESTIMONIAL_RECEIVED: 100,
    SOCIAL_MEDIA_MENTION: 20,
    MONTHLY_GOAL_ACHIEVED: 500,
    STREAK_BONUS: 10,
  };

  constructor(
    @InjectRepository(OngGamificationEntity)
    private readonly gamificationRepository: Repository<OngGamificationEntity>,
    @InjectRepository(OngAchievementEntity)
    private readonly achievementRepository: Repository<OngAchievementEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async initializeGamificationForOng(ongId: string): Promise<OngGamificationEntity> {
    const existing = await this.gamificationRepository.findOne({ where: { ongId } });

    if (existing) {
      return existing;
    }

    const gamification = this.gamificationRepository.create({
      ongId,
      totalPoints: 0,
      monthlyPoints: 0,
      weeklyPoints: 0,
      currentLevel: 1,
      pointsToNextLevel: 100,
      earnedBadges: [],
    });

    return await this.gamificationRepository.save(gamification);
  }

  async addPoints(ongId: string, points: number, reason: string): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);

    gamification.totalPoints += points;
    gamification.monthlyPoints += points;
    gamification.weeklyPoints += points;

    // Verificar subida de nivel
    const leveledUp = await this.checkLevelUp(gamification);

    await this.gamificationRepository.save(gamification);

    if (leveledUp) {
      await this.sendLevelUpNotification(ongId, gamification.currentLevel);
    }

    this.logger.log(`Added ${points} points to ONG ${ongId} for: ${reason}`);
  }

  async onAnimalPublished(ongId: string): Promise<void> {
    await this.addPoints(ongId, this.pointsConfig.ANIMAL_PUBLISHED, 'Animal published');

    const gamification = await this.getOrCreateGamification(ongId);
    gamification.animalsPublished += 1;
    await this.gamificationRepository.save(gamification);

    // Verificar badge de primera publicación
    if (gamification.animalsPublished === 1) {
      await this.awardBadge(ongId, BadgeType.FIRST_ADOPTION, AchievementCategory.ADOPTIONS, 100);
    }
  }

  async onAdoptionCompleted(ongId: string): Promise<void> {
    await this.addPoints(ongId, this.pointsConfig.ADOPTION_COMPLETED, 'Adoption completed');

    const gamification = await this.getOrCreateGamification(ongId);
    gamification.totalAdoptionsFacilitated += 1;
    gamification.monthlyAdoptionsCurrent += 1;

    // Calcular tasa de éxito
    const successRate = (gamification.totalAdoptionsFacilitated / Math.max(gamification.animalsPublished, 1)) * 100;
    gamification.adoptionSuccessRate = successRate;

    await this.gamificationRepository.save(gamification);

    // Verificar badges de hitos de adopción
    await this.checkAdoptionMilestones(ongId, gamification.totalAdoptionsFacilitated);

    // Verificar meta mensual
    await this.checkMonthlyGoal(ongId);
  }

  async onEventCreated(ongId: string, hasParticipants: boolean = false): Promise<void> {
    const points = hasParticipants ?
      this.pointsConfig.EVENT_WITH_PARTICIPANTS :
      this.pointsConfig.EVENT_CREATED;

    await this.addPoints(ongId, points, 'Event created');

    const gamification = await this.getOrCreateGamification(ongId);
    gamification.eventsOrganized += 1;
    await this.gamificationRepository.save(gamification);

    // Badge de organizador de eventos (5 eventos)
    if (gamification.eventsOrganized === 5) {
      await this.awardBadge(ongId, BadgeType.EVENT_ORGANIZER, AchievementCategory.EVENTS, 250);
    }
  }

  async onDonationReceived(ongId: string, amount: number): Promise<void> {
    const points = Math.floor(amount / 10) * this.pointsConfig.DONATION_RECEIVED;
    await this.addPoints(ongId, points, `Donation received: S/${amount}`);

    const gamification = await this.getOrCreateGamification(ongId);
    gamification.donationsReceived += amount;
    await this.gamificationRepository.save(gamification);

    // Badge de favorito de donantes (S/5000 acumulados)
    if (gamification.donationsReceived >= 5000 && !gamification.earnedBadges.includes(BadgeType.DONOR_FAVORITE)) {
      await this.awardBadge(ongId, BadgeType.DONOR_FAVORITE, AchievementCategory.DONATIONS, 300);
    }
  }

  async onProfileCompleted(ongId: string, completionPercentage: number): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);
    const previousPercentage = gamification.profileCompletionPercentage;

    gamification.profileCompletionPercentage = completionPercentage;
    await this.gamificationRepository.save(gamification);

    // Puntos por completar perfil
    if (completionPercentage === 100 && previousPercentage < 100) {
      await this.addPoints(ongId, this.pointsConfig.PROFILE_COMPLETED, 'Profile completed');
      await this.awardBadge(ongId, BadgeType.PROFILE_COMPLETENESS, AchievementCategory.TRANSPARENCY, 200);
    }
  }

  async onFastResponse(ongId: string, responseTimeHours: number): Promise<void> {
    if (responseTimeHours <= 2) { // Respuesta rápida en menos de 2 horas
      await this.addPoints(ongId, this.pointsConfig.FAST_RESPONSE, 'Fast response');

      const gamification = await this.getOrCreateGamification(ongId);
      gamification.responseTimeHours = responseTimeHours;
      await this.gamificationRepository.save(gamification);

      // Badge de respuesta rápida (promedio < 1 hora en 10 respuestas)
      if (responseTimeHours < 1) {
        await this.awardBadge(ongId, BadgeType.RAPID_RESPONDER, AchievementCategory.ENGAGEMENT, 150);
      }
    }
  }

  async updateDailyActivity(ongId: string): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);
    const today = new Date().toDateString();
    const lastActivity = gamification.lastActivityDate?.toDateString();

    if (lastActivity !== today) {
      // Nueva actividad del día
      if (lastActivity === this.getYesterday().toDateString()) {
        // Continúa la racha
        gamification.currentStreakDays += 1;
        if (gamification.currentStreakDays > gamification.longestStreakDays) {
          gamification.longestStreakDays = gamification.currentStreakDays;
        }
      } else {
        // Rompe la racha
        gamification.currentStreakDays = 1;
      }

      gamification.lastActivityDate = new Date();

      // Bonificación por racha
      if (gamification.currentStreakDays >= 7) {
        await this.addPoints(ongId, this.pointsConfig.STREAK_BONUS * gamification.currentStreakDays, 'Streak bonus');
      }

      await this.gamificationRepository.save(gamification);

      // Badge de actividad mensual (30 días consecutivos)
      if (gamification.currentStreakDays === 30) {
        await this.awardBadge(ongId, BadgeType.MONTHLY_ACTIVE, AchievementCategory.ENGAGEMENT, 400);
      }
    }
  }

  async getLeaderboard(limit: number = 10, timeframe: 'weekly' | 'monthly' | 'all' = 'monthly'): Promise<any[]> {
    let orderBy: string;
    switch (timeframe) {
      case 'weekly':
        orderBy = 'weeklyPoints';
        break;
      case 'monthly':
        orderBy = 'monthlyPoints';
        break;
      default:
        orderBy = 'totalPoints';
    }

    const leaderboard = await this.gamificationRepository
      .createQueryBuilder('gamification')
      .leftJoinAndSelect('gamification.ong', 'ong')
      .orderBy(`gamification.${orderBy}`, 'DESC')
      .limit(limit)
      .getMany();

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ongId: entry.ongId,
      ongName: entry.ong.name,
      points: entry[orderBy],
      level: entry.currentLevel,
      badges: entry.featuredBadges || entry.earnedBadges.slice(0, 3),
      adoptions: entry.totalAdoptionsFacilitated,
    }));
  }

  async getOngStats(ongId: string): Promise<any> {
    const gamification = await this.getOrCreateGamification(ongId);
    const achievements = await this.achievementRepository.find({
      where: { ongGamificationId: gamification.id },
      order: { achievementDate: 'DESC' },
    });

    return {
      gamification,
      recentAchievements: achievements.slice(0, 5),
      nextBadges: await this.getNextAvailableBadges(ongId),
      rankingInfo: await this.getRankingInfo(ongId),
    };
  }

  private async getOrCreateGamification(ongId: string): Promise<OngGamificationEntity> {
    let gamification = await this.gamificationRepository.findOne({ where: { ongId } });

    if (!gamification) {
      gamification = await this.initializeGamificationForOng(ongId);
    }

    return gamification;
  }

  private async checkLevelUp(gamification: OngGamificationEntity): Promise<boolean> {
    const pointsNeeded = this.calculatePointsForLevel(gamification.currentLevel + 1);

    if (gamification.totalPoints >= pointsNeeded) {
      gamification.currentLevel += 1;
      gamification.pointsToNextLevel = this.calculatePointsForLevel(gamification.currentLevel + 1) - gamification.totalPoints;
      return true;
    } else {
      gamification.pointsToNextLevel = pointsNeeded - gamification.totalPoints;
      return false;
    }
  }

  private calculatePointsForLevel(level: number): number {
    // Fórmula exponencial: nivel^2 * 100
    return level * level * 100;
  }

  private async awardBadge(
    ongId: string,
    badgeType: BadgeType,
    category: AchievementCategory,
    points: number,
    milestoneValue?: number,
  ): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);

    // Verificar si ya tiene el badge
    if (gamification.earnedBadges.includes(badgeType)) {
      return;
    }

    // Agregar badge
    gamification.earnedBadges.push(badgeType);
    await this.gamificationRepository.save(gamification);

    // Crear registro de achievement
    const achievement = this.achievementRepository.create({
      ongGamificationId: gamification.id,
      badgeType,
      category,
      pointsEarned: points,
      milestoneValue,
      description: this.getBadgeDescription(badgeType, milestoneValue),
    });

    await this.achievementRepository.save(achievement);

    // Agregar puntos bonus
    await this.addPoints(ongId, points, `Badge earned: ${badgeType}`);

    // Notificar
    await this.sendBadgeNotification(ongId, badgeType, points);

    this.logger.log(`Badge ${badgeType} awarded to ONG ${ongId}`);
  }

  private async checkAdoptionMilestones(ongId: string, adoptionCount: number): Promise<void> {
    const milestones = [
      { count: 10, badge: BadgeType.ADOPTION_MILESTONE_10 },
      { count: 50, badge: BadgeType.ADOPTION_MILESTONE_50 },
      { count: 100, badge: BadgeType.ADOPTION_MILESTONE_100 },
      { count: 500, badge: BadgeType.ADOPTION_MILESTONE_500 },
    ];

    for (const milestone of milestones) {
      if (adoptionCount >= milestone.count) {
        await this.awardBadge(
          ongId,
          milestone.badge,
          AchievementCategory.ADOPTIONS,
          milestone.count * 10,
          milestone.count,
        );
      }
    }
  }

  private async checkMonthlyGoal(ongId: string): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);

    if (gamification.monthlyAdoptionGoal &&
      gamification.monthlyAdoptionsCurrent >= gamification.monthlyAdoptionGoal) {
      await this.addPoints(ongId, this.pointsConfig.MONTHLY_GOAL_ACHIEVED, 'Monthly goal achieved');

      // Notificar logro
      await this.notificationService.create({
        userId: gamification.ong?.userId || '', // Necesitamos obtener el userId de la ONG
        type: NotificationType.GENERAL,
        title: '🎯 ¡Meta mensual alcanzada!',
        message: `¡Felicitaciones! Has alcanzado tu meta de ${gamification.monthlyAdoptionGoal} adopciones este mes.`,
      });
    }
  }

  private async getNextAvailableBadges(ongId: string): Promise<any[]> {
    const gamification = await this.getOrCreateGamification(ongId);
    const nextBadges: any[] = [];

    // Badges de adopciones
    const adoptionMilestones = [10, 50, 100, 500];
    for (const milestone of adoptionMilestones) {
      const badgeType = `ADOPTION_MILESTONE_${milestone}` as BadgeType;
      if (!gamification.earnedBadges.includes(badgeType) &&
        gamification.totalAdoptionsFacilitated < milestone) {
        nextBadges.push({
          badge: badgeType,
          current: gamification.totalAdoptionsFacilitated,
          target: milestone,
          progress: (gamification.totalAdoptionsFacilitated / milestone) * 100,
        });
        break; // Solo mostrar el siguiente hito
      }
    }

    // Badge de organizador de eventos
    if (!gamification.earnedBadges.includes(BadgeType.EVENT_ORGANIZER) &&
      gamification.eventsOrganized < 5) {
      nextBadges.push({
        badge: BadgeType.EVENT_ORGANIZER,
        current: gamification.eventsOrganized,
        target: 5,
        progress: (gamification.eventsOrganized / 5) * 100,
      });
    }

    // Badge de donante favorito
    if (!gamification.earnedBadges.includes(BadgeType.DONOR_FAVORITE) &&
      gamification.donationsReceived < 5000) {
      nextBadges.push({
        badge: BadgeType.DONOR_FAVORITE,
        current: gamification.donationsReceived,
        target: 5000,
        progress: (gamification.donationsReceived / 5000) * 100,
      });
    }

    return nextBadges;
  }

  private async getRankingInfo(ongId: string): Promise<any> {
    const gamification = await this.getOrCreateGamification(ongId);

    // Calcular ranking global
    const globalRank = await this.gamificationRepository
      .createQueryBuilder('g')
      .where('g.totalPoints > :points', { points: gamification.totalPoints })
      .getCount() + 1;

    // Calcular ranking mensual
    const monthlyRank = await this.gamificationRepository
      .createQueryBuilder('g')
      .where('g.monthlyPoints > :points', { points: gamification.monthlyPoints })
      .getCount() + 1;

    // Actualizar rankings
    gamification.globalRank = globalRank;
    gamification.regionalRank = monthlyRank; // Usamos monthly como regional por ahora
    await this.gamificationRepository.save(gamification);

    return {
      globalRank,
      monthlyRank,
      totalOngs: await this.gamificationRepository.count(),
    };
  }

  private getBadgeDescription(badgeType: BadgeType, milestoneValue?: number): string {
    const descriptions = {
      [BadgeType.FIRST_ADOPTION]: 'Primera adopción facilitada',
      [BadgeType.ADOPTION_MILESTONE_10]: '10 adopciones completadas',
      [BadgeType.ADOPTION_MILESTONE_50]: '50 adopciones completadas',
      [BadgeType.ADOPTION_MILESTONE_100]: '100 adopciones completadas',
      [BadgeType.ADOPTION_MILESTONE_500]: '500 adopciones completadas',
      [BadgeType.PROFILE_COMPLETENESS]: 'Perfil 100% completo',
      [BadgeType.MONTHLY_ACTIVE]: '30 días consecutivos activo',
      [BadgeType.EVENT_ORGANIZER]: '5 eventos organizados',
      [BadgeType.DONOR_FAVORITE]: 'S/5,000 en donaciones recibidas',
      [BadgeType.COMMUNITY_BUILDER]: 'Líder en construcción de comunidad',
      [BadgeType.VETERINARY_PARTNER]: 'Socio veterinario verificado',
      [BadgeType.TRANSPARENCY_CHAMPION]: 'Campeón de transparencia',
      [BadgeType.RAPID_RESPONDER]: 'Respuestas rápidas consistentes',
      [BadgeType.SOCIAL_MEDIA_STAR]: 'Estrella en redes sociales',
    };

    return descriptions[badgeType] || 'Logro especial obtenido';
  }

  private async sendBadgeNotification(ongId: string, badgeType: BadgeType, points: number): Promise<void> {
    try {
      // Necesitamos obtener el userId de la ONG
      const gamification = await this.gamificationRepository.findOne({
        where: { ongId },
        relations: ['ong', 'ong.user'],
      });

      if (gamification?.ong?.userId) {
        await this.notificationService.create({
          userId: gamification.ong.userId,
          type: NotificationType.GENERAL,
          title: '🏆 ¡Nuevo logro desbloqueado!',
          message: `Has obtenido el badge "${this.getBadgeDescription(badgeType)}" y ganado ${points} puntos. ¡Sigue así!`,
        });
      }
    } catch (error) {
      this.logger.error(`Error sending badge notification: ${error.message}`);
    }
  }

  private async sendLevelUpNotification(ongId: string, newLevel: number): Promise<void> {
    try {
      const gamification = await this.gamificationRepository.findOne({
        where: { ongId },
        relations: ['ong', 'ong.user'],
      });

      if (gamification?.ong?.userId) {
        await this.notificationService.create({
          userId: gamification.ong.userId,
          type: NotificationType.GENERAL,
          title: '🎉 ¡Subiste de nivel!',
          message: `¡Felicitaciones! Ahora eres nivel ${newLevel}. Sigue ayudando a más mascotas para desbloquear nuevas recompensas.`,
        });
      }
    } catch (error) {
      this.logger.error(`Error sending level up notification: ${error.message}`);
    }
  }

  private getYesterday(): Date {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Métodos públicos para gestión de gamificación

  async setMonthlyGoal(ongId: string, goal: number): Promise<void> {
    const gamification = await this.getOrCreateGamification(ongId);
    gamification.monthlyAdoptionGoal = goal;
    await this.gamificationRepository.save(gamification);
  }

  async resetWeeklyPoints(): Promise<void> {
    await this.gamificationRepository.update({}, {
      weeklyPoints: 0,
      weeklyResetDate: new Date(),
    });
    this.logger.log('Weekly points reset completed');
  }

  async resetMonthlyPoints(): Promise<void> {
    await this.gamificationRepository.update({}, {
      monthlyPoints: 0,
      monthlyAdoptionsCurrent: 0,
      monthlyResetDate: new Date(),
    });
    this.logger.log('Monthly points reset completed');
  }

  async updateFeaturedBadges(ongId: string, badgeTypes: BadgeType[]): Promise<void> {
    if (badgeTypes.length > 3) {
      throw new Error('Maximum 3 featured badges allowed');
    }

    const gamification = await this.getOrCreateGamification(ongId);

    // Verificar que todos los badges están obtenidos
    const invalidBadges = badgeTypes.filter(badge => !gamification.earnedBadges.includes(badge));
    if (invalidBadges.length > 0) {
      throw new Error(`Badges not earned: ${invalidBadges.join(', ')}`);
    }

    gamification.featuredBadges = badgeTypes;
    await this.gamificationRepository.save(gamification);
  }
}