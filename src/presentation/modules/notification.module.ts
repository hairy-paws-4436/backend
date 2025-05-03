import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationEntity } from '../../infrastructure/database/mysql/entities/notification.entity';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { GetNotificationUseCase } from 'src/application/use-cases/notification/get-notification.use-case';
import { NotificationRepository } from 'src/infrastructure/database/mysql/repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    GetNotificationUseCase,
    NotificationRepository
  ],
  exports: [
    NotificationService,
    NotificationRepository
  ],
})
export class NotificationModule {}