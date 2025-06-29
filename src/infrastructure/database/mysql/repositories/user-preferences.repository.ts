import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferencesEntity } from '../entities/user-preferences.entity';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class UserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferencesEntity)
    private readonly repository: Repository<UserPreferencesEntity>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferencesEntity> {
    const preferences = await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!preferences) {
      throw new EntityNotFoundException('User preferences', userId);
    }

    return preferences;
  }

  async findByUserIdOptional(userId: string): Promise<UserPreferencesEntity | null> {
    return await this.repository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async create(preferencesData: Partial<UserPreferencesEntity>): Promise<UserPreferencesEntity> {
    const preferences = this.repository.create(preferencesData);
    return await this.repository.save(preferences);
  }

  async update(userId: string, updateData: Partial<UserPreferencesEntity>): Promise<UserPreferencesEntity> {
    await this.repository.update({ userId }, updateData);
    return await this.findByUserId(userId);
  }

  async delete(userId: string): Promise<void> {
    const result = await this.repository.delete({ userId });
    if (result.affected === 0) {
      throw new EntityNotFoundException('User preferences', userId);
    }
  }

  async markAsComplete(userId: string): Promise<UserPreferencesEntity> {
    await this.repository.update(
      { userId },
      {
        isComplete: true,
        completionDate: new Date(),
      }
    );
    return await this.findByUserId(userId);
  }

  async exists(userId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId },
    });
    return count > 0;
  }

  async findIncompletePreferences(): Promise<UserPreferencesEntity[]> {
    return await this.repository.find({
      where: { isComplete: false },
      relations: ['user'],
    });
  }

  async findRecentlyCompleted(days: number = 7): Promise<UserPreferencesEntity[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await this.repository
      .createQueryBuilder('preferences')
      .leftJoinAndSelect('preferences.user', 'user')
      .where('preferences.isComplete = :isComplete', { isComplete: true })
      .andWhere('preferences.completionDate >= :date', { date })
      .orderBy('preferences.completionDate', 'DESC')
      .getMany();
  }
}