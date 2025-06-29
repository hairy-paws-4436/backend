import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { PostAdoptionFollowUpEntity, FollowUpStatus } from '../entities/post-adoption-followup.entity';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class PostAdoptionFollowUpRepository {
  constructor(
    @InjectRepository(PostAdoptionFollowUpEntity)
    private readonly repository: Repository<PostAdoptionFollowUpEntity>,
  ) {}

  async findById(id: string): Promise<PostAdoptionFollowUpEntity> {
    const followUp = await this.repository.findOne({
      where: { id },
      relations: ['adoption', 'adoption.animal', 'adoption.owner', 'adopter'],
    });

    if (!followUp) {
      throw new EntityNotFoundException('Post-adoption follow-up', id);
    }

    return followUp;
  }

  async findByAdoptionId(adoptionId: string): Promise<PostAdoptionFollowUpEntity[]> {
    return await this.repository.find({
      where: { adoptionId },
      relations: ['adoption', 'adoption.animal', 'adopter'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByAdopterId(adopterId: string, status?: FollowUpStatus): Promise<PostAdoptionFollowUpEntity[]> {
    const whereCondition: any = { adopterId };
    if (status) {
      whereCondition.status = status;
    }

    return await this.repository.find({
      where: whereCondition,
      relations: ['adoption', 'adoption.animal'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findPendingReminders(maxDate?: Date): Promise<PostAdoptionFollowUpEntity[]> {
    const whereCondition: any = {
      status: FollowUpStatus.PENDING,
      reminderSent: false,
    };

    if (maxDate) {
      whereCondition.scheduledDate = LessThan(maxDate);
    }

    return await this.repository.find({
      where: whereCondition,
      relations: ['adoption', 'adoption.animal', 'adopter'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findOverdueFollowUps(daysPastDue: number = 7): Promise<PostAdoptionFollowUpEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPastDue);

    return await this.repository.find({
      where: {
        status: FollowUpStatus.PENDING,
        scheduledDate: LessThan(cutoffDate),
      },
      relations: ['adoption', 'adoption.animal', 'adopter'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async findAtRiskAdoptions(riskLevels: string[] = ['high', 'critical']): Promise<PostAdoptionFollowUpEntity[]> {
    return await this.repository
      .createQueryBuilder('followup')
      .leftJoinAndSelect('followup.adoption', 'adoption')
      .leftJoinAndSelect('adoption.animal', 'animal')
      .leftJoinAndSelect('followup.adopter', 'adopter')
      .where('followup.riskLevel IN (:...riskLevels)', { riskLevels })
      .andWhere('followup.status = :status', { status: FollowUpStatus.COMPLETED })
      .orderBy('followup.completedDate', 'DESC')
      .getMany();
  }

  async create(followUpData: Partial<PostAdoptionFollowUpEntity>): Promise<PostAdoptionFollowUpEntity> {
    const followUp = this.repository.create(followUpData);
    return await this.repository.save(followUp);
  }

  async createMany(followUpsData: Partial<PostAdoptionFollowUpEntity>[]): Promise<PostAdoptionFollowUpEntity[]> {
    const followUps = this.repository.create(followUpsData);
    return await this.repository.save(followUps);
  }

  async update(id: string, updateData: Partial<PostAdoptionFollowUpEntity>): Promise<PostAdoptionFollowUpEntity> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async markAsOverdue(cutoffDate: Date): Promise<number> {
    const result = await this.repository.update(
      {
        status: FollowUpStatus.PENDING,
        scheduledDate: LessThan(cutoffDate),
      },
      { status: FollowUpStatus.OVERDUE }
    );

    return result.affected || 0;
  }

  async getCompletionStats(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    skipped: number;
    completionRate: number;
  }> {
    let query = this.repository.createQueryBuilder('followup');

    if (startDate && endDate) {
      query = query.where('followup.scheduledDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const total = await query.getCount();

    const completed = await query
      .clone()
      .andWhere('followup.status = :status', { status: FollowUpStatus.COMPLETED })
      .getCount();

    const pending = await query
      .clone()
      .andWhere('followup.status = :status', { status: FollowUpStatus.PENDING })
      .getCount();

    const overdue = await query
      .clone()
      .andWhere('followup.status = :status', { status: FollowUpStatus.OVERDUE })
      .getCount();

    const skipped = await query
      .clone()
      .andWhere('followup.status = :status', { status: FollowUpStatus.SKIPPED })
      .getCount();

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      skipped,
      completionRate,
    };
  }

  async getAdaptationStats(startDate?: Date, endDate?: Date): Promise<{
    averageAdaptationScore: number;
    averageSatisfactionScore: number;
    riskDistribution: { [key: string]: number };
  }> {
    let query = this.repository
      .createQueryBuilder('followup')
      .where('followup.status = :status', { status: FollowUpStatus.COMPLETED });

    if (startDate && endDate) {
      query = query.andWhere('followup.completedDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const followUps = await query.getMany();

    if (followUps.length === 0) {
      return {
        averageAdaptationScore: 0,
        averageSatisfactionScore: 0,
        riskDistribution: {},
      };
    }

    // Mapear adaptation level a números para cálculo
    const adaptationScoreMap = {
      'excellent': 5,
      'good': 4,
      'fair': 3,
      'poor': 2,
      'concerning': 1,
    };

    const totalAdaptationScore = followUps.reduce((sum, f) => {
      return sum + (adaptationScoreMap[f.adaptationLevel] || 0);
    }, 0);

    const totalSatisfactionScore = followUps.reduce((sum, f) => {
      return sum + (f.satisfactionScore || 0);
    }, 0);

    const averageAdaptationScore = totalAdaptationScore / followUps.length;
    const averageSatisfactionScore = totalSatisfactionScore / followUps.length;

    // Distribución de riesgo
    const riskDistribution = followUps.reduce((dist, f) => {
      const riskLevel = f.riskLevel || 'unknown';
      dist[riskLevel] = (dist[riskLevel] || 0) + 1;
      return dist;
    }, {} as { [key: string]: number });

    return {
      averageAdaptationScore,
      averageSatisfactionScore,
      riskDistribution,
    };
  }

  async findByOngUserId(ongUserId: string, status?: FollowUpStatus): Promise<PostAdoptionFollowUpEntity[]> {
    let query = this.repository
      .createQueryBuilder('followup')
      .leftJoinAndSelect('followup.adoption', 'adoption')
      .leftJoinAndSelect('adoption.animal', 'animal')
      .leftJoinAndSelect('adoption.owner', 'owner')
      .leftJoinAndSelect('followup.adopter', 'adopter')
      .where('owner.id = :ongUserId', { ongUserId }); // Asumiendo que owner es el usuario de la ONG

    if (status) {
      query = query.andWhere('followup.status = :status', { status });
    }

    return await query
      .orderBy('followup.scheduledDate', 'DESC')
      .getMany();
  }

  async getMonthlyTrends(months: number = 6): Promise<{
    month: string;
    completed: number;
    averageSatisfaction: number;
    riskCases: number;
  }[]> {
    const trends: any[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthlyFollowUps = await this.repository.find({
        where: {
          status: FollowUpStatus.COMPLETED,
          completedDate: Between(monthStart, monthEnd),
        },
      });

      const completed = monthlyFollowUps.length;
      const averageSatisfaction = completed > 0
        ? monthlyFollowUps.reduce((sum, f) => sum + (f.satisfactionScore || 0), 0) / completed
        : 0;
      const riskCases = monthlyFollowUps.filter(f => ['high', 'critical'].includes(f.riskLevel)).length;

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        completed,
        averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
        riskCases,
      });
    }

    return trends;
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new EntityNotFoundException('Post-adoption follow-up', id);
    }
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.repository.count({ where: filters });
    return count > 0;
  }
}