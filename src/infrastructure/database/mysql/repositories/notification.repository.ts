import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { INotificationRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async findAll(filters?: any): Promise<NotificationEntity[]> {
    return await this.notificationRepository.find({
      where: filters,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new EntityNotFoundException('Notificación', id);
    }

    return notification;
  }

  async findOne(filters: any): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: filters,
      relations: ['user'],
    });

    if (!notification) {
      throw new EntityNotFoundException('Notificación');
    }

    return notification;
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(entity: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const notification = this.notificationRepository.create(entity);
    const savedNotification = await this.notificationRepository.save(notification);
    
    return this.findById(savedNotification.id);
  }

  async update(id: string, entity: Partial<NotificationEntity>): Promise<NotificationEntity> {
    await this.findById(id); // Validar que existe
    await this.notificationRepository.update(id, entity);
    
    return this.findById(id);
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true }
    );
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.notificationRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.notificationRepository.count({
      where: filters,
    });
    
    return count > 0;
  }
}