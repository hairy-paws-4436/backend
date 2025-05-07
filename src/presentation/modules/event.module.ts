import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from '../controllers/event.controller';
import { EventEntity } from '../../infrastructure/database/mysql/entities/event.entity';

import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { EventService } from '../../application/services/event.service';
import { EventRepository } from '../../infrastructure/database/mysql/repositories/event.repository';


@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity]),
    AwsModule,
    OngModule,
    NotificationModule,
  ],
  controllers: [EventController],
  providers: [
    EventRepository,
    EventService,
  ],
  exports: [
    EventRepository,
    EventService,
  ],
})
export class EventModule {}