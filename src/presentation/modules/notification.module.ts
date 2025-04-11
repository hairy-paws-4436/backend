import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationEntity } from '../../infrastructure/database/mysql/entities/notification.entity';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationModule {}