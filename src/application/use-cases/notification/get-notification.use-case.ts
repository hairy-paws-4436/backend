import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../../../infrastructure/database/mysql/repositories/notification.repository';


@Injectable()
export class GetNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(notificationId: string) {
    const notification = await this.notificationRepository.findById2(notificationId);
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }
    
    return notification;
  }
}