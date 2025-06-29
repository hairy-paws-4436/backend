import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';


import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import { CompleteFollowUpDto } from '../../presentation/dtos/requests/complete-followup.dto';
import {
  AdaptationLevel,
  FollowUpStatus,
  FollowUpType, PostAdoptionFollowUpEntity,
} from '../../infrastructure/database/mysql/entities/post-adoption-followup.entity';
import { AdoptionEntity } from '../../infrastructure/database/mysql/entities/adoption.entity';


@Injectable()
export class PostAdoptionFollowUpService {
  private readonly logger = new Logger(PostAdoptionFollowUpService.name);

  constructor(
    @InjectRepository(PostAdoptionFollowUpEntity)
    private readonly followUpRepository: Repository<PostAdoptionFollowUpEntity>,

    @InjectRepository(AdoptionEntity)
    private readonly adoptionRepository: Repository<AdoptionEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async createFollowUpSchedule(adoptionId: string): Promise<void> {
    try {
      const adoption = await this.adoptionRepository.findOne({
        where: { id: adoptionId },
        relations: ['adopter', 'animal', 'owner'],
      });

      if (!adoption) {
        throw new Error('Adoption not found');
      }

      const baseDate = adoption.approvalDate || new Date();
      const followUps = [
        { type: FollowUpType.INITIAL_3_DAYS, days: 3 },
        { type: FollowUpType.WEEK_1, days: 7 },
        { type: FollowUpType.WEEK_2, days: 14 },
        { type: FollowUpType.MONTH_1, days: 30 },
        { type: FollowUpType.MONTH_3, days: 90 },
        { type: FollowUpType.MONTH_6, days: 180 },
        { type: FollowUpType.YEAR_1, days: 365 },
      ];

      for (const followUp of followUps) {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setDate(scheduledDate.getDate() + followUp.days);

        const followUpEntity = this.followUpRepository.create({
          adoptionId,
          adopterId: adoption.adopterId,
          followUpType: followUp.type,
          status: FollowUpStatus.PENDING,
          scheduledDate,
        });

        await this.followUpRepository.save(followUpEntity);
      }

      this.logger.log(`Follow-up schedule created for adoption ${adoptionId}`);
    } catch (error) {
      this.logger.error(`Error creating follow-up schedule: ${error.message}`);
      throw error;
    }
  }

  async getUserFollowUps(userId: string, status?: string): Promise<PostAdoptionFollowUpEntity[]> {
    const whereCondition: any = { adopterId: userId };

    if (status) {
      whereCondition.status = status as FollowUpStatus;
    }

    return await this.followUpRepository.find({
      where: whereCondition,
      relations: ['adoption', 'adoption.animal'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async getFollowUpById(followUpId: string): Promise<PostAdoptionFollowUpEntity> {
    const followUp = await this.followUpRepository.findOne({
      where: { id: followUpId },
      relations: ['adoption', 'adoption.animal', 'adopter'],
    });

    if (!followUp) {
      throw new Error('Follow-up not found');
    }

    return followUp;
  }

  async completeFollowUp(
    followUpId: string,
    userId: string,
    dto: CompleteFollowUpDto,
  ): Promise<{
    followUp: PostAdoptionFollowUpEntity;
    riskAssessment: string;
    recommendations: string[];
  }> {
    const followUp = await this.getFollowUpById(followUpId);

    if (followUp.adopterId !== userId) {
      throw new Error('Unauthorized to complete this follow-up');
    }

    if (followUp.status === FollowUpStatus.COMPLETED) {
      throw new Error('Follow-up already completed');
    }

    // Actualizar follow-up con respuestas
    Object.assign(followUp, dto);
    followUp.status = FollowUpStatus.COMPLETED;
    followUp.completedDate = new Date();

    // Evaluar riesgo y generar recomendaciones
    const riskAssessment = this.assessRisk(dto);
    const recommendations = this.generateRecommendations(dto, riskAssessment);

    followUp.riskLevel = riskAssessment;
    followUp.followUpRequired = this.needsAdditionalFollowUp(dto, riskAssessment);

    const savedFollowUp = await this.followUpRepository.save(followUp);

    // Notificar a la ONG si hay problemas
    if (riskAssessment === 'high' || riskAssessment === 'critical') {
      await this.notifyOngAboutRisk(followUp, riskAssessment);
    }

    // Programar seguimiento adicional si es necesario
    if (followUp.followUpRequired) {
      await this.scheduleAdditionalFollowUp(followUp);
    }

    return {
      followUp: savedFollowUp,
      riskAssessment,
      recommendations,
    };
  }

  async skipFollowUp(followUpId: string, userId: string): Promise<void> {
    const followUp = await this.getFollowUpById(followUpId);

    if (followUp.adopterId !== userId) {
      throw new Error('Unauthorized to skip this follow-up');
    }

    followUp.status = FollowUpStatus.SKIPPED;
    await this.followUpRepository.save(followUp);
  }

  async sendPendingReminders(): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    try {
      // Buscar seguimientos pendientes que necesitan recordatorio
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const pendingFollowUps = await this.followUpRepository.find({
        where: {
          status: FollowUpStatus.PENDING,
          scheduledDate: LessThan(now),
          reminderSent: false,
        },
        relations: ['adopter', 'adoption', 'adoption.animal'],
      });

      for (const followUp of pendingFollowUps) {
        try {
          await this.sendFollowUpReminder(followUp);
          sent++;
        } catch (error) {
          this.logger.error(`Error sending reminder for follow-up ${followUp.id}: ${error.message}`);
          errors++;
        }
      }

      // Marcar como vencidos los que tienen más de 7 días
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      await this.followUpRepository.update(
        {
          status: FollowUpStatus.PENDING,
          scheduledDate: LessThan(sevenDaysAgo),
        },
        { status: FollowUpStatus.OVERDUE }
      );

    } catch (error) {
      this.logger.error(`Error in sendPendingReminders: ${error.message}`);
      errors++;
    }

    return { sent, errors };
  }

  async getOngDashboard(userId: string): Promise<any> {
    // TODO: Obtener ongId del userId
    const ongId = await this.getOngIdFromUserId(userId);

    const totalFollowUps = await this.followUpRepository.count({
      where: { adoption: { ownerId: userId } }, // Aproximación
    });

    const completedFollowUps = await this.followUpRepository.count({
      where: {
        adoption: { ownerId: userId },
        status: FollowUpStatus.COMPLETED
      },
    });

    const pendingFollowUps = await this.followUpRepository.count({
      where: {
        adoption: { ownerId: userId },
        status: FollowUpStatus.PENDING
      },
    });

    const atRiskAdoptions = await this.followUpRepository.count({
      where: {
        adoption: { ownerId: userId },
        riskLevel: 'high'
      },
    });

    return {
      totalFollowUps,
      completedFollowUps,
      pendingFollowUps,
      atRiskAdoptions,
      completionRate: totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0,
    };
  }

  async getOngAnalytics(userId: string, period: string): Promise<any> {
    // TODO: Implementar análisis detallado
    return {
      period,
      adoptionSuccessRate: 85,
      averageAdaptationScore: 8.2,
      commonIssues: [
        { issue: 'Ansiedad por separación', frequency: 15 },
        { issue: 'Problemas de alimentación', frequency: 8 },
        { issue: 'Socialización', frequency: 12 },
      ],
      satisfactionTrend: [7.5, 8.0, 8.2, 8.5, 8.3],
    };
  }

  async getAtRiskAdoptions(userId: string): Promise<PostAdoptionFollowUpEntity[]> {
    return await this.followUpRepository.find({
      where: {
        adoption: { ownerId: userId },
        riskLevel: 'high',
      },
      relations: ['adoption', 'adoption.animal', 'adopter'],
      order: { completedDate: 'DESC' },
    });
  }

  async initiateIntervention(
    followUpId: string,
    ongUserId: string,
    interventionType: string,
    notes: string,
  ): Promise<any> {
    const followUp = await this.getFollowUpById(followUpId);

    // TODO: Crear sistema de intervenciones
    // Por ahora solo enviar notificación al adoptante

    await this.notificationService.create({
      userId: followUp.adopterId,
      type: NotificationType.GENERAL,
      title: '🤝 Apoyo disponible',
      message: `La ${followUp.adoption.owner?.firstName || 'ONG'} te ha contactado para brindarte apoyo adicional con la adaptación de tu mascota. Revisa tus mensajes para más detalles.`,
      referenceId: followUpId,
      referenceType: 'intervention',
    });

    return {
      interventionType,
      notes,
      initiatedBy: ongUserId,
      initiatedAt: new Date(),
    };
  }

  async getGlobalStats(): Promise<any> {
    const totalFollowUps = await this.followUpRepository.count();
    const completedFollowUps = await this.followUpRepository.count({
      where: { status: FollowUpStatus.COMPLETED },
    });
    const atRiskCount = await this.followUpRepository.count({
      where: { riskLevel: 'high' },
    });

    return {
      totalFollowUps,
      completedFollowUps,
      completionRate: totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0,
      atRiskAdoptions: atRiskCount,
      averageSatisfactionScore: 8.3, // TODO: Calcular real
    };
  }

  private assessRisk(dto: CompleteFollowUpDto): string {
    let riskScore = 0;

    // Factores de riesgo
    if (dto.adaptationLevel === AdaptationLevel.POOR) riskScore += 3;
    if (dto.adaptationLevel === AdaptationLevel.CONCERNING) riskScore += 5;

    if (!dto.eatingWell) riskScore += 2;
    if (!dto.sleepingWell) riskScore += 1;
    if (!dto.usingBathroomProperly) riskScore += 2;
    if (!dto.showingAffection) riskScore += 1;

    if (dto.behavioralIssues && dto.behavioralIssues.length > 0) {
      riskScore += dto.behavioralIssues.length;
    }

    if (dto.healthConcerns && dto.healthConcerns.length > 0) {
      riskScore += dto.healthConcerns.length * 0.5;
    }

    if (dto.satisfactionScore <= 5) riskScore += 3;
    if (dto.satisfactionScore <= 3) riskScore += 2;

    if (dto.needsSupport) riskScore += 1;

    // Determinar nivel de riesgo
    if (riskScore >= 8) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private generateRecommendations(dto: CompleteFollowUpDto, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (!dto.eatingWell) {
      recommendations.push('Consulta con un veterinario sobre la alimentación');
      recommendations.push('Intenta diferentes tipos de comida o horarios');
    }

    if (!dto.sleepingWell) {
      recommendations.push('Crea un ambiente tranquilo para dormir');
      recommendations.push('Establece una rutina de sueño consistente');
    }

    if (!dto.usingBathroomProperly) {
      recommendations.push('Refuerza el entrenamiento de baño con recompensas');
      recommendations.push('Aumenta la frecuencia de salidas');
    }

    if (dto.behavioralIssues?.includes('ansiedad por separación')) {
      recommendations.push('Practica salidas cortas y gradualmente aumenta el tiempo');
      recommendations.push('Considera juguetes interactivos para mantenerlo ocupado');
    }

    if (dto.satisfactionScore <= 5) {
      recommendations.push('Programa una llamada con la ONG para apoyo adicional');
      recommendations.push('Considera entrenamiento profesional');
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('⚠️ Contacta inmediatamente con la ONG para apoyo');
      recommendations.push('Considera una evaluación veterinaria completa');
    }

    return recommendations;
  }

  private needsAdditionalFollowUp(dto: CompleteFollowUpDto, riskLevel: string): boolean {
    return <boolean>(
      riskLevel === 'high' ||
      riskLevel === 'critical' ||
      dto.needsSupport ||
      dto.satisfactionScore <= 5 ||
      (dto.behavioralIssues && dto.behavioralIssues.length > 2)
    );
  }

  private async sendFollowUpReminder(followUp: PostAdoptionFollowUpEntity): Promise<void> {
    const daysOverdue = Math.floor(
      (new Date().getTime() - followUp.scheduledDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    await this.notificationService.create({
      userId: followUp.adopterId,
      type: NotificationType.GENERAL,
      title: '📋 Seguimiento de adopción pendiente',
      message: `Tienes un seguimiento pendiente sobre ${followUp.adoption?.animal?.name || 'tu mascota'}. Tu experiencia es importante para nosotros. ¡Solo tomará 5 minutos!`,
      referenceId: followUp.id,
      referenceType: 'followup',
    });

    followUp.reminderSent = true;
    followUp.reminderCount += 1;
    followUp.lastReminderDate = new Date();
    await this.followUpRepository.save(followUp);
  }

  private async notifyOngAboutRisk(
    followUp: PostAdoptionFollowUpEntity,
    riskLevel: string,
  ): Promise<void> {
    // TODO: Obtener userId de la ONG
    const ongUserId = await this.getOngUserIdFromAdoption(followUp.adoptionId);

    if (ongUserId) {
      await this.notificationService.create({
        userId: ongUserId,
        type: NotificationType.GENERAL,
        title: '⚠️ Adopción requiere atención',
        message: `Una de tus adopciones ha sido marcada como riesgo ${riskLevel}. Se recomienda contactar al adoptante para brindar apoyo.`,
        referenceId: followUp.id,
        referenceType: 'risk_alert',
      });
    }
  }

  private async scheduleAdditionalFollowUp(followUp: PostAdoptionFollowUpEntity): Promise<void> {
    const nextFollowUpDate = new Date();
    nextFollowUpDate.setDate(nextFollowUpDate.getDate() + 7); // Seguimiento en 1 semana

    const additionalFollowUp = this.followUpRepository.create({
      adoptionId: followUp.adoptionId,
      adopterId: followUp.adopterId,
      followUpType: FollowUpType.CUSTOM,
      status: FollowUpStatus.PENDING,
      scheduledDate: nextFollowUpDate,
    });

    await this.followUpRepository.save(additionalFollowUp);
  }

  private async getOngIdFromUserId(userId: string): Promise<string | null> {
    // TODO: Implementar lógica para obtener ongId del userId
    return null;
  }

  private async getOngUserIdFromAdoption(adoptionId: string): Promise<string | null> {
    // TODO: Implementar lógica para obtener userId de la ONG desde la adopción
    return null;
  }
}