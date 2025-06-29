import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreferencesEntity } from '../entities/notification-preferences.entity';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class NotificationPreferencesRepository {
  constructor(
    @InjectRepository(NotificationPreferencesEntity)
    private readonly repository: Repository<NotificationPreferencesEntity>,
  ) {}

  async findByUserId(userId: string): Promise<NotificationPreferencesEntity> {
    const preferences = await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!preferences) {
      throw new EntityNotFoundException('Notification preferences', userId);
    }

    return preferences;
  }

  async findByUserIdOptional(userId: string): Promise<NotificationPreferencesEntity | null> {
    return await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(preferencesData: Partial<NotificationPreferencesEntity>): Promise<NotificationPreferencesEntity> {
    const preferences = this.repository.create(preferencesData);
    return await this.repository.save(preferences);
  }

  async update(userId: string, updateData: Partial<NotificationPreferencesEntity>): Promise<NotificationPreferencesEntity> {
    await this.repository.update({ userId }, updateData);
    return await this.findByUserId(userId);
  }

  async delete(userId: string): Promise<void> {
    const result = await this.repository.delete({ userId });
    if (result.affected === 0) {
      throw new EntityNotFoundException('Notification preferences', userId);
    }
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId },
    });
    return count > 0;
  }

  async findUsersForDigest(digestType: 'daily' | 'weekly'): Promise<NotificationPreferencesEntity[]> {
    const query = this.repository.createQueryBuilder('prefs')
      .leftJoinAndSelect('prefs.user', 'user')
      .where('prefs.globalNotificationsEnabled = :enabled', { enabled: true });

    if (digestType === 'daily') {
      query.andWhere(
        '(prefs.newMatchesFrequency = :daily OR prefs.newAnimalsFrequency = :daily)',
        { daily: 'daily_digest' }
      );
    } else if (digestType === 'weekly') {
      query.andWhere(
        '(prefs.newMatchesFrequency = :weekly OR prefs.newAnimalsFrequency = :weekly OR prefs.newEventsFrequency = :weekly)',
        { weekly: 'weekly_digest' }
      );
    }

    return await query.getMany();
  }

  async updateLastDigestSent(userId: string): Promise<void> {
    await this.repository.update(
      { userId },
      { lastDigestSent: new Date() }
    );
  }
}