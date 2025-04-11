import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from '../controllers/event.controller';
import { EventEntity } from '../../infrastructure/database/mysql/entities/event.entity';
import { EventService } from 'src/application/services/event.service';
import { EventRepository } from 'src/infrastructure/database/mysql/repositories/event.repository';
import { AwsModule } from 'src/infrastructure/services/aws/aws.module';
import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';


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