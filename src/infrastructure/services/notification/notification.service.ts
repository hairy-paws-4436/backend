import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../database/mysql/entities/notification.entity';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    try {
      const notification = this.notificationRepository.create({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        read: false,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
      });
      
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  async getByUserId(userId: string, unreadOnly: boolean = false): Promise<NotificationEntity[]> {
    try {
      return await this.notificationRepository.find({
        where: {
          userId,
          ...(unreadOnly && { read: false }),
        },
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching notifications: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });
      
      if (!notification) {
        throw new Error('Notification not found or does not belong to user');
      }
      
      await this.notificationRepository.update(id, { read: true });
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        { userId, read: false },
        { read: true },
      );
    } catch (error) {
      this.logger.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });
      
      if (!notification) {
        throw new Error('Notification not found or does not belong to user');
      }
      
      await this.notificationRepository.delete(id);
    } catch (error) {
      this.logger.error(`Error deleting notification: ${error.message}`);
      throw error;
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        read: false,
        referenceId,
        referenceType,
      }));
      
      await this.notificationRepository.save(notifications);
    } catch (error) {
      this.logger.error(`Error sending notifications to multiple users: ${error.message}`);
      throw error;
    }
  }

  

}
